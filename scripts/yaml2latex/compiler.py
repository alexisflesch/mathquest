"""
    LaTeX compilation functions for yaml2latex
"""

import subprocess
import re
from pathlib import Path

def compile_latex(tex_path):
    # Prefer lualatex if available (better color emoji support via fontspec + HarfBuzz),
    # otherwise fallback to xelatex.
    def has_cmd(cmd):
        from shutil import which
        return which(cmd) is not None

    # Detect presence of Noto Color Emoji
    def has_emoji_font():
        try:
            out = subprocess.check_output(['fc-list', ':family'], stderr=subprocess.DEVNULL).decode('utf-8')
            return 'Noto Color Emoji' in out
        except Exception:
            return False

    engine = None
    if has_cmd('lualatex') and has_emoji_font():
        engine = 'lualatex'
    elif has_cmd('xelatex'):
        engine = 'xelatex'
    else:
        engine = 'xelatex'  # fallback; will error if absent

    # Diagnostics for debugging emoji rendering
    print(f"[yaml2latex] Using LaTeX engine: {engine}")
    print(f"[yaml2latex] Noto Color Emoji available: {has_emoji_font()}")



    # Try to dump a small excerpt around the first emoji (if any) for inspection
    try:
        txt = Path(tex_path).read_text(encoding='utf-8')
        m = re.search(r'([\U0001F300-\U0001FAFF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\u2600-\u26FF\u2700-\u27BF])', txt)
        if m:
            start = max(0, m.start() - 40)
            end = min(len(txt), m.end() + 40)
            excerpt = txt[start:end]
            print("[yaml2latex] .tex excerpt around first emoji:")
            print(excerpt)
    except Exception:
        pass

    def run_engine(cmd):
        try:
            cp = subprocess.run(cmd, cwd=tex_path.parent, capture_output=True, text=True)
            if cp.returncode != 0:
                print(f"[yaml2latex] {cmd[0]} failed with return code {cp.returncode}")
                if cp.stdout:
                    print("[yaml2latex] stdout:")
                    print(cp.stdout)
                if cp.stderr:
                    print("[yaml2latex] stderr:")
                    print(cp.stderr)
            return cp.returncode, cp.stdout + "\n" + cp.stderr
        except Exception as e:
            print(f"[yaml2latex] Error running {cmd}: {e}")
            return 1, str(e)

    cmd = [engine, '-interaction=nonstopmode', tex_path]
    rc, out = run_engine(cmd)
    if rc != 0 and engine == 'lualatex':
        print('[yaml2latex] lualatex failed, retrying with xelatex')
        if has_cmd('xelatex'):
            engine = 'xelatex'
            cmd = [engine, '-interaction=nonstopmode', tex_path]
            rc2, out2 = run_engine(cmd)
            rc = rc2
            out = out2
        else:
            print('[yaml2latex] xelatex not available as fallback')
    # run a second pass if first succeeded
    if rc == 0:
        run_engine([engine, '-interaction=nonstopmode', tex_path])

def clean_aux_files(folder):
    for ext in ['aux', 'log', 'out', 'toc']:
        for f in Path(folder).glob(f'*.{ext}'):
            f.unlink()