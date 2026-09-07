import httpx
import sys

BASE = 'http://127.0.0.1:8000'
passed = 0
failed = 0

def test(name, method, url, expected_status, body=None):
    global passed, failed
    try:
        kwargs = {"timeout": 10}
        if body is not None:
            kwargs["json"] = body
        r = getattr(httpx, method)(BASE + url, **kwargs)
        if r.status_code == expected_status:
            print(f'  PASS: {name} -> {r.status_code}')
            passed += 1
            return r.json() if r.status_code != 204 else None
        else:
            print(f'  FAIL: {name} -> expected {expected_status}, got {r.status_code}: {r.text[:200]}')
            failed += 1
            return None
    except Exception as e:
        print(f'  FAIL: {name} -> {e}')
        failed += 1
        return None

print('=== Sentinel AI Backend API Tests ===')
print()

# 1. Health
print('[1] GET /health')
test('Health check', 'get', '/health', 200)

import time
import uuid

suffix = str(uuid.uuid4())[:6]

# 2. POST /targets/
print('[2] POST /targets/')
target = test('Create target', 'post', '/targets/', 201, {
    'name': f'test-ollama-{suffix}',
    'type': 'ollama',
    'config': {'base_url': 'http://localhost:11434', 'model': 'llama3'}
})
target_id = target['id'] if target else None
print(f'     Created target id={target_id}')

# 3. GET /targets/
print('[3] GET /targets/')
targets = test('List targets', 'get', '/targets/', 200)
if targets:
    print(f'     Found {len(targets)} targets')

# 4. GET /targets/id
print(f'[4] GET /targets/{target_id}')
t = test('Get target', 'get', f'/targets/{target_id}', 200)
if t:
    print(f"     Name: {t['name']}, Type: {t['type']}")

# 5. PUT /targets/id
print(f'[5] PUT /targets/{target_id}')
t = test('Update target', 'put', f'/targets/{target_id}', 200, {
    'name': f'test-ollama-updated-{suffix}',
    'config': {'base_url': 'http://localhost:11434', 'model': 'llama3.1'}
})
if t:
    print(f"     Updated name: {t['name']}")

# 6. DELETE /targets/id
print(f'[6] DELETE /targets/{target_id}')
test('Delete target', 'delete', f'/targets/{target_id}', 204)

# 7. Verify deletion
print(f'[7] GET /targets/{target_id} (should be 404)')
test('Verify deletion', 'get', f'/targets/{target_id}', 404)

# 8. Test connection endpoint (direct)
print('[8] POST /test-connection (ollama - expected to fail gracefully)')
conn = test('Test connection', 'post', '/test-connection', 200, {
    'type': 'ollama',
    'config': {'base_url': 'http://localhost:11434', 'model': 'llama3'}
})
if conn:
    print(f"     Success: {conn['success']}, Error: {conn.get('error', None)}")

# 9. Create scan
print('[9] POST /targets/ (create target for scan test)')
target2 = test('Create target for scan', 'post', '/targets/', 201, {
    'name': f'scan-target-{suffix}',
    'type': 'ollama',
    'config': {'base_url': 'http://localhost:11434', 'model': 'llama3'}
})
t2_id = target2['id'] if target2 else None

print('[10] POST /scans/')
scan = test('Create scan', 'post', '/scans/', 201, {
    'target_id': t2_id
})
if scan:
    print(f"     Scan id={scan['id']}, status={scan['status']}")

print('[11] GET /scans/')
scans = test('List scans', 'get', '/scans/', 200)
if scans:
    print(f'     Found {len(scans)} scans')

print()
print(f'=== Results: {passed} passed, {failed} failed ===')
sys.exit(1 if failed > 0 else 0)
