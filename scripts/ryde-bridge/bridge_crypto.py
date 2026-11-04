"""Offline ECIES translation prototype; no network, credentials or key rotation."""
import os
import sys
from pathlib import Path
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

sys.path.insert(0, str(Path.home() / '.local/share/scootradar/ryde-login'))
from ryde_protocol import b64u, jwk, public_key, thumbprint, decrypt_envelope

def encrypt_envelope(recipient, plaintext):
    if isinstance(recipient, dict): recipient = public_key(recipient)
    if not isinstance(recipient.curve, ec.SECP256R1): raise ValueError('P-256 required')
    if not isinstance(plaintext, bytes) or len(plaintext) > 4 * 1024 * 1024:
        raise ValueError('Invalid plaintext size or type')
    ephemeral = ec.generate_private_key(ec.SECP256R1())
    secret = ephemeral.exchange(ec.ECDH(), recipient)
    aes = HKDF(algorithm=hashes.SHA256(), length=32, salt=bytes(32), info=b'ryde-dpop-ecies-v1').derive(secret)
    iv = os.urandom(12)
    return {'alg': 'ECDH-ES+A256GCM', 'ekt': thumbprint(recipient), 'epk': jwk(ephemeral),
            'iv': b64u(iv), 'data': b64u(AESGCM(aes).encrypt(iv, plaintext, None))}

def translate_envelope(source_key, recipient, envelope):
    return encrypt_envelope(recipient, decrypt_envelope(source_key, envelope))
