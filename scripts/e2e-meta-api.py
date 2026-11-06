"""Isolated E2E: real FastAPI/SQLite; only Meta HTTP is simulated."""
import os
from pathlib import Path
import sys
import httpx
import uvicorn
url = os.environ.get('DATABASE_URL', '')
if os.environ.get('APP_ENV') != 'development' or not url.startswith('sqlite:///') or not Path(url.removeprefix('sqlite:///')).parent.name.startswith('atendehub-tenant-tests-'):
    raise SystemExit('Meta E2E runner requires an isolated temporary SQLite database.')
sys.path.insert(0, str(Path.cwd()))
from app.main import app
original = httpx.Client
TOKEN = 'test-only-meta-business-token-abcdefghijklmnopqrstuvwxyz'
def handler(request):
    if request.url.host != 'graph.facebook.com': raise httpx.RequestError('Unexpected host in Meta E2E')
    path = request.url.path
    if path.endswith('/oauth/access_token'):
        assert request.url.params['client_id'] == '55555'
        assert request.url.params['client_secret'] == 'test-only-meta-app-secret'
        assert request.url.params['code'] == 'test-only-meta-authorization-code-abcdefghijklmnopqrstuvwxyz'
        return httpx.Response(200, json={'access_token': TOKEN, 'token_type': 'bearer'})
    if path.endswith('/debug_token'):
        return httpx.Response(200, json={'data': {'is_valid': True, 'app_id': '55555', 'scopes': ['whatsapp_business_management', 'whatsapp_business_messaging']}})
    assert request.headers['Authorization'] == 'Bearer '+TOKEN
    if path.endswith('/phone_numbers'):
        return httpx.Response(200, json={'data': [{'id': '12345', 'display_phone_number': '+55 11 99999-0000', 'verified_name': 'Moreira Distribuidora'}]})
    if path.endswith('/12345'):
        return httpx.Response(200, json={'id': '12345', 'status': 'CONNECTED', 'code_verification_status': 'VERIFIED', 'platform_type': 'CLOUD_API'})
    if path.endswith('/subscribed_apps'):
        return httpx.Response(200, json={'data': []})
    raise httpx.RequestError('Unexpected endpoint in Meta E2E')
httpx.Client = lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs)
uvicorn.run(app, host='127.0.0.1', port=8200)
