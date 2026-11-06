"""Inspect/remove only an isolated E2E tenant's product images; never inspect secrets."""
import json
import os
from pathlib import Path
import sys
from uuid import UUID
from urllib.parse import quote

metadata_path, company_id, action = sys.argv[1:]
UUID(company_id)
if action not in ('verify', 'cleanup'):
    raise SystemExit('Invalid operation')
metadata = json.loads(Path(metadata_path).read_text())
database = Path(metadata['database']).resolve()
if not database.parent.name.startswith('atendehub-tenant-tests-') or database.name != 'test.db' or not database.is_file():
    raise SystemExit('Requires isolated E2E SQLite database')
os.environ['DATABASE_URL'] = f'sqlite:///{database}'
os.environ['APP_ENV'] = 'development'
sys.path.insert(0, str(Path.cwd()))
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.products import Product
from app.models import auth  # Required for SQLAlchemy FK metadata.
from app.integrations.firebase import product_images as storage
import httpx

try:
    bucket = storage.bucket()
    with SessionLocal() as db:
        rows = list(db.scalars(select(Product).where(Product.company_id == company_id)))
        if not rows:
            raise ValueError('No E2E products')
        count = 0
        for product in rows:
            if not product.image_object:
                continue
            key, generation = product.image_object, product.image_generation
            storage.validate_key(company_id, product.id, key, generation)
            blob = bucket.blob(key, generation=int(generation))
            if action == 'verify':
                blob.reload(timeout=10)
                assert blob.content_type == 'image/webp'
                assert 'no-store' in blob.cache_control
                assert not (blob.metadata or {}).get('firebaseStorageDownloadTokens')
                response = httpx.get(f'https://storage.googleapis.com/{bucket.name}/{quote(key, safe="")}', timeout=10, follow_redirects=False)
                assert response.status_code in (401, 403, 404), 'Anonymous object read must be denied'
                assert '<Code>AccessDenied</Code>' in response.text or '<Code>NoSuchKey</Code>' in response.text, 'Expected Storage denial, not proxy failure'
                print(json.dumps({'storage_object_verified': True, 'anonymous_read_status': response.status_code, 'public_download_token': False}))
            else:
                storage.delete_image(company_id, product.id, key, generation)
                assert not blob.exists(timeout=10)
                product.image_object = None; product.image_generation = None
            count += 1
        if action == 'cleanup':
            db.commit()
            print(json.dumps({'temporary_objects_removed': count, 'absence_confirmed': True}))
        elif count == 0:
            raise ValueError('No images to verify')
except Exception as exc:
    print(json.dumps({'operation': action, 'success': False, 'error_type': type(exc).__name__}))
    raise SystemExit(1) from None
