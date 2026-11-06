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
    if request.url.host!='api.gestaoclick.com' or request.url.path not in ('/api/lojas','/api/produtos') or request.method!='GET':
        raise httpx.RequestError('Unexpected request in isolated E2E transport')
    if request.headers.get('access-token')!='test-only-access-token' or request.headers.get('secret-access-token')!='test-only-secret-token':
        return httpx.Response(401,json={'code':401,'status':'error','data':{'mensagem':'Access Token e/ou Secret Access Token incorreto(s)!'}})
    if request.url.path=='/api/produtos':
        page=int(request.url.params.get('pagina','1'))
        assert request.url.params.get('loja_id')=='2'
        rows=[{'id':str(page),'nome':'Metalon 30x30 Chapa 18' if page==1 else 'Vergalhão CA-50 12 mm','codigo_interno':'MT-3030' if page==1 else 'VG-12','descricao':'Catálogo de teste','nome_grupo':'Metalon' if page==1 else 'Vergalhões','ativo':'1','possui_variacao':'0'}]
        return httpx.Response(200,json={'code':200,'status':'success','meta':{'pagina_atual':page,'total_paginas':2,'total_registros':2},'data':rows})
    return httpx.Response(200,json={'code':200,'status':'success','data':[{'id':'1','nome':'Matriz'},{'id':'2','nome':'Filial Centro'}]})

gestaoclick.httpx.Client=lambda **kwargs:original(transport=httpx.MockTransport(handler),**kwargs)
uvicorn.run(app,host='127.0.0.1',port=8200)
