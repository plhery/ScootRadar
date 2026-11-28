"""Regression for the quit/claim race, with all app control mocked."""
import fcntl
import io
import itertools
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import threading
import unittest
import uuid
from unittest.mock import patch
from worker import relaunch,save,wait_interval,query,serve,warm_available,warm_helper,prepare_warm,run_map_control,JobDeadline,LaunchFailed,\
    note_warm_restoration,prune,journal,status_report,windowserver_ports,new_crash_reports
import worker
import time
import urllib.error

class WorkerTests(unittest.TestCase):
    def warm_root(self,name):
        root=Path(name);base=root/'producer';(base/'session').mkdir(parents=True);(base/'results').mkdir()
        save(base/'session/status.json',{'bridgeStage':'bridge-active','paused':False})
        job={'version':1,'id':'a'*32,'cityId':43,'latitude':59.744,'longitude':10.205,'radius':1,'expiresAt':time.time()+120}
        return root,base,job

    class Resident:
        """Map Control's serve mode, in a thread: holds the lock and answers each new request with the next reply."""
        def __init__(self,base,replies):
            self.base=base;self.replies=list(replies);self.requests=[];self.lock=None;self.done=threading.Event()
            self.thread=threading.Thread(target=self.serve,daemon=True)
        def start(self,*_args,**_kwargs):
            self.lock=os.open(self.base/'map-control.lock',os.O_RDWR|os.O_CREAT,0o600);fcntl.flock(self.lock,fcntl.LOCK_EX)
            save(self.base/'map-control-ready.json',{'pid':4242,'startedAt':time.time()})
            self.thread.start()
        def stop(self):
            self.done.set()
            if self.lock is not None:os.close(self.lock);self.lock=None
        def serve(self):
            handled=None
            while not self.done.wait(.01):
                try:request=json.loads((self.base/'map-control-request.json').read_text())
                except (FileNotFoundError,ValueError):continue
                if request['id']==handled:continue
                handled=request['id'];self.requests.append(request)
                if self.replies:
                    (self.base/'map-control-results').mkdir(exist_ok=True)
                    save(self.base/'map-control-results'/f"{request['id']}.json",self.replies.pop(0))

    def test_map_control_is_started_once_through_launchservices_and_then_asked(self):
        # Until 27 November 2026 the worker launched Map Control for each command, and WindowServer kept a
        # Mach port for each launch; on 26 November its full port table ended the user's session.
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name);opened=[]
            resident=self.Resident(base,[{'trusted':True},{'prepared':True,'minimizedBy':'button','minimizePress':0},
                {'error':'unsafe-window','minimizedBy':'attribute','minimized':False,'hidden':False,'focusRestored':True},{'error':'permission-required'}])
            def run(command,**kwargs):
                opened.append(command);resident.start()
                return subprocess.CompletedProcess(command,0,stdout='')
            try:
                with patch('worker.subprocess.run',side_effect=run):
                    self.assertEqual(run_map_control(root,'status'),{'trusted':True})
                    self.assertEqual(run_map_control(root,'prepare'),{'prepared':True,'minimizedBy':'button','minimizePress':0})
                    for _ in range(2):
                        with self.assertRaises(ValueError):run_map_control(root,'refresh')
            finally:resident.stop()
            self.assertEqual(opened,[['/usr/bin/open','-n','-g',str(root/'Ryde Map Control.app'),'--args','serve']])
            self.assertEqual([r['action'] for r in resident.requests],['status','prepare','refresh','refresh'])
            for request in resident.requests:self.assertLessEqual(request['expiresAt'],time.time()+12)
            self.assertEqual(len({r['id'] for r in resident.requests}),4)
            self.assertEqual(list((base/'map-control-results').iterdir()),[])
            self.assertFalse((base/'map-control-request.json').exists())
            events=[json.loads(line) for line in (base/'map-control.jsonl').read_text().splitlines()]
            self.assertEqual([(e['action'],e['answer']) for e in events],[('start','serving'),('status','ok'),('prepare','ok'),
                ('refresh','unsafe-window'),('refresh','permission-required')])
            # How Ryde's window was minimized, or why it was not.
            self.assertEqual(events[2]['minimizedBy'],'button');self.assertEqual(events[2]['minimizePress'],0)
            self.assertEqual({k:events[3].get(k) for k in ['minimizedBy','minimized','hidden','focusRestored']},
                {'minimizedBy':'attribute','minimized':False,'hidden':False,'focusRestored':None})
            with self.assertRaises(ValueError):run_map_control(root,'show')

    def test_a_map_control_that_cannot_be_stopped_is_not_waited_on_for_ten_minutes(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name);self.addCleanup(setattr,worker,'map_control_unstoppable',0.0)
            resident=self.Resident(base,[]);resident.start();(base/'map-control-ready.json').unlink()
            try:
                with patch('worker.MAP_CONTROL_REPLY',.3),patch('worker.os.kill') as kill:
                    with self.assertRaisesRegex(ValueError,'no reply'):run_map_control(root,'status')
                    kill.assert_not_called()
                    began=time.time()
                    with self.assertRaisesRegex(ValueError,'could not be stopped'):run_map_control(root,'status')
                    self.assertLess(time.time()-began,.2)
                    worker.map_control_unstoppable-=600
                    with self.assertRaisesRegex(ValueError,'no reply'):run_map_control(root,'status')
            finally:resident.stop()
            answers=[e['answer'] for e in map(json.loads,(base/'map-control.jsonl').read_text().splitlines())]
            self.assertEqual(answers,['no-reply','unstoppable','no-reply'])

    def test_a_refresh_stopped_before_its_answer_pauses_warm_reads(self):
        # It may have left Ryde in front of the user's app.
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name)
            save(base/'warm-control.json',{'enabled':True,'mode':'minimized-idle'})
            resident=self.Resident(base,[]);resident.start()
            try:
                with patch('worker.MAP_CONTROL_REPLY',.3),patch('worker.stop_map_control',side_effect=lambda _base:resident.stop()):
                    with self.assertRaisesRegex(ValueError,'no reply'):run_map_control(root,'refresh')
            finally:resident.stop()
            control=json.loads((base/'warm-control.json').read_text())
            self.assertEqual(control['restorationFailures'],1);self.assertGreater(control['pausedUntil'],time.time()+3500)

    def test_a_silent_map_control_is_stopped_and_started_again_at_most_every_ten_minutes(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name);worker.abnormal.clear()
            resident=self.Resident(base,[]);resident.start();killed=[];opened=[]
            def run(command,**kwargs):
                if command[0]=='/bin/ps':
                    self.assertEqual(command,['/bin/ps','-p','4242','-o','comm='])
                    return subprocess.CompletedProcess(command,0,stdout=str(root/'Ryde Map Control.app/Contents/MacOS/RydeMapControl')+'\n')
                opened.append(command);return subprocess.CompletedProcess(command,0,stdout='')
            def kill(pid,number):killed.append((pid,number));resident.stop()
            try:
                with patch('worker.MAP_CONTROL_REPLY',.3),patch('worker.subprocess.run',side_effect=run),patch('worker.os.kill',side_effect=kill):
                    with self.assertRaisesRegex(ValueError,'no reply'):run_map_control(root,'status')
                    self.assertEqual(killed,[(4242,signal.SIGTERM)])
                    save(base/'map-control-started.json',{'at':time.time()-590})
                    with self.assertRaisesRegex(ValueError,'not running'):run_map_control(root,'refresh')
                    self.assertEqual(opened,[])
                    save(base/'map-control-started.json',{'at':time.time()-610})
                    resident=self.Resident(base,[{'dispatched':True}]);opens=lambda command,**kwargs:(opened.append(command),resident.start())
                    with patch('worker.subprocess.run',side_effect=opens):
                        self.assertEqual(run_map_control(root,'refresh'),{'dispatched':True})
                    self.assertEqual(len(opened),1);resident.stop()
                    # Not started again until ten minutes after that start.
                    with self.assertRaisesRegex(ValueError,'not running'):run_map_control(root,'refresh')
                    self.assertEqual(len(opened),1)
            finally:resident.stop()
            answers=[(e['action'],e['answer']) for e in map(json.loads,(base/'map-control.jsonl').read_text().splitlines())]
            self.assertEqual(answers,[('status','no-reply'),('refresh','not-running'),('start','serving'),('refresh','ok'),('refresh','not-running')])
            self.assertEqual(worker.abnormal,[])

    def test_only_map_control_is_stopped(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name)
            save(base/'map-control-ready.json',{'pid':4242,'startedAt':time.time()})
            with patch('worker.subprocess.run',return_value=subprocess.CompletedProcess([],0,stdout='/usr/bin/caffeinate\n')), \
                 patch('worker.os.kill') as kill:
                worker.stop_map_control(base)
            kill.assert_not_called()

    def test_warm_admission_requires_opt_in_idle_permission_and_eligible_route(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name)
            helper=warm_helper(root);helper.parent.mkdir(parents=True);helper.touch()
            good={'trusted':True,'singleInstance':True,'idleEligible':True,'minimizedRefresh':True,'locked':False}
            with patch('worker.egress.warm_ready',return_value=True) as route,patch('worker.run_map_control') as run:
                self.assertFalse(warm_available(root));route.assert_not_called()
                save(base/'warm-control.json',{'enabled':True})
                self.assertFalse(warm_available(root));route.assert_not_called()
                save(base/'warm-control.json',{'enabled':True,'mode':'minimized-idle','pausedUntil':time.time()+300})
                self.assertFalse(warm_available(root));route.assert_not_called()
                save(base/'warm-control.json',{'enabled':True,'mode':'minimized-idle'})
                run.return_value=good
                self.assertTrue(warm_available(root))
                for key in good:
                    run.return_value={**good,key:not good[key]}
                    self.assertFalse(warm_available(root),key)
                run.side_effect=ValueError('Map Control is not running')
                self.assertFalse(warm_available(root))
                self.assertEqual(json.loads((base/'last-warm-admission.json').read_text())['reason'],'helper-unavailable')
                route.return_value=False;run.reset_mock()
                self.assertFalse(warm_available(root));run.assert_not_called()

    def test_prepare_failure_does_not_invalidate_an_already_published_map(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,_=self.warm_root(name)
            helper=warm_helper(root);helper.parent.mkdir(parents=True);helper.touch()
            save(base/'warm-control.json',{'enabled':True,'mode':'minimized-idle'})
            with patch('worker.run_map_control',side_effect=ValueError('Map Control gave no reply')) as run:
                prepare_warm(root)
            self.assertEqual(run.call_args.args[1],'prepare')

    def test_a_cold_read_does_not_ask_map_control_before_ryde_has_a_window(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);result={'id':job['id'],'scooters':[]}
            def restart(_root,arm):arm();save(base/'results'/f"{job['id']}.json",result)
            with patch('worker.warm_available',return_value=False),patch('worker.relaunch',side_effect=restart), \
                 patch('worker.run_map_control') as run:
                self.assertEqual(query(job,root),result)
            run.assert_not_called()

    def test_warm_query_uses_a_fresh_job_without_quitting_or_changing_route(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);result={'id':job['id'],'scooters':[]}
            def run(_root,action):
                self.assertEqual(action,'refresh')
                self.assertEqual(json.loads((base/'job.json').read_text()),job)
                save(base/'results'/f"{job['id']}.json",result)
                return {'dispatched':True,'trigger':'minimized-activation','focusRestored':True,'stayedMinimized':True,'cursorPreserved':True}
            with patch('worker.warm_available',return_value=True),patch('worker.run_map_control',side_effect=run),patch('worker.relaunch') as cold:
                self.assertEqual(query(job,root),result)
            cold.assert_not_called()

    def test_legacy_transport_recovery_waits_for_proxy_confirmation_before_arming(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name)
            save(base/'session/status.json',{'bridgeStage':'bridge-active','paused':True,'pauseReason':'transport'})
            calls=[];result={'id':job['id'],'scooters':[]}
            def restart(_root,arm=None):
                calls.append('restart')
                if arm:
                    self.assertEqual(calls,['restart','verified','restart'])
                    arm();save(base/'results'/f"{job['id']}.json",result)
            def recover(_root,action):
                self.assertEqual(action,'prepare');self.assertFalse((base/'job.json').exists())
                calls.append('verified')
                save(base/'session/status.json',{'bridgeStage':'bridge-active','paused':False})
            with patch('worker.relaunch',side_effect=restart),patch('worker.run_map_control',side_effect=recover):
                self.assertEqual(query(job,root),result)

    def test_key_renewal_hold_is_never_restarted_as_transport_recovery(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name)
            save(base/'session/status.json',{'bridgeStage':'bridge-active','paused':True,'pauseReason':'renewal'})
            with patch('worker.relaunch') as restart:
                with self.assertRaises(RuntimeError):query(job,root)
            restart.assert_not_called()

    def test_interrupted_warm_trigger_never_quits_a_live_native_read(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);result={'id':job['id'],'scooters':[]}
            def pending(*args):
                save(base/'results'/f"{job['id']}.json",result);return False
            with patch('worker.warm_available',return_value=True),patch('worker.run_map_control',side_effect=subprocess.TimeoutExpired('refresh',5)), \
                 patch('worker.cold_fallback_ready',side_effect=pending),patch('worker.relaunch') as cold:
                self.assertEqual(query(job,root),result)
            cold.assert_not_called()

    def test_failed_warm_trigger_restarts_only_after_the_proxy_disarms_it(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);result={'id':job['id'],'scooters':[]};order=[]
            def safe(*args):order.append('proxy-disarmed');return True
            def restart(_root,arm):
                self.assertEqual(order,['proxy-disarmed']);arm();save(base/'results'/f"{job['id']}.json",result)
            with patch('worker.warm_available',return_value=True),patch('worker.run_map_control',side_effect=subprocess.CalledProcessError(4,'refresh')), \
                 patch('worker.cold_fallback_ready',side_effect=safe),patch('worker.relaunch',side_effect=restart):
                self.assertEqual(query(job,root),result)

    def test_silent_warm_trigger_falls_back_once_after_eight_seconds(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);result={'id':job['id'],'scooters':[]}
            clock=[time.time()];start=clock[0]
            def restart(_root,arm):
                self.assertGreaterEqual(clock[0]-start,8)
                arm();save(base/'results'/f"{job['id']}.json",result)
            reply={'dispatched':True,'focusRestored':True,'stayedMinimized':True,'cursorPreserved':True}
            with patch('worker.warm_available',return_value=True),patch('worker.run_map_control',return_value=reply), \
                 patch('worker.cold_fallback_ready',return_value=True) as disarm,patch('worker.relaunch',side_effect=restart) as cold, \
                 patch('worker.time.time',side_effect=lambda:clock[0]),patch('worker.time.sleep',side_effect=lambda n:clock.__setitem__(0,clock[0]+n)):
                self.assertEqual(query(job,root),result)
            cold.assert_called_once();disarm.assert_called_once()

    def test_slow_claimed_warm_read_is_never_restarted(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);result={'id':job['id'],'scooters':[]}
            clock=[time.time()];start=clock[0]
            def sleep(n):
                clock[0]+=n
                if clock[0]-start>=10:save(base/'results'/f"{job['id']}.json",result)
            reply={'dispatched':True,'focusRestored':True,'stayedMinimized':True,'cursorPreserved':True}
            with patch('worker.warm_available',return_value=True),patch('worker.run_map_control',return_value=reply), \
                 patch('worker.cold_fallback_ready',return_value=False),patch('worker.relaunch') as cold, \
                 patch('worker.time.time',side_effect=lambda:clock[0]),patch('worker.time.sleep',side_effect=sleep):
                self.assertEqual(query(job,root),result)
            cold.assert_not_called()

    def test_stuck_app_force_quit_requires_proxy_ack_and_confirmed_termination(self):
        # The helper either gives up (exit 1) or hangs past its timeout, as behind Ryde's alert on 27 Nov.
        stuck=[lambda command:subprocess.CalledProcessError(1,command),lambda command:subprocess.TimeoutExpired(command,12)]
        for (safe,force_ok),quit_error in itertools.product([(True,True),(False,True),(True,False)],stuck):
            with self.subTest(safe=safe,force_ok=force_ok,quit_error=quit_error),tempfile.TemporaryDirectory() as name:
                root=Path(name);base=root/'producer';base.mkdir()
                save(root/'config.json',{'appBinary':'/test/Ryde.app/Ryde'})
                save(base/'proxy-ready.json',{'pid':os.getpid()});save(root/'transport-status.json',{'proxyPid':os.getpid()})
                order=[]
                def run(command,**kwargs):
                    action=command[1]
                    if action=='quit':
                        order.append('quit');raise quit_error(command)
                    if action=='force-quit':
                        self.assertTrue(safe);self.assertEqual(order,['quit','proxy-safe'])
                        order.append('force-quit')
                        if not force_ok:raise subprocess.CalledProcessError(1,command)
                    if action=='open':order.append('open')
                    return subprocess.CompletedProcess(command,0,stdout='{}')
                def ack(*args):order.append('proxy-safe');return safe
                with patch('worker.subprocess.run',side_effect=run),patch('worker.cold_fallback_ready',side_effect=ack), \
                     patch('worker.egress.begin_cycle',side_effect=lambda _:order.append('route')):
                    if safe and force_ok:
                        relaunch(root,lambda:order.append('arm'))
                        self.assertEqual(order,['quit','proxy-safe','force-quit','route','arm','open'])
                    else:
                        with self.assertRaises((RuntimeError,subprocess.CalledProcessError)):
                            relaunch(root,lambda:order.append('arm'))
                        self.assertNotIn('arm',order);self.assertNotIn('route',order);self.assertNotIn('open',order)
                        if not safe:self.assertNotIn('force-quit',order)

    def test_opens_the_installed_app_when_a_restart_of_the_mac_emptied_the_unpacked_one(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name);(root/'producer').mkdir();unpacked=root/'X/Wrapper/Ryde.app';unpacked.mkdir(parents=True)
            save(root/'config.json',{'appBinary':str(unpacked/'Ryde')})
            save(root/'producer/proxy-ready.json',{'pid':os.getpid()});save(root/'transport-status.json',{'proxyPid':os.getpid()})
            opened=[]
            def run(command,**kwargs):
                if command[1]=='open':opened.append(command[2])
                return subprocess.CompletedProcess(command,0,stdout='{}')
            with patch('worker.subprocess.run',side_effect=run),patch('worker.egress.begin_cycle'), \
                 patch('worker.INSTALLED_APP',root/'Applications/Ryde.app'):
                relaunch(root)
                unpacked.rmdir()
                relaunch(root)
            self.assertEqual(opened,[str(unpacked),str(root/'Applications/Ryde.app')])

    def relaunch_root(self,name):
        root=Path(name);(root/'producer').mkdir();unpacked=root/'X/Wrapper/Ryde.app';unpacked.mkdir(parents=True)
        save(root/'config.json',{'appBinary':str(unpacked/'Ryde')})
        save(root/'producer/proxy-ready.json',{'pid':os.getpid()});save(root/'transport-status.json',{'proxyPid':os.getpid()})
        return root

    def test_a_launch_job_runningboard_left_behind_is_removed_and_ryde_opened_again(self):
        with tempfile.TemporaryDirectory() as name:
            root=self.relaunch_root(name);calls=[]
            listed=('PID\tStatus\tLabel\n-\t0\tapplication.com.ryde.NewRyde.16394764.16394858\n'
                '812\t0\tapplication.com.ryde.NewRydeWidget.1.2\n-\t0\tapplication.com.example.Other.1.2\n')
            def run(command,**kwargs):
                calls.append(command[1:])
                if command[1]=='open' and not any(c[0]=='remove' for c in calls):
                    raise subprocess.CalledProcessError(1,command)
                return subprocess.CompletedProcess(command,0,stdout=listed if command[1]=='list' else '{}')
            with patch('worker.subprocess.run',side_effect=run),patch('worker.egress.begin_cycle'):
                relaunch(root)
            self.assertEqual([c for c in calls if c[0]!='status'],[['quit'],['open',str(root/'X/Wrapper/Ryde.app')],['list'],
                ['remove','application.com.ryde.NewRyde.16394764.16394858'],['open',str(root/'X/Wrapper/Ryde.app')]])
            phases=[json.loads(line)['phase'] for line in (root/'producer/lifecycle.jsonl').read_text().splitlines()]
            self.assertEqual(phases,['before-quit','after-quit','stale-launch-job-removed','after-open'])

    def test_a_failed_open_says_why_in_the_journal_and_the_error(self):
        with tempfile.TemporaryDirectory() as name:
            root=self.relaunch_root(name)
            def run(command,**kwargs):
                if command[1]=='open':raise subprocess.CalledProcessError(1,command,stderr='NSOSStatusErrorDomain -10810: Launch failed\n')
                return subprocess.CompletedProcess(command,0,stdout='PID\tStatus\tLabel\n' if command[1]=='list' else '{}')
            with patch('worker.subprocess.run',side_effect=run),patch('worker.egress.begin_cycle'):
                with self.assertRaises(LaunchFailed) as caught:relaunch(root)
            self.assertEqual(str(caught.exception),'CalledProcessError: NSOSStatusErrorDomain -10810: Launch failed')
            last=json.loads((root/'producer/lifecycle.jsonl').read_text().splitlines()[-1])
            self.assertEqual((last['phase'],last['error']),('open-failed',str(caught.exception)))

    def test_a_failed_open_with_no_launch_job_left_behind_is_still_a_failure(self):
        with tempfile.TemporaryDirectory() as name:
            root=self.relaunch_root(name);calls=[]
            def run(command,**kwargs):
                calls.append(command[1:])
                if command[1]=='open':raise subprocess.CalledProcessError(1,command)
                listed='PID\tStatus\tLabel\n4321\t0\tapplication.com.ryde.NewRyde.16394764.16394858\n'
                return subprocess.CompletedProcess(command,0,stdout=listed if command[1]=='list' else '{}')
            with patch('worker.subprocess.run',side_effect=run),patch('worker.egress.begin_cycle'):
                with self.assertRaises(LaunchFailed):relaunch(root)
            self.assertEqual([c[0] for c in calls if c[0]!='status'],['quit','open','list'])

    def test_expiring_broker_job_does_not_launch_or_activate_ryde(self):
        with tempfile.TemporaryDirectory() as name:
            root,base,job=self.warm_root(name);job['expiresAt']=time.time()+2
            with patch('worker.relaunch') as restart,patch('worker.warm_available') as warm:
                with self.assertRaises(JobDeadline):query(job,root)
            restart.assert_not_called();warm.assert_not_called()
            self.assertFalse((base/'job.json').exists())

    def test_long_idle_backoff_yields_to_an_operator_stop(self):
        with tempfile.TemporaryDirectory() as name:
            stop=Path(name)/'stop.json'
            sleeps=[]
            def sleep(seconds):
                sleeps.append(seconds);stop.write_text('{}')
            with patch('worker.time.sleep',side_effect=sleep):
                self.assertTrue(wait_interval(120,stop))
            self.assertEqual(len(sleeps),1);self.assertLessEqual(sleeps[0],1)

    def test_late_launch_callback_does_not_discard_a_successful_native_reply(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name);base=root/'producer';(base/'session').mkdir(parents=True);(base/'results').mkdir()
            (root/'config.json').write_text(json.dumps({'appBinary':'/test/Ryde.app/Ryde'}))
            (base/'proxy-ready.json').write_text(json.dumps({'pid':os.getpid()}))
            (root/'transport-status.json').write_text(json.dumps({'proxyPid':os.getpid()}))
            (base/'session/status.json').write_text(json.dumps({'bridgeStage':'bridge-active','paused':False}))
            job={'version':1,'id':'a'*32,'cityId':43,'latitude':59.744,'longitude':10.205,'radius':1,'expiresAt':time.time()+120}
            result={'id':job['id'],'scooters':[]}
            opens=[]
            def run(command,**kwargs):
                if command[1]=='open':
                    opens.append(command)
                    save(base/'results'/f"{job['id']}.json",result)
                    raise subprocess.TimeoutExpired(command,15)
                if command[1]=='status':raise subprocess.TimeoutExpired(command,5)
                return subprocess.CompletedProcess(command,0,stdout='{}')
            with patch('worker.subprocess.run',side_effect=run),patch('worker.time.sleep'):
                self.assertEqual(query(job,root),result)
            self.assertEqual(len(opens),1)
            events=[json.loads(line) for line in (base/'lifecycle.jsonl').read_text().splitlines()]
            self.assertTrue(any(e['phase']=='open-callback-late' for e in events))

    def test_job_becomes_visible_after_quit_and_before_open(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name);(root/'producer').mkdir()
            (root/'config.json').write_text(json.dumps({'appBinary':'/test/Ryde.app/Ryde'}))
            (root/'producer/proxy-ready.json').write_text(json.dumps({'pid':os.getpid()}))
            (root/'transport-status.json').write_text(json.dumps({'proxyPid':os.getpid()}))
            old={'id':'old-completed-job'};job={'id':'next-job'};save(root/'producer/job.json',old)
            order=[]
            def run(command,**kwargs):
                action=command[1]
                if action=='quit':
                    # A spontaneous native request immediately before termination must
                    # only see the previous completed job, never claim the next one.
                    self.assertEqual(json.loads((root/'producer/job.json').read_text()),old)
                    order.append('quit')
                elif action=='open':
                    self.assertEqual(json.loads((root/'producer/job.json').read_text()),job)
                    order.append('open')
                return subprocess.CompletedProcess(command,0,stdout='{"locked":false,"pids":[]}')
            def arm():
                self.assertEqual(order,['quit']);save(root/'producer/job.json',job);order.append('armed')
            with patch('worker.subprocess.run',side_effect=run),patch('worker.time.sleep') as sleep:
                relaunch(root,arm)
            self.assertEqual(order,['quit','armed','open'])
            sleep.assert_not_called()
            # A failed termination must still prevent both arming and opening the next job.
            with patch('worker.subprocess.run',side_effect=subprocess.CalledProcessError(2,['helper','quit'])), \
                 patch('worker.time.sleep'), patch('worker.egress.begin_cycle') as cycle:
                with self.assertRaises(LaunchFailed): relaunch(root,arm)
                cycle.assert_not_called()

def http_error(code):
    return urllib.error.HTTPError('https://cache.test/internal/ryde/job',code,'',{},io.BytesIO())

class ServeTests(unittest.TestCase):
    """The worker's loop against a scripted broker and app, on a fake clock."""
    def setUp(self):
        worker.abnormal.clear()
        for target,value in [('worker.windowserver_ports',lambda:None),('worker.CRASH_REPORTS',Path('/nonexistent/reports'))]:
            patcher=patch(target,value);patcher.start();self.addCleanup(patcher.stop)

    def run_serve(self, replies, queries, waits_before_stop, relaunches=(), status_every=10**6):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);(base/'results').mkdir();self.base=base
            clock=[1000.0];waits=[];self.held=[];self.told=[];relaunches=list(relaunches)
            def call(config,method,path,value=None):
                if path=='/internal/ryde/status':
                    self.told.append((value['reason'],value.get('detail')));return None
                reply=replies.pop(0)
                if isinstance(reply,Exception):raise reply
                if reply=='job':return {'version':1,'id':uuid.uuid4().hex,'cityId':43,'latitude':59.744,'longitude':10.205,'radius':1,'expiresAt':clock[0]+120}
                return reply
            def run_query(job):
                outcome=queries.pop(0)
                if callable(outcome):return outcome()
                save(base/'last-trigger.json',{'mode':'warm','stayedMinimized':True} if outcome=='warm' else {'mode':'restart'})
                if outcome=='refused':
                    save(base/'upstream-refused.json',{'at':clock[0]+1,'httpStatus':403});raise TimeoutError('No fresh native map within job deadline')
                if isinstance(outcome,Exception):raise outcome
                return {'version':1,'id':job['id'],'query':job,'observedAt':clock[0],'coverage':'unknown','scooters':[]}
            def run_relaunch(*args,**kwargs):
                outcome=relaunches.pop(0) if relaunches else None
                if isinstance(outcome,Exception):raise outcome
            def wait(seconds,stop):
                status=json.loads((base/'worker-status.json').read_text())
                if status.get('until'):self.held.append(status['reason'])
                waits.append(round(seconds));clock[0]+=seconds
                if len(waits)==waits_before_stop:stop.write_text('{}')
            with patch('worker.call',side_effect=call),patch('worker.query',side_effect=run_query),patch('worker.relaunch',side_effect=run_relaunch),\
                 patch('worker.wait_interval',side_effect=wait),patch('worker.time.time',side_effect=lambda:clock[0]),\
                 patch('worker.STATUS_EVERY',status_every),patch('worker.prepare_warm') as prepare:
                serve({'url':'https://cache.test','token':'t'*32},base)
                self.files={path.name:path.read_text() for path in base.iterdir() if path.is_file()}
            self.prepares=prepare.call_count
            self.assertEqual(replies,[]);self.assertEqual(queries,[]);self.assertEqual(relaunches,[])
            return waits

    def test_expired_backlog_does_not_trigger_app_failure_backoff(self):
        replies=['job',None,'job',None]
        self.assertEqual(self.run_serve(replies,[JobDeadline('expired backlog'),'ok'],2),[0,0])
        self.assertFalse(self.held)

    def test_a_deploy_costs_seconds_not_minutes(self):
        # The job leased before the deploy is unknown to the new cache (400); then the cache does not
        # answer for a while, and a proxy in between says 502 and 404.
        replies=['job',http_error(400),urllib.error.URLError('Connection refused'),http_error(502),http_error(404),'job',None]
        self.assertEqual(self.run_serve(replies,['ok','ok'],5),[0,5,10,20,0])

    def test_a_refusal_holds_the_worker_off_ryde_for_15_minutes_then_30(self):
        replies=['job',None,'job',None,'job',None]
        waits=self.run_serve(replies,['refused','refused','ok'],5)
        # Each refused launch: the failure's minute, then the rest of the hold from the refusal.
        self.assertEqual(waits,[60,841,60,1741,0]);self.assertEqual(self.held,['RydeRefused','RydeRefused'])

    def test_three_failed_launches_in_a_row_hold_it_as_a_refusal_does(self):
        timeout=TimeoutError('No fresh native map within job deadline')
        replies=['job',None,'job',None,'job',None,'job',None]
        waits=self.run_serve(replies,[timeout,timeout,timeout,'ok'],5)
        self.assertEqual(waits,[60,60,60,840,0]);self.assertEqual(self.held,['AppFailing'])

    def test_exhausted_datacenter_budget_waits_before_leasing_another_job(self):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name)
            def stop(seconds,path):
                self.assertGreater(seconds,50)
                path.write_text('{}')
            with patch('worker.egress.available_at',return_value=time.time()+120), \
                 patch('worker.broker') as broker,patch('worker.wait_interval',side_effect=stop):
                serve({},base)
            # Only the cache is told why; no job is leased.
            self.assertEqual([c.args[1:3] for c in broker.call_args_list],[('POST','/internal/ryde/status')])
            self.assertEqual(broker.call_args.args[3]['reason'],'DatacenterBudget')
            self.assertEqual(json.loads((base/'worker-status.json').read_text())['reason'],'DatacenterBudget')

    def test_accounting_lock_retries_without_crashing_or_holding_the_app(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as name:
            base=Path(name); waits=[]
            def stop(seconds,path):
                waits.append(seconds)
                if len(waits)==5:path.write_text('{}')
            with patch('worker.egress.available_at',side_effect=sqlite3.OperationalError('database is locked')), \
                 patch('worker.broker') as broker,patch('worker.relaunch') as relaunch, \
                 patch('worker.wait_interval',side_effect=stop):
                serve({},base)
            self.assertEqual(waits,[5]*5)
            broker.assert_not_called(); relaunch.assert_not_called()
            self.assertEqual(json.loads((base/'worker-status.json').read_text())['reason'],'DatacenterAccounting')

    def test_a_hold_tells_the_cache_why_every_minute(self):
        timeout=TimeoutError('No fresh native map within job deadline')
        replies=['job',None,'job',None,'job',None,'job',None]
        waits=self.run_serve(replies,[timeout,timeout,timeout,'ok'],18,status_every=60)
        self.assertEqual(waits,[60,60,60]+[60]*14+[0])
        self.assertEqual(len(self.told),14);self.assertEqual({reason for reason,_ in self.told},{'AppFailing'})
        self.assertIn('TimeoutError: No fresh native map',self.told[0][1])

    def test_a_launch_that_fails_on_the_mac_is_tried_again_each_minute_without_jobs(self):
        failed=LaunchFailed('CalledProcessError: NSOSStatusErrorDomain -10810 <- OSLaunchdErrorDomain 37')
        # The job's launch fails and the job goes back; two more launches with no job fail a minute apart;
        # the third opens Ryde, and only then is a job leased.
        replies=['job',None,'job',None,None]
        waits=self.run_serve(replies,[failed,'ok'],5,relaunches=[failed,failed,None])
        self.assertEqual(waits,[60,60,60,0,2])
        self.assertEqual(self.held,['LaunchFailed']*3)
        self.assertEqual([reason for reason,_ in self.told],['LaunchFailed']*3)
        self.assertIn('OSLaunchdErrorDomain 37',self.told[0][1])
        # Never an app failure: three of them would have held the worker off Ryde for 15 minutes.
        self.assertNotIn('AppFailing',self.held)

    def test_only_a_cold_read_is_prepared_for_the_next_one(self):
        self.run_serve(['job',None,'job',None],['warm','ok'],2)
        self.assertEqual(self.prepares,1)

    def test_a_windowserver_near_its_port_limit_stops_every_launch_until_a_new_one(self):
        # 26 November 2026, 16:54 CET: the kernel killed WindowServer at 305,834 ports, and the session ended.
        ports=[(175,250_000),(175,250_000),(34725,3_000)]
        with patch('worker.windowserver_ports',side_effect=lambda:ports.pop(0)):
            waits=self.run_serve(['job',None],['ok'],3)
        self.assertEqual(waits,[60,60,0]);self.assertEqual(self.held,['WindowServerPorts']*2);self.assertEqual(ports,[])
        self.assertEqual({reason for reason,_ in self.told},{'WindowServerPorts'})
        self.assertIn('WindowServer holds 250000 Mach ports',self.told[0][1])
        self.assertEqual(json.loads(self.files['windowserver.json'])['pid'],34725)

    def test_three_abnormal_exits_within_a_minute_hold_the_worker_off_for_15_minutes(self):
        def burst():
            for what in ['Ryde did not quit']*2+['Ryde did not open']:worker.note_abnormal(what)
            raise TimeoutError('No fresh native map within worker timeout')
        waits=self.run_serve(['job',None,'job',None],[burst,'ok'],3)
        # The failed read's minute, then 15 minutes: longer than the cache's 10 minutes before Sentry.
        self.assertEqual(waits,[60,900,0]);self.assertEqual(self.held,['AbnormalExits'])
        self.assertIn('3 within 60 s: Ryde did not quit; Ryde did not quit; Ryde did not open',self.told[0][1])
        self.assertEqual(worker.abnormal,[])

    def test_two_abnormal_exits_are_no_hold(self):
        def two():
            for _ in range(2):worker.note_abnormal('Ryde did not quit')
            raise TimeoutError('No fresh native map within worker timeout')
        self.assertEqual(self.run_serve(['job',None,'job',None],[two,'ok'],2),[60,0]);self.assertEqual(self.held,[])

    def test_a_crash_report_of_ryde_counts_once(self):
        with tempfile.TemporaryDirectory() as name:
            reports=Path(name)
            for report,at in [('Ryde-2026-11-27-001500.ips',1500),('RydeMapControl-2026-11-27-001501.ips',1500),
                              ('Ryde-2026-11-24-122911.ips',500),('RydeWidget-2026-11-27-001500.ips',1500),('Other-1.ips',1500)]:
                (reports/report).write_text('{}');os.utime(reports/report,(at,at))
            seen=set()
            with patch('worker.CRASH_REPORTS',reports):
                self.assertEqual(sorted(new_crash_reports(seen,1000)),['Ryde-2026-11-27-001500.ips','RydeMapControl-2026-11-27-001501.ips'])
                self.assertEqual(new_crash_reports(seen,1000),[])

    def test_with_no_job_ryde_is_opened_again_every_15_minutes(self):
        # Desk 490: every 90 seconds until 27 November 2026, 35 to 40 cold cycles an hour on a quiet night,
        # about 5 Mach ports each in WindowServer. An hour of polls 30 seconds apart now opens it three times.
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);clock=[1000.0];opened=[];polls=[0]
            def wait(seconds,stop):
                clock[0]+=30;polls[0]+=1
                if polls[0]==120:stop.write_text('{}')
            with patch('worker.call',return_value=None),patch('worker.relaunch',side_effect=lambda *a,**k:opened.append(clock[0])),\
                 patch('worker.wait_interval',side_effect=wait),patch('worker.time.time',side_effect=lambda:clock[0]):
                serve({'url':'https://cache.test','token':'t'*32},base)
            self.assertEqual([round(at-1000) for at in opened],[930,1860,2790])

    def test_an_ended_session_opens_nothing_and_tells_the_cache_until_the_user_signs_in(self):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);(base/'session').mkdir();status=base/'session/status.json'
            clock=[1000.0];waits=[];told=[];asked=[]
            save(status,{'bridgeStage':'bridge-active','paused':True,'pauseReason':'renewal'})
            def call(config,method,path,value=None):
                if path=='/internal/ryde/status':told.append((value['reason'],value.get('detail')));return None
                asked.append(path);return None
            def wait(seconds,stop):
                waits.append(round(seconds));clock[0]+=seconds
                # The user signs in again.
                if len(waits)==3:save(status,{'bridgeStage':'bridge-active','paused':False,'pauseReason':None})
                if len(waits)==4:stop.write_text('{}')
            with patch('worker.call',side_effect=call),patch('worker.relaunch') as relaunch,\
                 patch('worker.wait_interval',side_effect=wait),patch('worker.time.time',side_effect=lambda:clock[0]):
                serve({'url':'https://cache.test','token':'t'*32},base)
            relaunch.assert_not_called()
            self.assertEqual(waits,[60,60,60,2])
            self.assertEqual([reason for reason,_ in told],['SessionExpired']*3)
            self.assertIn('Ryde rejected the renewal of its session key',told[0][1])
            # No job is leased while the session is over, and one is once it is back.
            self.assertEqual(asked,['/internal/ryde/job'])

    def test_what_ends_the_session_and_what_does_not(self):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);(base/'session').mkdir();status=base/'session/status.json'
            self.assertIsNone(worker.session_ended(base))
            for state,said in [
                ({'bridgeStage':'bridge-active','paused':False,'pauseReason':None},None),
                ({'bridgeStage':'bridge-active','paused':True,'pauseReason':'transport'},None),
                ({'bridgeStage':'awaiting-first-rotation','paused':False},None),
                ({'bridgeStage':'bridge-active','paused':True,'pauseReason':'renewal'},'Ryde rejected the renewal of its session key'),
                ({'bridgeStage':'needs-sign-in','paused':True,'pauseReason':'session'},'Ryde\'s session was renewed outside the bridge'),
                ({'bridgeStage':'needs-sign-in','paused':True,'pauseReason':'sign-in'},'Ryde refused the bridge\'s key'),
                ({'bridgeStage':'needs-sign-in','paused':False},'the bridge needs a new sign-in')]:
                save(status,state)
                ended=worker.session_ended(base)
                if said is None:self.assertIsNone(ended,state)
                else:self.assertEqual(ended,said+': Ryde\'s session needs the user\'s sign-in on the Mac (docs/ryde-bridge.md)')
            status.write_text('{not json')
            self.assertIsNone(worker.session_ended(base))

    def test_windowserver_ports_are_read_from_top(self):
        def run(command,**kwargs):
            if command[0]=='/usr/bin/pgrep':return subprocess.CompletedProcess(command,0,stdout='34725\n')
            self.assertEqual(command,['/usr/bin/top','-l','1','-pid','34725','-stats','pid,ports'])
            return subprocess.CompletedProcess(command,0,stdout='Processes: 812 total\n\nPID    #PORTS\n34725  305834+\n')
        with patch('worker.subprocess.run',side_effect=run):self.assertEqual(windowserver_ports(),(34725,305834))
        with patch('worker.subprocess.run',side_effect=subprocess.CalledProcessError(1,'pgrep')):self.assertIsNone(windowserver_ports())

