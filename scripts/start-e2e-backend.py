"""Executa o repositório FastAPI real com SQLite temporário, sem Docker."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
source = Path(os.environ.get('BACKEND_SOURCE_DIR', str(root.parent / 'Atend-hub-backend'))).resolve()
python = source / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
if not (source / 'app/main.py').is_file() or not python.is_file():
    raise SystemExit('Configure BACKEND_SOURCE_DIR com o repositório Atend-hub-backend e instale requirements.txt na .venv desse repositório.')
metadata = root / '.e2e-backend.json'
with tempfile.TemporaryDirectory(prefix='atendehub-tenant-tests-') as directory:
    database = str(Path(directory) / 'test.db')
    env = {**os.environ, 'DATABASE_URL': f'sqlite:///{database}', 'APP_ENV': 'development', 'COOKIE_SECURE': 'false', 'TURNSTILE_ENABLED': 'false', 'TURNSTILE_TESTING': 'false', 'ALLOWED_ORIGINS': '["http://127.0.0.1:3200"]'}
    if os.environ.get('E2E_TURNSTILE_TEST')=='1':
        env.update({'TURNSTILE_ENABLED':'true','TURNSTILE_TESTING':'true','TURNSTILE_SITE_KEY':'1x00000000000000000000AA','TURNSTILE_SECRET_KEY':'1x0000000000000000000000000000000AA','TURNSTILE_ALLOWED_HOSTNAMES':'["localhost","127.0.0.1"]'})
    subprocess.run([str(python), '-m', 'alembic', 'upgrade', 'head'], cwd=source, env=env, check=True)
    subprocess.run([str(python), '-m', 'app.seeds.plans'], cwd=source, env=env, check=True)
    metadata.write_text(json.dumps({'database':database, 'python':str(python)}))
    try:
        command=[str(python), '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8200']
        if os.environ.get('E2E_GESTAOCLICK_STUB')=='1':
            command=[str(python),str(root/'scripts/e2e-gestaoclick-api.py')]
        if os.environ.get('E2E_META_STUB')=='1':
            command=[str(python),str(root/'scripts/e2e-meta-api.py')]
        if os.environ.get('E2E_CLIENT_ACCESS_STUB')=='1':
            command=[str(python),str(root/'scripts/e2e-client-access-api.py')]
        subprocess.run(command,cwd=source,env=env,check=True)
    finally:
        metadata.unlink(missing_ok=True)
