#!/usr/bin/env python3
"""
Backend Event Handler Audit Script

This script systematically analyzes all socket event handler registrations
to identify dual registrations, inconsistencies, and architectural issues.

Following .instructions.md guidelines:
- Document everything
- Fix root causes
- Use scripts instead of manual edits
- Zero tolerance for legacy patterns
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
from dataclasses import dataclass

@dataclass
class HandlerRegistration:
    """Represents a socket event handler registration"""
    file_path: str
    line_number: int
    event_name: str
    handler_function: str
    context_lines: List[str]
    full_line: str

class EventHandlerAuditor:
    def __init__(self, backend_path: str):
        self.backend_path = Path(backend_path)
        self.registrations: List[HandlerRegistration] = []
        self.event_duplicates: Dict[str, List[HandlerRegistration]] = {}
        
    def scan_for_handlers(self):
        """Scan all TypeScript files for socket event handler registrations"""
        print("🔍 Scanning for socket event handler registrations...")
        
        # Pattern to match socket.on() calls
        handler_pattern = re.compile(
            r'socket\.on\s*\(\s*([^,]+)\s*,\s*([^)]+)\)',
            re.MULTILINE | re.DOTALL
        )
        
        ts_files = list(self.backend_path.rglob("*.ts"))
        print(f"Found {len(ts_files)} TypeScript files to analyze")
        
        for file_path in ts_files:
            if 'node_modules' in str(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                
                for match in handler_pattern.finditer(content):
                    # Find line number
                    line_num = content[:match.start()].count('\n') + 1
                    
                    # Extract event name and handler
                    event_raw = match.group(1).strip()
                    handler_raw = match.group(2).strip()
                    
                    # Clean up event name (remove quotes, constants)
                    event_name = self._clean_event_name(event_raw)
                    
                    # Get context lines
                    start_line = max(0, line_num - 3)
                    end_line = min(len(lines), line_num + 2)
                    context = lines[start_line:end_line]
                    
                    registration = HandlerRegistration(
                        file_path=str(file_path.relative_to(self.backend_path)),
                        line_number=line_num,
                        event_name=event_name,
                        handler_function=handler_raw,
                        context_lines=context,
                        full_line=lines[line_num - 1] if line_num <= len(lines) else ""
                    )
                    
                    self.registrations.append(registration)
                    
            except Exception as e:
                print(f"❌ Error reading {file_path}: {e}")
    
    def _clean_event_name(self, event_raw: str) -> str:
        """Clean and normalize event names"""
        # Remove quotes
        event = event_raw.strip('"\'')
        
        # Handle constants like GAME_EVENTS.JOIN_GAME
        if '.' in event:
            parts = event.split('.')
            if len(parts) == 2:
                # Look up the actual event name
                const_name = parts[1]
                return self._resolve_event_constant(const_name)
        
        return event
    
    def _resolve_event_constant(self, const_name: str) -> str:
        """Resolve event constants to actual event names"""
        # Common mappings based on shared/types/socket/events.ts
        event_mappings = {
            'JOIN_GAME': 'join_game',
            'GAME_ANSWER': 'game_answer',
            'REQUEST_PARTICIPANTS': 'request_participants',
            'REQUEST_NEXT_QUESTION': 'request_next_question',
            'START_GAME': 'start_game',
            'JOIN_TOURNAMENT': 'join_tournament',
            'TOURNAMENT_ANSWER': 'tournament_answer',
        }
        
        return event_mappings.get(const_name, const_name.lower())
    
    def find_duplicates(self):
        """Identify duplicate event handler registrations"""
        print("\n🔍 Analyzing for duplicate registrations...")
        
        event_groups: Dict[str, List[HandlerRegistration]] = {}
        
        for reg in self.registrations:
            if reg.event_name not in event_groups:
                event_groups[reg.event_name] = []
            event_groups[reg.event_name].append(reg)
        
        # Find events with multiple handlers
        for event, handlers in event_groups.items():
            if len(handlers) > 1:
                self.event_duplicates[event] = handlers
    
    def generate_report(self) -> str:
        """Generate comprehensive audit report"""
        report = []
        report.append("# Backend Event Handler Audit Report")
        report.append(f"Generated: {__import__('datetime').datetime.now().isoformat()}")
        report.append("")
        
        # Summary
        report.append("## 📊 Summary")
        report.append(f"- Total handler registrations found: {len(self.registrations)}")
        report.append(f"- Unique events: {len(set(r.event_name for r in self.registrations))}")
        report.append(f"- **Duplicate registrations: {len(self.event_duplicates)}**")
        report.append("")
        
        # Duplicates (Critical Issues)
        if self.event_duplicates:
            report.append("## 🚨 CRITICAL: Duplicate Event Handler Registrations")
            report.append("")
            
            for event, handlers in self.event_duplicates.items():
                report.append(f"### Event: `{event}` ({len(handlers)} handlers)")
                report.append("")
                
                for i, handler in enumerate(handlers, 1):
                    report.append(f"**Handler {i}:**")
                    report.append(f"- File: `{handler.file_path}`")
                    report.append(f"- Line: {handler.line_number}")
                    report.append(f"- Function: `{handler.handler_function}`")
                    report.append("- Context:")
                    report.append("```typescript")
                    for line in handler.context_lines:
                        report.append(line)
                    report.append("```")
                    report.append("")
        
        # All registrations
        report.append("## 📋 All Handler Registrations")
        report.append("")
        
        events = sorted(set(r.event_name for r in self.registrations))
        for event in events:
            handlers = [r for r in self.registrations if r.event_name == event]
            
            duplicate_marker = "🚨" if len(handlers) > 1 else "✅"
            report.append(f"### {duplicate_marker} `{event}` ({len(handlers)} handler{'s' if len(handlers) > 1 else ''})")
            
            for handler in handlers:
                report.append(f"- `{handler.file_path}:{handler.line_number}` → `{handler.handler_function}`")
            report.append("")
        
        # Recommendations
        report.append("## 🔧 Recommendations")
        report.append("")
        
        if self.event_duplicates:
            report.append("### Critical Actions Required:")
            for event in self.event_duplicates:
                report.append(f"- **Fix `{event}` duplication**: Choose single handler or implement proper coordination")
            report.append("")
        
        report.append("### Architecture Improvements:")
        report.append("- Document clear handler responsibility separation")
        report.append("- Implement handler registration validation")
        report.append("- Create handler registration patterns/guidelines")
        report.append("- Add automated tests for handler registrations")
        
        return "\n".join(report)
    
    def run_audit(self) -> str:
        """Run complete audit and return report"""
        self.scan_for_handlers()
        self.find_duplicates()
        return self.generate_report()

if __name__ == "__main__":
    # Run from backend directory
    backend_path = "."
    
    print("🚀 Starting Backend Event Handler Audit...")
    print("Following .instructions.md: Fix root causes, no manual edits")
    print("")
    
    auditor = EventHandlerAuditor(backend_path)
    report = auditor.run_audit()
    
    # Save report
    report_path = "handler_audit_report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"✅ Audit complete! Report saved to: {report_path}")
    print("")
    
    # Show critical issues
    if auditor.event_duplicates:
        print("🚨 CRITICAL ISSUES FOUND:")
        for event, handlers in auditor.event_duplicates.items():
            print(f"  - {event}: {len(handlers)} duplicate handlers")
    else:
        print("✅ No duplicate handlers found!")
