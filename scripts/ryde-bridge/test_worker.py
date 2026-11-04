"""Regression for the quit/claim race, with all app control mocked."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from worker import relaunch,save,wait_interval,query
import time

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

if __name__=='__main__':unittest.main()