class HousekeepingTests(unittest.TestCase):
    def test_warm_reads_pause_an_hour_after_a_bad_restoration_and_stop_after_three(self):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);path=base/'warm-control.json'
            save(path,{'enabled':True,'mode':'minimized-idle'})
            bad={'stayedMinimized':True,'userInterrupted':False,'focusRestored':False,'cursorPreserved':True}
            good={'stayedMinimized':True,'userInterrupted':False,'focusRestored':True,'cursorPreserved':True}
            with patch('worker.time.time',return_value=1000.0):
                note_warm_restoration(base,bad)
            control=json.loads(path.read_text())
            self.assertTrue(control['enabled']);self.assertEqual(control['pausedUntil'],4600.0);self.assertEqual(control['restorationFailures'],1)
            note_warm_restoration(base,good)
            self.assertNotIn('restorationFailures',json.loads(path.read_text()))
            for _ in range(3):note_warm_restoration(base,bad)
            control=json.loads(path.read_text())
            self.assertFalse(control['enabled']);self.assertIn('3 times in a row',control['reason'])
            self.assertFalse(control['lastRestorationFailure']['focusRestored'])

    def test_an_interrupted_warm_read_is_not_a_bad_restoration(self):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);save(base/'warm-control.json',{'enabled':True,'mode':'minimized-idle'})
            note_warm_restoration(base,{'stayedMinimized':True,'userInterrupted':True,'focusRestored':False,'cursorPreserved':False})
            self.assertEqual(json.loads((base/'warm-control.json').read_text()),{'enabled':True,'mode':'minimized-idle'})

    def test_results_older_than_a_day_and_old_map_control_replies_are_deleted(self):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name)
            for directory in ['results','map-control-results']:(base/directory).mkdir()
            for path,age in [('results/old.json',86401),('results/new.json',86399),('results/note.txt',10**6),
                             ('map-control-results/old.json',3601),('map-control-results/new.json',60)]:
                (base/path).write_text('{}');os.utime(base/path,(10**7-age,10**7-age))
            prune(base,now=10**7)
            self.assertEqual(sorted(str(p.relative_to(base)) for p in base.rglob('*') if p.is_file()),
                ['map-control-results/new.json','results/new.json','results/note.txt'])

    def test_the_lifecycle_journal_keeps_one_previous_file(self):
        with tempfile.TemporaryDirectory() as name:
            path=Path(name)/'lifecycle.jsonl'
            with patch('worker.JOURNAL_LIMIT',50):
                for n in range(6):journal(path,{'n':n,'pad':'x'*10})
            previous=Path(name)/'lifecycle.previous.jsonl'
            self.assertTrue(previous.exists());self.assertLessEqual(path.stat().st_size,100)
            numbers=[json.loads(l)['n'] for f in [previous,path] for l in f.read_text().splitlines()]
            self.assertEqual(numbers,sorted(numbers));self.assertEqual(numbers[-1],5)

    def test_the_status_report_reads_a_bridge_without_touching_it(self):
        with tempfile.TemporaryDirectory() as name:
            root=Path(name);base=root/'producer';(base/'results').mkdir(parents=True)
            save(base/'worker-status.json',{'state':'held','reason':'LaunchFailed','until':2000,'detail':'CalledProcessError: 37','at':1000})
            save(base/'warm-control.json',{'enabled':True,'mode':'minimized-idle','pausedUntil':1500})
            save(root/'config.json',{'certificateExpiresTimestamp':1000+16*86400})
            save(base/'windowserver.json',{'at':990,'pid':34725,'ports':4658})
            journal(base/'map-control.jsonl',{'at':400,'action':'start','answer':'serving'})
            for at,answer in [(-2700,'ok'),(500,'ok'),(600,'desktop-busy'),(700,'ok')]:journal(base/'map-control.jsonl',{'at':at,'action':'refresh','answer':answer})
            save(base/'map-control-ready.json',{'pid':4242,'startedAt':400})
            lock=os.open(base/'map-control.lock',os.O_RDWR|os.O_CREAT,0o600);fcntl.flock(lock,fcntl.LOCK_EX);self.addCleanup(os.close,lock)
            listed='PID\tStatus\tLabel\n42\t0\tcom.scootradar.ryde-worker\n-\t0\tapplication.com.ryde.NewRyde.1.2\n'
            before=sorted(p.name for p in root.rglob('*'))
            with patch('worker.subprocess.run',return_value=subprocess.CompletedProcess([],0,stdout=listed)):
                report=status_report(root,now=1000)
            self.assertEqual(sorted(p.name for p in root.rglob('*')),before)
            self.assertIn('held: LaunchFailed until',report);self.assertIn('CalledProcessError: 37',report)
            self.assertIn('1 launchd job(s) left with no process',report);self.assertIn('paused until',report)
            self.assertRegex(report,r'Certificate +expires \d\d [A-Z][a-z]{2} 1970 \d\d:\d\d:\d\d \(in 16d 0h\); '
                r'collection stops for its renewal \d\d [A-Z][a-z]{2} 1970 \d\d:\d\d:\d\d \(in 9d 0h\)')
            self.assertRegex(report,r'Mach ports \d\d [A-Z][a-z]{2} \d\d:')
            self.assertIn('Map Control   serving since',report)
            self.assertIn('(pid 4242); 3 answers in the last hour (2 ok, 1 desktop-busy); started 1 time(s) in the last hour',report)
            self.assertIn('WindowServer  4658 Mach ports',report);self.assertIn('launches nothing from 200000',report)

if __name__=='__main__':unittest.main()
