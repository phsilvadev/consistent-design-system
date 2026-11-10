"""Test provider boundary only. Never used by production start commands."""
import os,sys,time
from pathlib import Path
sys.path.insert(0,os.getcwd())
assert os.environ.get('APP_ENV')=='development' and os.environ.get('E2E_SUPPORT_STUB')=='1'
assert os.environ['DATABASE_URL'].startswith('sqlite:') and 'atendehub-tenant-tests-' in os.environ['DATABASE_URL']
from app.main import app
from app.core.database import SessionLocal
from app.models.knowledge import PlatformOpenAI
from app.services.platform_settings import encrypt
from app.services import support
from app.services.support_knowledge import DOCUMENTS,VERSION
with SessionLocal() as db:
    row=db.get(PlatformOpenAI,1);row.key_ciphertext=encrypt('sk-test-only-local-e2e-provider');row.check_status='verified';db.commit()
def fake_provider(key,model,messages):
    time.sleep(0.5)
    text=messages[-1]['content'].lower()
    if 'simular falha' in text:raise support.ProviderFailure('unavailable')
    doc=next((doc for doc in DOCUMENTS if doc['id']==('whatsapp-qr' if 'whats' in text else 'gestaoclick' if 'produt' in text else 'equipe')),None)
    if 'olá' in text:return 'Não encontrei uma orientação aprovada para essa dúvida. Consulte a Central de ajuda.',[],{'input_tokens':100,'output_tokens':20}
    return doc['body'],[{'id':doc['id'],'title':doc['title'],'version':VERSION}],{'input_tokens':100,'output_tokens':30}
support.call_provider=fake_provider
import uvicorn
uvicorn.run(app,host='127.0.0.1',port=8200)
