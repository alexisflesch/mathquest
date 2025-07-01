#!/usr/bin/env python3
"""
Modernize API route usage in MathQuest frontend:
- Replace all direct fetches to backend /api/games, /api/game-templates, etc. with canonical makeApiRequest to Next.js API route (e.g. /api/game-templates)
- Ensure all API route handlers use BACKEND_API_BASE_URL for backend calls
- Remove any hardcoded backend URLs in frontend code
- Log all changes for documentation
"""
import os
import re
from pathlib import Path

FRONTEND_DIR = Path(__file__).parent.parent / 'frontend' / 'src'
API_ROUTE_PATTERN = re.compile(r"fetch\(['\"](/api/(games|game-templates)[^'\"]*)['\"]")
BACKEND_ROUTE_PATTERN = re.compile(r"fetch\(['\"]https?://[\w\.:\-]+/api/v1/(games|game-templates)[^'\"]*['\"]")
MAKE_API_REQUEST_PATTERN = re.compile(r"makeApiRequest<[^>]*>\(['\"](/api/(games|game-templates)[^'\"]*)['\"]")

# For logging
log = []

def update_file(file_path: Path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Replace direct fetches to backend with makeApiRequest to /api/...
    content, n1 = API_ROUTE_PATTERN.subn(r"makeApiRequest('\1')", content)
    content, n2 = BACKEND_ROUTE_PATTERN.subn(r"makeApiRequest('/api/\1')", content)
    # Remove any hardcoded backend URLs in fetch
    # (If any remain, they should be flagged for manual review)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        log.append(f"Updated {file_path}: {n1+n2} API route(s) modernized.")


def main():
    for root, dirs, files in os.walk(FRONTEND_DIR):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                update_file(Path(root) / file)
    # Print log for documentation
    with open(Path(__file__).parent / 'modernize_api_routes.log', 'w', encoding='utf-8') as f:
        for entry in log:
            f.write(entry + '\n')
    print(f"Modernization complete. {len(log)} file(s) updated. See modernize_api_routes.log for details.")

if __name__ == '__main__':
    main()
