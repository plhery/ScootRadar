"""Route and count every native Ryde HTTP attempt before it reaches datacenter egress."""
import base64
import json
import os
import time
from pathlib import Path
from urllib.parse import urlsplit
from mitmproxy import http
from mitmproxy.connection import Server
from egress import Pool

BASE = Path(os.environ['RYDE_PRODUCER_ROOT'])


class Datacenter:
    def __init__(self):
        self.pool = Pool(BASE)

    def running(self):
        path = BASE/'egress-ready.json'
        temp = path.with_suffix('.tmp')
        temp.write_text(json.dumps({'pid': os.getpid(), 'at': time.time(), 'gateways': len(self.pool.gateways)}))
        temp.chmod(0o600); temp.replace(path)

    def requestheaders(self, flow):
        if flow.request.host != 'api.ryde.vip' or flow.request.port != 443 or flow.request.scheme != 'https':
            self.deny(flow); return
        try:
            identity, gateway = self.pool.charge(flow.id, len(bytes(flow.request.headers)) + int(flow.request.headers.get('content-length', '0')))
            via = ('http', (gateway['host'], gateway['port']))
            if flow.server_conn.via != via:
                # Connections are pooled by their via address. Never mutate an open socket's route.
                flow.server_conn = Server(address=flow.server_conn.address, via=via)
            flow.metadata['datacenterGateway'] = identity
            flow.request.headers.pop('Proxy-Authorization', None)
        except Exception:
            # No route or failed accounting must never expose a native request to direct egress.
            self.deny(flow)

    def deny(self, flow):
        flow.metadata['egressDenied'] = True
        flow.response = http.Response.make(503, b'Datacenter egress unavailable', {'Content-Type': 'text/plain'})

    def http_connect_upstream(self, flow):
        identity = self.pool.addresses.get(flow.server_conn.address)
        if not identity or flow.request.host != 'api.ryde.vip' or flow.request.port != 443:
            flow.kill(); return
        gateway = self.pool.gateways[identity]
        auth = (gateway['username']+':'+gateway['password']).encode()
        flow.request.headers['Proxy-Authorization'] = 'Basic '+base64.b64encode(auth).decode()

    def finish(self, flow):
        identity = flow.metadata.get('datacenterGateway')
        if not identity: return
        status = flow.response.status_code if flow.response else 0
        size = len(flow.response.raw_content or b'')+len(bytes(flow.response.headers)) if flow.response else 0
        self.pool.settle(flow.id, status, size)
        # Only endpoint paths and counters; no proofs, identifiers, request bodies or headers.
        value = {'at': time.time(), 'gateway': identity, 'path': urlsplit(flow.request.url).path[:120],
                 'httpStatus': status, 'responseBytes': size}
        log = BASE/'egress-requests.jsonl'
        if log.exists() and log.stat().st_size > 8*1024*1024:
            log.replace(BASE/'egress-requests.previous.jsonl')
        with log.open('a') as f: f.write(json.dumps(value)+'\n')

    def response(self, flow): self.finish(flow)
    def error(self, flow): self.finish(flow)
    def done(self): self.pool.close()


addons = [Datacenter()]
