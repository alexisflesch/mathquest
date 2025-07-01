#!/usr/bin/env python3
"""
Find all direct /api/v1/ usages in frontend code that are NOT using the API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL.
Logs file, line, and code context for modernization.
"""
import os
import re

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '../frontend')
API_PATTERN = re.compile(r"[^\w](/api/v1/[\w\-/]+)")

for root, dirs, files in os.walk(FRONTEND_DIR):
    for fname in files:
        if fname.endswith(('.ts', '.tsx', '.js', '.jsx')):
            fpath = os.path.join(root, fname)
            with open(fpath, encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    # Ignore lines that use API_BASE_URL or process.env
                    if 'API_BASE_URL' in line or 'NEXT_PUBLIC_BACKEND_API_URL' in line:
                        continue
                    for match in API_PATTERN.finditer(line):
                        print(f"{fpath}:{i}: {line.strip()}")
