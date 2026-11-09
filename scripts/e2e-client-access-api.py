"""Test-only Google/SMTP boundaries; the app, database, nonces and sessions are real."""
import base64
import json
import os
from pathlib import Path
import sys
import uvicorn
url = os.environ.get('DATABASE_URL', '')
root = Path(url.removeprefix('sqlite:///')).parent
if os.environ.get('APP_ENV') != 'development' or not url.startswith('sqlite:///') or not root.name.startswith('atendehub-tenant-tests-'):
    raise SystemExit('Client access runner requires isolated SQLite.')
os.environ.update(GOOGLE_AUTH_CLIENT_ID='test.apps.googleusercontent.com', AUTH_PUBLIC_ORIGIN='http://127.0.0.1:3200', SMTP_HOST='smtp.example.com', SMTP_USERNAME='test-only-user', SMTP_PASSWORD='test-only-secret', SMTP_FROM='support@example.com')
sys.path.insert(0, str(Path.cwd()))
from app.main import app
from app.services import client_auth

def claims(credential, request, audience):
    assert audience == 'test.apps.googleusercontent.com'
    assert credential.startswith('e2e-only-google.')
    return json.loads(base64.b64decode(credential.split('.', 1)[1]))
client_auth.id_token.verify_oauth2_token = claims

def email(settings, address, token):
    target = root/'reset-email.json'
    target.write_text(json.dumps({'email':address, 'token':token}))
    target.chmod(0o600)
client_auth.send_reset_email = email
uvicorn.run(app, host='127.0.0.1', port=8200)
