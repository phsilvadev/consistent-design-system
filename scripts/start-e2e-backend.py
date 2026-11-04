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
    env = {**os.environ, 'DATABASE_URL': f'sqlite:///{database}', 'APP_ENV': 'development', 'COOKIE_SECURE': 'false', 'ALLOWED_ORIGINS': '["http://127.0.0.1:3200"]'}
    subprocess.run([str(python), '-m', 'alembic', 'upgrade', 'head'], cwd=source, env=env, check=True)
    metadata.write_text(json.dumps({'database':database, 'python':str(python)}))
    try:
        subprocess.run([str(python), '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8200'], cwd=source, env=env, check=True)
    finally:
        metadata.unlink(missing_ok=True)
