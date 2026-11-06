"""Regression for the quit/claim race, with all app control mocked."""
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import uuid
from unittest.mock import patch
from worker import relaunch,save,wait_interval,query,serve
import time
import urllib.error

class WorkerTests(unittest.TestCase):
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
            with patch('worker.subprocess.run',side_effect=run),patch('worker.time.sleep'):
                relaunch(root,arm)
            self.assertEqual(order,['quit','armed','open'])

def http_error(code):
    return urllib.error.HTTPError('https://cache.test/internal/ryde/job',code,'',{},io.BytesIO())

class ServeTests(unittest.TestCase):
    """The worker's loop against a scripted broker and app, on a fake clock."""
    def run_serve(self, replies, queries, waits_before_stop):
        with tempfile.TemporaryDirectory() as name:
            base=Path(name);(base/'results').mkdir();self.base=base
            clock=[1000.0];waits=[];self.held=[]
            def call(config,method,path,value=None):
                reply=replies.pop(0)
                if isinstance(reply,Exception):raise reply
                if reply=='job':return {'version':1,'id':uuid.uuid4().hex,'cityId':43,'latitude':59.744,'longitude':10.205,'radius':1,'expiresAt':clock[0]+120}
                return reply
            def run_query(job):
                outcome=queries.pop(0)
                if outcome=='refused':
                    save(base/'upstream-refused.json',{'at':clock[0]+1,'httpStatus':403});raise TimeoutError('No fresh native map within job deadline')
                if isinstance(outcome,Exception):raise outcome
                return {'version':1,'id':job['id'],'query':job,'observedAt':clock[0],'coverage':'unknown','scooters':[]}
            def wait(seconds,stop):
                status=json.loads((base/'worker-status.json').read_text())
                if status.get('until'):self.held.append(status['reason'])
                waits.append(round(seconds));clock[0]+=seconds
                if len(waits)==waits_before_stop:stop.write_text('{}')
            with patch('worker.call',side_effect=call),patch('worker.query',side_effect=run_query),patch('worker.relaunch'),\
                 patch('worker.wait_interval',side_effect=wait),patch('worker.time.time',side_effect=lambda:clock[0]):
                serve({'url':'https://cache.test','token':'t'*32},base)
            self.assertEqual(replies,[]);self.assertEqual(queries,[])
            return waits

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
                self.assertGreater(seconds,100)
                path.write_text('{}')
            with patch('worker.egress.available_at',return_value=time.time()+120), \
                 patch('worker.broker') as broker,patch('worker.wait_interval',side_effect=stop):
                serve({},base)
            broker.assert_not_called()
            self.assertEqual(json.loads((base/'worker-status.json').read_text())['reason'],'DatacenterBudget')

if __name__=='__main__':unittest.main()
