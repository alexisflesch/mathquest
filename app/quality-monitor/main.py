#!/usr/bin/env python3
"""
MathQuest Quality Monitor - Main Orchestrator
Runs all analysis scripts and generates comprehensive reports with auto-fixes.
"""

import json
import os
import sys
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from report_generator import ReportGenerator
from auto_fixer import AutoFixer
from config_manager import ConfigManager
from global_config import get_config


class QualityMonitor:
    """Main orchestrator for the quality monitoring system."""
    
    def __init__(self, project_root: str = None):
        # Initialize global configuration
        self.global_config = get_config()
        
        self.project_root = Path(project_root) if project_root else Path(self.global_config.get_project_root())
        self.quality_monitor_root = Path(__file__).parent
        self.scripts_dir = self.quality_monitor_root / "scripts"
        self.reports_dir = self.quality_monitor_root / "reports"
        self.config_dir = self.quality_monitor_root / "config"
        
        # Ensure reports directory exists
        self.reports_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.config_manager = ConfigManager(self.config_dir)
        self.report_generator = ReportGenerator(self.reports_dir)
        self.auto_fixer = AutoFixer(self.project_root)
        
        # Analysis results storage
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'project_root': str(self.project_root),
            'analysis_results': {},
            'summary': {},
            'recommendations': [],
            'auto_fixes_applied': [],
            'errors': []
        }

    def run_full_analysis(self, auto_fix: bool = False, modules: List[str] = None) -> Dict[str, Any]:
        """Run complete quality analysis on the project."""
        print("🚀 Starting MathQuest Quality Monitor Analysis...")
        print(f"📁 Project Root: {self.project_root}")
        print(f"⏰ Timestamp: {self.results['timestamp']}")
        print("=" * 60)
        
        try:
            # 1. Run JavaScript analysis scripts
            self._run_javascript_analysis(modules)
            
            # 2. Run Python analysis scripts
            self._run_python_analysis()
            
            # 3. Generate summary and recommendations
            self._generate_summary()
            self._generate_recommendations()
            
            # 4. Apply auto-fixes if requested
            if auto_fix:
                self._apply_auto_fixes()
            
            # 5. Generate reports
            self._generate_reports()
            
            print("\n✅ Quality analysis completed successfully!")
            return self.results
            
        except Exception as e:
            error_msg = f"Quality analysis failed: {str(e)}"
            print(f"❌ {error_msg}")
            self.results['errors'].append({
                'category': 'system',
                'error': error_msg,
                'timestamp': datetime.now().isoformat()
            })
            return self.results

    def _run_javascript_analysis(self, modules: List[str] = None):
        """Run all JavaScript analysis scripts."""
        print("\n📊 Running JavaScript Analysis Scripts...")
        
        js_scripts = [
            ('bundle-analyzer.js', 'Bundle Analysis'),
            ('dependency-graph.js', 'Dependency Analysis'),
            ('eslint-runner.js', 'ESLint Analysis'),
            ('typescript-analyzer.js', 'TypeScript Analysis'),
            ('interface-similarity-checker.js', 'Interface Similarity Analysis'),
            ('navigation-graph-analyzer.js', 'Navigation Graph Analysis')
        ]
        
        for script_file, description in js_scripts:
            try:
                print(f"\n🔍 {description}...")
                script_path = self.scripts_dir / "javascript" / script_file
                
                if not script_path.exists():
                    print(f"⚠️  Script not found: {script_file}")
                    continue
                
                # Run the script and capture JSON output
                cmd = ['node', str(script_path), '--json']
                if modules:
                    cmd.extend(['--modules'] + modules)
                
                result = subprocess.run(
                    cmd,
                    cwd=str(self.scripts_dir / "javascript"),
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                if result.returncode == 0:
                    # Parse JSON output from the script
                    try:
                        output_lines = result.stdout.strip().split('\n')
                        json_start = -1
                        for i, line in enumerate(output_lines):
                            if line.startswith('{') or line == '--- JSON OUTPUT ---':
                                json_start = i + (1 if line == '--- JSON OUTPUT ---' else 0)
                                break
                        
                        if json_start >= 0:
                            json_output = '\n'.join(output_lines[json_start:])
                            if json_output.startswith('{'):
                                analysis_result = json.loads(json_output)
                                self.results['analysis_results'][script_file.replace('.js', '')] = analysis_result
                                print(f"✅ {description} completed")
                            else:
                                print(f"⚠️  No JSON output from {script_file}")
                        else:
                            print(f"⚠️  Could not find JSON output in {script_file}")
                    except json.JSONDecodeError as e:
                        print(f"❌ Failed to parse JSON from {script_file}: {e}")
                        self.results['errors'].append({
                            'category': 'parsing',
                            'script': script_file,
                            'error': f"JSON parsing error: {e}"
                        })
                else:
                    error_msg = result.stderr.strip() or result.stdout.strip()
                    print(f"❌ {description} failed: {error_msg}")
                    self.results['errors'].append({
                        'category': 'execution',
                        'script': script_file,
                        'error': error_msg
                    })
                    
            except subprocess.TimeoutExpired:
                print(f"⏰ {description} timed out")
                self.results['errors'].append({
                    'category': 'timeout',
                    'script': script_file,
                    'error': 'Script execution timed out'
                })
            except Exception as e:
                print(f"❌ {description} error: {e}")
                self.results['errors'].append({
                    'category': 'execution',
                    'script': script_file,
                    'error': str(e)
                })

    def _run_python_analysis(self):
        """Run Python analysis scripts."""
        print("\n🐍 Running Python Analysis Scripts...")
        
        python_scripts = [
            ('hardcoded_strings.py', 'Hardcoded Strings Analysis'),
            ('architecture_validator.py', 'Architecture Validation'),
            ('performance_analyzer.py', 'Performance Analysis')
        ]
        
        for script_file, description in python_scripts:
            try:
                print(f"\n🔍 {description}...")
                script_path = self.scripts_dir / "python" / script_file
                
                if not script_path.exists():
                    print(f"⚠️  Script not found: {script_file}")
                    continue
                
                # Run the Python script
                result = subprocess.run([
                    sys.executable, str(script_path),
                    '--project-root', str(self.project_root),
                    '--json'
                ], capture_output=True, text=True, timeout=300)
                
                if result.returncode == 0:
                    try:
                        analysis_result = json.loads(result.stdout)
                        self.results['analysis_results'][script_file.replace('.py', '')] = analysis_result
                        print(f"✅ {description} completed")
                    except json.JSONDecodeError as e:
                        print(f"❌ Failed to parse JSON from {script_file}: {e}")
                else:
                    error_msg = result.stderr.strip() or result.stdout.strip()
                    print(f"❌ {description} failed: {error_msg}")
                    self.results['errors'].append({
                        'category': 'execution',
                        'script': script_file,
                        'error': error_msg
                    })
                    
            except subprocess.TimeoutExpired:
                print(f"⏰ {description} timed out")
            except Exception as e:
                print(f"❌ {description} error: {e}")

    def _generate_summary(self):
        """Generate overall summary from all analysis results."""
        print("\n📋 Generating Summary...")
        
        summary = {
            'total_files_analyzed': 0,
            'total_issues': 0,
            'critical_issues': 0,
            'warnings': 0,
            'fixable_issues': 0,
            'modules_analyzed': [],
            'overall_score': 0,
            'category_scores': {}
        }
        
        # Aggregate data from all analysis results
        for script_name, data in self.results['analysis_results'].items():
            if isinstance(data, dict):
                # Extract relevant metrics based on script type
                if 'summary' in data:
                    script_summary = data['summary']
                    summary['total_files_analyzed'] += script_summary.get('totalFiles', 0)
                    summary['total_issues'] += script_summary.get('totalIssues', 0)
                    summary['critical_issues'] += script_summary.get('criticalIssues', 0)
                    summary['warnings'] += script_summary.get('warnings', 0)
                    summary['fixable_issues'] += script_summary.get('fixableIssues', 0)
                
                if 'modules' in data:
                    for module_name in data['modules'].keys():
                        if module_name not in summary['modules_analyzed']:
                            summary['modules_analyzed'].append(module_name)
                
                # Category-specific scoring
                if script_name == 'eslint-runner':
                    summary['category_scores']['code_quality'] = data.get('summary', {}).get('overallScore', 0)
                elif script_name == 'typescript-analyzer':
                    summary['category_scores']['type_safety'] = data.get('summary', {}).get('overallScore', 0)
                elif script_name == 'bundle-analyzer':
                    summary['category_scores']['bundle_health'] = data.get('summary', {}).get('overallScore', 0)
                elif script_name == 'dependency-graph':
                    summary['category_scores']['dependencies'] = data.get('summary', {}).get('overallScore', 0)
        
        # Calculate overall score
        category_scores = list(summary['category_scores'].values())
        if category_scores:
            summary['overall_score'] = sum(category_scores) / len(category_scores)
        
        self.results['summary'] = summary
        print(f"📊 Overall Score: {summary['overall_score']:.1f}/100")

    def _generate_recommendations(self):
        """Generate actionable recommendations based on analysis results."""
        print("\n💡 Generating Recommendations...")
        
        recommendations = []
        
        # Analyze each script's results for recommendations
        for script_name, data in self.results['analysis_results'].items():
            if isinstance(data, dict) and 'recommendations' in data:
                for rec in data['recommendations']:
                    recommendations.append({
                        'source': script_name,
                        'category': rec.get('category', 'unknown'),
                        'priority': rec.get('priority', 'medium'),
                        'issue': rec.get('issue', ''),
                        'action': rec.get('action', ''),
                        'auto_fixable': rec.get('auto_fixable', False)
                    })
        
        # Add system-level recommendations
        if self.results['errors']:
            recommendations.append({
                'source': 'system',
                'category': 'configuration',
                'priority': 'high',
                'issue': f"Found {len(self.results['errors'])} analysis errors",
                'action': 'Review and fix script execution issues',
                'auto_fixable': False
            })
        
        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 4))
        
        self.results['recommendations'] = recommendations
        print(f"📝 Generated {len(recommendations)} recommendations")

    def _apply_auto_fixes(self):
        """Apply automatic fixes for safe issues."""
        print("\n🔧 Applying Auto-fixes...")
        
        auto_fixable_recommendations = [
            rec for rec in self.results['recommendations'] 
            if rec.get('auto_fixable', False)
        ]
        
        if not auto_fixable_recommendations:
            print("⚠️  No auto-fixable issues found")
            return
        
        applied_fixes = []
        
        for rec in auto_fixable_recommendations:
            try:
                fix_result = self.auto_fixer.apply_fix(rec)
                if fix_result['success']:
                    applied_fixes.append(fix_result)
                    print(f"✅ Applied fix: {rec['issue']}")
                else:
                    print(f"❌ Failed to apply fix: {rec['issue']}")
            except Exception as e:
                print(f"❌ Auto-fix error: {e}")
        
        self.results['auto_fixes_applied'] = applied_fixes
        print(f"🔧 Applied {len(applied_fixes)} auto-fixes")

    def _generate_reports(self):
        """Generate various report formats."""
        print("\n📄 Generating Reports...")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate JSON report
        json_report_path = self.reports_dir / f"quality_report_{timestamp}.json"
        with open(json_report_path, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        print(f"📄 JSON report: {json_report_path}")
        
        # Generate HTML report
        html_report_path = self.report_generator.generate_html_report(self.results, timestamp)
        print(f"📄 HTML report: {html_report_path}")
        
        # Generate summary report
        summary_report_path = self.report_generator.generate_summary_report(self.results, timestamp)
        print(f"📄 Summary report: {summary_report_path}")

    def print_summary(self):
        """Print a quick summary to console."""
        summary = self.results.get('summary', {})
        recommendations = self.results.get('recommendations', [])
        
        print("\n" + "="*60)
        print("📊 MATHQUEST QUALITY MONITOR SUMMARY")
        print("="*60)
        print(f"📁 Files Analyzed: {summary.get('total_files_analyzed', 0)}")
        print(f"🐛 Total Issues: {summary.get('total_issues', 0)}")
        print(f"🚨 Critical Issues: {summary.get('critical_issues', 0)}")
        print(f"⚠️  Warnings: {summary.get('warnings', 0)}")
        print(f"🔧 Auto-fixable: {summary.get('fixable_issues', 0)}")
        print(f"📈 Overall Score: {summary.get('overall_score', 0):.1f}/100")
        
        if recommendations:
            print(f"\n💡 Top Recommendations:")
            for i, rec in enumerate(recommendations[:5], 1):
                priority_emoji = {'critical': '🚨', 'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(rec['priority'], '⚪')
                print(f"  {i}. {priority_emoji} {rec['issue']}")
        
        print("="*60)

    def list_available_scripts(self):
        """List all available analysis scripts."""
        print("📋 Available Analysis Scripts:\n")
        
        print("🟨 JavaScript Scripts:")
        js_scripts = [
            ('bundle-analyzer.js', 'Bundle Analysis'),
            ('dependency-graph.js', 'Dependency Analysis'),
            ('eslint-runner.js', 'ESLint Analysis'),
            ('typescript-analyzer.js', 'TypeScript Analysis'),
            ('interface-similarity-checker.js', 'Interface Similarity Analysis'),
            ('navigation-graph-analyzer.js', 'Navigation Graph Analysis')
        ]
        
        for script_file, description in js_scripts:
            script_name = script_file.replace('.js', '')
            print(f"   • {script_name:<30} - {description}")
        
        print("\n🐍 Python Scripts:")
        python_scripts = [
            ('hardcoded_strings.py', 'Hardcoded Strings Analysis'),
            ('architecture_validator.py', 'Architecture Validation'),
            ('performance_analyzer.py', 'Performance Analysis'),
            ('code_duplicator.py', 'Code Duplication Detection'),
            ('legacy_detector.py', 'Legacy Pattern Detection'),
            ('documentation_sync.py', 'Documentation Sync Check')
        ]
        
        for script_file, description in python_scripts:
            script_name = script_file.replace('.py', '')
            print(f"   • {script_name:<30} - {description}")
        
        print("\nUsage: python main.py --script <script-name>")
        print("Example: python main.py --script interface-similarity-checker")

    def run_single_script(self, script_name: str, output_json: bool = False) -> Dict[str, Any]:
        """Run a single analysis script by name."""
        print(f"🔍 Running single script: {script_name}")
        print("=" * 50)
        
        # Check if it's a JavaScript script
        js_script_path = self.scripts_dir / "javascript" / f"{script_name}.js"
        py_script_path = self.scripts_dir / "python" / f"{script_name}.py"
        
        result = {
            'script_name': script_name,
            'timestamp': datetime.now().isoformat(),
            'success': False,
            'output': None,
            'error': None
        }
        
        try:
            if js_script_path.exists():
                result.update(self._run_single_js_script(js_script_path, script_name))
            elif py_script_path.exists():
                result.update(self._run_single_py_script(py_script_path, script_name))
            else:
                error_msg = f"Script not found: {script_name}"
                print(f"❌ {error_msg}")
                print("💡 Use --list-scripts to see available scripts")
                result['error'] = error_msg
                
        except Exception as e:
            error_msg = f"Failed to run {script_name}: {str(e)}"
            print(f"❌ {error_msg}")
            result['error'] = error_msg
        
        return result

    def _run_single_js_script(self, script_path: Path, script_name: str) -> Dict[str, Any]:
        """Run a single JavaScript script."""
        print(f"🟨 Running JavaScript script: {script_name}")
        
        try:
            cmd = ['node', str(script_path)]
            
            # Add configuration parameters for specific scripts
            if script_name == 'navigation-graph-analyzer':
                frontend_url = self.global_config.get('server_config.frontend.url')
                timeout = self.global_config.get_timeout('navigation_analysis')
                cmd.extend(['--url', frontend_url, '--timeout', str(timeout)])
            elif script_name in ['interface-similarity-checker', 'navigation-graph-analyzer']:
                # These scripts don't need --json flag, they output formatted results
                pass
            else:
                cmd.append('--json')
            
            print(f"🔧 Command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                cwd=str(self.scripts_dir / "javascript"),
                capture_output=True,
                text=True,
                timeout=self.global_config.get_timeout('script_execution')
            )
            
            if result.returncode == 0:
                print("✅ Script completed successfully!")
                if not script_name in ['interface-similarity-checker', 'navigation-graph-analyzer']:
                    # Try to parse JSON output for other scripts
                    try:
                        output_lines = result.stdout.strip().split('\n')
                        json_start = -1
                        for i, line in enumerate(output_lines):
                            if line.startswith('{') or line == '--- JSON OUTPUT ---':
                                json_start = i + (1 if line == '--- JSON OUTPUT ---' else 0)
                                break
                        
                        if json_start >= 0:
                            json_output = '\n'.join(output_lines[json_start:])
                            if json_output.startswith('{'):
                                parsed_output = json.loads(json_output)
                                return {'success': True, 'output': parsed_output}
                    except json.JSONDecodeError:
                        pass
                
                # For scripts with formatted output or if JSON parsing fails
                print("\n" + result.stdout)
                return {'success': True, 'output': result.stdout}
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                print(f"❌ Script failed: {error_msg}")
                return {'success': False, 'error': error_msg}
                
        except subprocess.TimeoutExpired:
            error_msg = "Script execution timed out"
            print(f"⏰ {error_msg}")
            return {'success': False, 'error': error_msg}

    def _run_single_py_script(self, script_path: Path, script_name: str) -> Dict[str, Any]:
        """Run a single Python script."""
        print(f"🐍 Running Python script: {script_name}")
        
        try:
            result = subprocess.run([
                sys.executable, str(script_path),
                '--project-root', str(self.project_root),
                '--json'
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print("✅ Script completed successfully!")
                try:
                    parsed_output = json.loads(result.stdout)
                    return {'success': True, 'output': parsed_output}
                except json.JSONDecodeError:
                    # If JSON parsing fails, return raw output
                    print("\n" + result.stdout)
                    return {'success': True, 'output': result.stdout}
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                print(f"❌ Script failed: {error_msg}")
                return {'success': False, 'error': error_msg}
                
        except subprocess.TimeoutExpired:
            error_msg = "Script execution timed out"
            print(f"⏰ {error_msg}")
            return {'success': False, 'error': error_msg}

def main():
    """Main CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='MathQuest Quality Monitor')
    parser.add_argument('--full-report', action='store_true', 
                        help='Run complete quality analysis')
    parser.add_argument('--quick', action='store_true',
                        help='Run quick analysis')
    parser.add_argument('--critical-only', action='store_true',
                        help='Show only critical issues')
    parser.add_argument('--save-history', action='store_true',
                        help='Save results to history')
    parser.add_argument('--auto-fix', action='store_true',
                        help='Apply automatic fixes')
    parser.add_argument('--module', type=str,
                        help='Analyze specific module (frontend, backend, shared)')
    parser.add_argument('--checks', type=str,
                        help='Comma-separated list of specific checks to run')
    parser.add_argument('--list-scripts', action='store_true',
                        help='List all available analysis scripts')
    parser.add_argument('--run-script', type=str,
                        help='Run a specific analysis script by name')
    parser.add_argument('--project-root', type=str, default='..',
                        help='Project root directory (default: ..)')
    
    args = parser.parse_args()
    
    # Initialize quality monitor
    monitor = QualityMonitor(args.project_root)
    
    try:
        if args.list_scripts:
            monitor.list_available_scripts()
        elif args.run_script:
            result = monitor.run_single_script(args.run_script)
            return 0 if result.get('success', False) else 1
        elif args.full_report:
            modules = [args.module] if args.module else None
            monitor.run_full_analysis(auto_fix=args.auto_fix, modules=modules)
        elif args.quick:
            print("🚀 Running Quick Quality Check...")
            # Run subset of critical checks
            modules = [args.module] if args.module else None
            monitor.run_full_analysis(auto_fix=False, modules=modules)
        else:
            # Default: show help
            parser.print_help()
            return 1
            
    except KeyboardInterrupt:
        print("\n❌ Analysis interrupted by user")
        return 1
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
