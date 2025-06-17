"""
Report Generator for MathQuest Quality Monitor
Generates HTML and text reports from analysis results.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any


class ReportGenerator:
    """Generates various report formats from analysis results."""
    
    def __init__(self, reports_dir: Path):
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(exist_ok=True)
    
    def generate_html_report(self, results: Dict[str, Any], timestamp: str) -> Path:
        """Generate a comprehensive HTML report."""
        template = self._get_html_template()
        
        # Prepare data for template
        summary = results.get('summary', {})
        recommendations = results.get('recommendations', [])
        analysis_results = results.get('analysis_results', {})
        
        # Generate charts data
        charts_data = self._generate_charts_data(analysis_results)
        
        # Replace template variables
        html_content = template.format(
            timestamp=timestamp,
            project_root=results.get('project_root', ''),
            overall_score=summary.get('overall_score', 0),
            total_files=summary.get('total_files_analyzed', 0),
            total_issues=summary.get('total_issues', 0),
            critical_issues=summary.get('critical_issues', 0),
            warnings=summary.get('warnings', 0),
            fixable_issues=summary.get('fixable_issues', 0),
            recommendations_html=self._format_recommendations_html(recommendations),
            module_scores_html=self._format_module_scores_html(analysis_results),
            charts_data_json=json.dumps(charts_data),
            detailed_results_html=self._format_detailed_results_html(analysis_results)
        )
        
        # Write HTML file
        html_file = self.reports_dir / f"quality_report_{timestamp}.html"
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return html_file
    
    def generate_summary_report(self, results: Dict[str, Any], timestamp: str) -> Path:
        """Generate a concise text summary report."""
        summary = results.get('summary', {})
        recommendations = results.get('recommendations', [])
        
        lines = [
            "MATHQUEST QUALITY MONITOR REPORT",
            "=" * 40,
            f"Generated: {timestamp}",
            f"Project: {results.get('project_root', '')}",
            "",
            "SUMMARY:",
            f"  Files Analyzed: {summary.get('total_files_analyzed', 0)}",
            f"  Total Issues: {summary.get('total_issues', 0)}",
            f"  Critical Issues: {summary.get('critical_issues', 0)}",
            f"  Warnings: {summary.get('warnings', 0)}",
            f"  Auto-fixable: {summary.get('fixable_issues', 0)}",
            f"  Overall Score: {summary.get('overall_score', 0):.1f}/100",
            "",
            "CATEGORY SCORES:",
        ]
        
        for category, score in summary.get('category_scores', {}).items():
            lines.append(f"  {category.replace('_', ' ').title()}: {score:.1f}/100")
        
        if recommendations:
            lines.extend([
                "",
                "TOP RECOMMENDATIONS:",
            ])
            for i, rec in enumerate(recommendations[:10], 1):
                priority = rec['priority'].upper()
                lines.append(f"  {i}. [{priority}] {rec['issue']}")
                lines.append(f"     Action: {rec['action']}")
        
        # Write summary file
        summary_file = self.reports_dir / f"quality_summary_{timestamp}.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        
        return summary_file
    
    def _get_html_template(self) -> str:
        """Get the HTML template for reports."""
        return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MathQuest Quality Report - {timestamp}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            border-bottom: 2px solid #007acc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .score {{
            font-size: 3em;
            font-weight: bold;
            color: #007acc;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        .metric {{
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
        }}
        .metric-value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }}
        .metric-label {{
            color: #666;
            margin-top: 5px;
        }}
        .section {{
            margin: 40px 0;
        }}
        .section h2 {{
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }}
        .recommendation {{
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #007acc;
            background: #f8f9fa;
            border-radius: 4px;
        }}
        .priority-high {{
            border-left-color: #dc3545;
        }}
        .priority-critical {{
            border-left-color: #6f42c1;
        }}
        .chart-container {{
            width: 100%;
            height: 400px;
            margin: 20px 0;
        }}
        .module-scores {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }}
        .module-score {{
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 MathQuest Quality Report</h1>
            <p>Generated: {timestamp}</p>
            <p>Project: {project_root}</p>
            <div class="score">{overall_score:.1f}/100</div>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">{total_files}</div>
                <div class="metric-label">Files Analyzed</div>
            </div>
            <div class="metric">
                <div class="metric-value">{total_issues}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">{critical_issues}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">{warnings}</div>
                <div class="metric-label">Warnings</div>
            </div>
            <div class="metric">
                <div class="metric-value">{fixable_issues}</div>
                <div class="metric-label">Auto-fixable</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Module Scores</h2>
            <div class="module-scores">
                {module_scores_html}
            </div>
        </div>
        
        <div class="section">
            <h2>📈 Analysis Overview</h2>
            <div class="chart-container">
                <canvas id="overviewChart"></canvas>
            </div>
        </div>
        
        <div class="section">
            <h2>💡 Recommendations</h2>
            {recommendations_html}
        </div>
        
        <div class="section">
            <h2>📋 Detailed Results</h2>
            {detailed_results_html}
        </div>
    </div>
    
    <script>
        const chartsData = {charts_data_json};
        
        // Overview Chart
        const ctx = document.getElementById('overviewChart').getContext('2d');
        new Chart(ctx, {{
            type: 'doughnut',
            data: {{
                labels: chartsData.overview.labels,
                datasets: [{{
                    data: chartsData.overview.data,
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6f42c1']
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'bottom'
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>'''
    
    def _format_recommendations_html(self, recommendations) -> str:
        """Format recommendations as HTML."""
        if not recommendations:
            return "<p>No recommendations available.</p>"
        
        html_parts = []
        for rec in recommendations:
            priority_class = f"priority-{rec['priority']}" if rec['priority'] in ['high', 'critical'] else ""
            auto_fix_badge = "🔧 Auto-fixable" if rec.get('auto_fixable') else ""
            
            html_parts.append(f'''
            <div class="recommendation {priority_class}">
                <strong>[{rec['priority'].upper()}] {rec['issue']}</strong>
                <p>{rec['action']}</p>
                {f"<small>{auto_fix_badge}</small>" if auto_fix_badge else ""}
            </div>
            ''')
        
        return ''.join(html_parts)
    
    def _format_module_scores_html(self, analysis_results) -> str:
        """Format module scores as HTML."""
        html_parts = []
        
        for script_name, data in analysis_results.items():
            if isinstance(data, dict) and 'modules' in data:
                for module_name, module_data in data['modules'].items():
                    score = 100  # Default score
                    if isinstance(module_data, dict):
                        # Calculate score based on errors/warnings
                        errors = module_data.get('errors', 0)
                        warnings = module_data.get('warnings', 0)
                        score = max(0, 100 - (errors * 10) - (warnings * 2))
                    
                    html_parts.append(f'''
                    <div class="module-score">
                        <strong>{module_name}</strong>
                        <div class="metric-value">{score:.0f}/100</div>
                    </div>
                    ''')
        
        return ''.join(html_parts) if html_parts else "<p>No module scores available.</p>"
    
    def _format_detailed_results_html(self, analysis_results) -> str:
        """Format detailed analysis results as HTML."""
        html_parts = []
        
        for script_name, data in analysis_results.items():
            html_parts.append(f'''
            <div class="section">
                <h3>{script_name.replace('_', ' ').title()}</h3>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto;">
{json.dumps(data, indent=2) if isinstance(data, dict) else str(data)}
                </pre>
            </div>
            ''')
        
        return ''.join(html_parts)
    
    def _generate_charts_data(self, analysis_results) -> Dict[str, Any]:
        """Generate data for charts."""
        # Count issues by category
        total_good = 0
        total_warnings = 0
        total_errors = 0
        total_critical = 0
        
        for script_name, data in analysis_results.items():
            if isinstance(data, dict):
                if 'summary' in data:
                    summary = data['summary']
                    total_warnings += summary.get('totalWarnings', 0)
                    total_errors += summary.get('totalErrors', 0)
                    total_critical += summary.get('criticalIssues', 0)
                elif 'modules' in data:
                    for module_data in data['modules'].values():
                        if isinstance(module_data, dict):
                            total_warnings += module_data.get('warnings', 0)
                            total_errors += module_data.get('errors', 0)
        
        # Calculate "good" items (files without issues)
        total_issues = total_warnings + total_errors + total_critical
        total_good = max(0, 100 - total_issues)  # Rough estimate
        
        return {
            'overview': {
                'labels': ['Good', 'Warnings', 'Errors', 'Critical'],
                'data': [total_good, total_warnings, total_errors, total_critical]
            }
        }
