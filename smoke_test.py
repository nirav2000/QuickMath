#!/usr/bin/env python3
from pathlib import Path
import json, re, sys

root = Path('.')
errors = []

def require(cond, msg):
    if not cond:
        errors.append(msg)

# Files exist
for p in [
    'index.html','app.js','styles.css','version.json','VERSION_HISTORY.md',
    'lib/stats.js','lib/tips.js','topics/index.js','topics/square-roots.js','topics/percentages.js'
]:
    require((root / p).exists(), f"Missing required file: {p}")

# Version metadata sanity
try:
    meta = json.loads((root / 'version.json').read_text())
    require('currentVersion' in meta, 'version.json missing currentVersion')
    require(isinstance(meta.get('availableVersions'), list) and len(meta['availableVersions']) > 0, 'version.json missing availableVersions')
except Exception as e:
    errors.append(f"version.json parse failure: {e}")

# UI wiring checks
idx = (root / 'index.html').read_text()
require('id="practicePage"' in idx, 'index.html missing practice page')
require('id="statsPage"' in idx, 'index.html missing stats page')
require('id="tipsPage"' in idx, 'index.html missing tips page')
require('id="historyPage"' in idx, 'index.html missing history page')
require('id="settingsPage"' in idx, 'index.html missing settings page')
require('data-page="settings" class="tab-btn"' not in idx, 'settings should not be in footer tabs')

app = (root / 'app.js').read_text()
require('setTimeout(nextQ,850)' in app, 'auto-advance call missing')
require('fetchWithFallback' in app, 'central fallback loader missing')
require("['../../version.json','version.json']" in app, 'version fallback order incorrect')
require("['../../VERSION_HISTORY.md','VERSION_HISTORY.md']" in app, 'history fallback order incorrect')
require('drawStats(els, filtered())' in app, 'stats module not wired')
require('renderTips(els.tipsContainer' in app, 'tips module not wired')

# Archive consistency: each archive has version/history metadata
for d in sorted((root / 'archives').glob('*')):
    if d.is_dir():
        require((d / 'version.json').exists(), f"{d} missing version.json")
        require((d / 'VERSION_HISTORY.md').exists(), f"{d} missing VERSION_HISTORY.md")

if errors:
    print('SMOKE TEST FAILED')
    for e in errors:
        print('-', e)
    sys.exit(1)
print('SMOKE TEST PASSED')
