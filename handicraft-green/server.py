#!/usr/bin/env python3
import json
import os
import re
import uuid
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(ROOT, 'assets', 'data', 'products.json')
ADMIN_DATA_PATH = os.path.join(ROOT, 'admin', 'products.json')
UPLOADS_DIR = os.path.join(ROOT, 'assets', 'uploads')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')  # optional override for demo auth

class Handler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        # Friendly redirects for common login paths
        if self.path in ('/login', '/login/', '/login.html', '/admin/login', '/admin/login/'):
            self.send_response(302)
            self.send_header('Location', '/admin/login.html')
            self.end_headers()
            return
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'ok')
            return
        if self.path == '/api/admin-config':
            # Expose minimal admin config (demo only). In real apps, protect this.
            body = json.dumps({
                'password': ADMIN_PASSWORD or ''
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == '/api/products':
            try:
                with open(DATA_PATH, 'r', encoding='utf-8') as f:
                    data = f.read().encode('utf-8')
            except FileNotFoundError:
                data = b'[]'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
            return
        if self.path == '/api/admin-products':
            try:
                with open(ADMIN_DATA_PATH, 'r', encoding='utf-8') as f:
                    data = f.read().encode('utf-8')
            except FileNotFoundError:
                data = b'[]'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/products':
            try:
                length = int(self.headers.get('Content-Length') or '0')
                body = self.rfile.read(length)
                data = json.loads(body.decode('utf-8'))
                if not isinstance(data, list):
                    raise ValueError('Body must be a JSON array')
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return
            os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
            with open(DATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'count': len(data)}).encode('utf-8'))
            return
        if self.path == '/api/admin-products':
            try:
                length = int(self.headers.get('Content-Length') or '0')
                body = self.rfile.read(length)
                data = json.loads(body.decode('utf-8'))
                if not isinstance(data, list):
                    raise ValueError('Body must be a JSON array')
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return
            os.makedirs(os.path.dirname(ADMIN_DATA_PATH), exist_ok=True)
            with open(ADMIN_DATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'count': len(data)}).encode('utf-8'))
            return
        if self.path == '/api/upload':
            # Accept multipart/form-data with field name 'file'
            ctype = self.headers.get('Content-Type', '')
            if 'multipart/form-data' not in ctype:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'multipart/form-data required'}).encode('utf-8'))
                return
            import cgi
            fs = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD':'POST','CONTENT_TYPE':ctype})
            fileitem = fs['file'] if 'file' in fs else None
            if not fileitem or not fileitem.filename:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'file field missing'}).encode('utf-8'))
                return
            orig = os.path.basename(fileitem.filename)
            # sanitize filename
            safe = re.sub(r'[^A-Za-z0-9._-]', '_', orig)
            base, ext = os.path.splitext(safe)
            if not ext:
                ext = '.bin'
            name = f"{base}_{uuid.uuid4().hex[:8]}{ext}"
            os.makedirs(UPLOADS_DIR, exist_ok=True)
            filepath = os.path.join(UPLOADS_DIR, name)
            with open(filepath, 'wb') as f:
                while True:
                    chunk = fileitem.file.read(1024*1024)
                    if not chunk:
                        break
                    f.write(chunk)
            url_path = f"/assets/uploads/{name}"

            # If HEIC/HEIF, try convert to JPEG via macOS 'sips'
            try:
                ext_lower = ext.lower()
                heic_like = ext_lower in ('.heic', '.heif') or (fileitem.type or '').lower() in ('image/heic','image/heif')
                if heic_like:
                    jpg_name = f"{os.path.splitext(name)[0]}.jpg"
                    jpg_path = os.path.join(UPLOADS_DIR, jpg_name)
                    # Run sips to convert
                    proc = subprocess.run(['sips', '-s', 'format', 'jpeg', filepath, '--out', jpg_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    if proc.returncode == 0 and os.path.exists(jpg_path):
                        url_path = f"/assets/uploads/{jpg_name}"
                        # optional: remove original heic to save space
                        try:
                            os.remove(filepath)
                        except Exception:
                            pass
            except Exception as conv_err:
                # If conversion fails, keep original path
                pass
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'path': url_path, 'name': name}).encode('utf-8'))
            return
        return super().do_POST()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    httpd = HTTPServer(('', port), Handler)
    print(f'Serving on http://localhost:{port}')
    httpd.serve_forever()
