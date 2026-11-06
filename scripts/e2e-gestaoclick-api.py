"""Test runner only: real FastAPI/SQL with a mocked ERP HTTP transport. Never production."""
import os
from pathlib import Path
import sys
import httpx
import uvicorn

url=os.environ.get('DATABASE_URL','')
if os.environ.get('APP_ENV')!='development' or not url.startswith('sqlite:///') or not Path(url.removeprefix('sqlite:///')).parent.name.startswith('atendehub-tenant-tests-'):
    raise SystemExit('This test runner requires the isolated temporary E2E SQLite database.')
sys.path.insert(0,str(Path.cwd()))
from app.main import app
from app.integrations import gestaoclick
original=httpx.Client

def handler(request):
    if str(request.url)!='https://api.gestaoclick.com/api/lojas' or request.method!='GET':
        raise httpx.RequestError('Unexpected request in isolated E2E transport')
    if request.headers.get('access-token')!='test-only-access-token' or request.headers.get('secret-access-token')!='test-only-secret-token':
        return httpx.Response(401,json={'code':401,'status':'error','data':{'mensagem':'Access Token e/ou Secret Access Token incorreto(s)!'}})
    return httpx.Response(200,json={'code':200,'status':'success','data':[{'id':'1','nome':'Matriz'},{'id':'2','nome':'Filial Centro'}]})

gestaoclick.httpx.Client=lambda **kwargs:original(transport=httpx.MockTransport(handler),**kwargs)
uvicorn.run(app,host='127.0.0.1',port=8200)
