#!/usr/bin/env python3
"""
Production-Only Handler Audit

Following .instructions.md requirements:
- Focus on root causes, not test/backup files
- Document everything systematically
- Use scripts for analysis

This script audits only production backend handlers, excluding:
- backend-backup/ (legacy files)
- tests/ (test handlers)
- Any development/debug files
"""

import os
import re
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class HandlerRegistration:
    file_path: str
    line_number: int
    event_name: str
    handler_function: str

def main():
    print("🔍 Production Backend Handler Audit (Excluding Backup/Test Files)")
    print("Following .instructions.md: Focus on production root causes")
    
    backend_src = Path(__file__).parent.parent / "backend" / "src"
    registrations = []
    
    # Pattern to match socket.on() calls (excluding commented lines)
    handler_pattern = re.compile(
        r'^\s*socket\.on\s*\(\s*([^,]+)\s*,\s*([^)]+)\)',
        re.MULTILINE
    )
    
    # Only scan production source files
    ts_files = [
        f for f in backend_src.rglob("*.ts") 
        if not any(exclude in str(f) for exclude in [
            'test', 'spec', '.test.', '.spec.',
            'debug', 'temp', 'backup'
        ])
    ]
    
    print(f"📁 Scanning {len(ts_files)} production TypeScript files...")
    
    for file_path in ts_files:
        try:
            content = file_path.read_text()
            matches = handler_pattern.findall(content)
            
            for match in matches:
                event_raw, handler_raw = match
                
                # Clean event name
                event_name = event_raw.strip().strip('"\'')
                if '.' in event_name and not event_name.startswith('SOCKET_EVENTS'):
                    # Extract the last part for constants like GAME_EVENTS.JOIN_GAME
                    event_name = event_name.split('.')[-1].lower()
                
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    if line.strip().startswith('//') or line.strip().startswith('*'):
                        continue  # Skip commented lines
                    if f"socket.on({event_raw}" in line or f"socket.on( {event_raw}" in line:
                        registrations.append(HandlerRegistration(
                            file_path=str(file_path.relative_to(Path.cwd())),
                            line_number=i,
                            event_name=event_name,
                            handler_function=handler_raw.strip()
                        ))
                        break
                        
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
    
    # Group by event name to find duplicates
    event_groups: Dict[str, List[HandlerRegistration]] = {}
    for reg in registrations:
        if reg.event_name not in event_groups:
            event_groups[reg.event_name] = []
        event_groups[reg.event_name].append(reg)
    
    # Report duplicates
    duplicates = {event: regs for event, regs in event_groups.items() if len(regs) > 1}
    
    print(f"\n📊 Production Handler Summary:")
    print(f"  Total registrations: {len(registrations)}")
    print(f"  Unique events: {len(event_groups)}")
    print(f"  Events with duplicates: {len(duplicates)}")
    
    if duplicates:
        print(f"\n🚨 Production Duplicate Handlers:")
        for event, regs in duplicates.items():
            print(f"\n  📍 {event} ({len(regs)} handlers):")
            for reg in regs:
                print(f"    - {reg.file_path}:{reg.line_number}")
                print(f"      Handler: {reg.handler_function[:50]}...")
    else:
        print(f"\n✅ No duplicate handlers found in production code!")
        print(f"   All event handlers have single authoritative registration.")
    
    print(f"\n📋 All Production Events:")
    for event in sorted(event_groups.keys()):
        count = len(event_groups[event])
        status = "✅" if count == 1 else f"🚨 x{count}"
        print(f"  {status} {event}")

if __name__ == "__main__":
    main()
