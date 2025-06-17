"""
Configuration Manager for MathQuest Quality Monitor
Manages configuration files and settings for the quality monitoring system.
"""

import json
import yaml
from pathlib import Path
from typing import Dict, Any, Optional


class ConfigManager:
    """Manages configuration for the quality monitoring system."""
    
    def __init__(self, config_dir: Path):
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)
        
        # Default configuration file paths
        self.main_config_file = self.config_dir / "main.json"
        self.rules_config_file = self.config_dir / "rules.yaml"
        self.thresholds_config_file = self.config_dir / "thresholds.json"
        
        # Initialize default configs if they don't exist
        self._initialize_default_configs()
    
    def _initialize_default_configs(self):
        """Create default configuration files if they don't exist."""
        
        # Main configuration
        if not self.main_config_file.exists():
            default_main_config = {
                "version": "1.0.0",
                "project_name": "MathQuest",
                "analysis": {
                    "enabled_scripts": [
                        "bundle-analyzer",
                        "dependency-graph", 
                        "eslint-runner",
                        "typescript-analyzer"
                    ],
                    "timeout_seconds": 300,
                    "max_files_per_analysis": 1000,
                    "exclude_patterns": [
                        "node_modules/**",
                        "dist/**",
                        "build/**",
                        ".next/**",
                        "coverage/**",
                        "*.min.js",
                        "*.bundle.js"
                    ]
                },
                "reporting": {
                    "formats": ["html", "json", "summary"],
                    "include_charts": True,
                    "include_detailed_results": True
                },
                "auto_fix": {
                    "enabled": True,
                    "safe_fixes_only": True,
                    "create_backups": True,
                    "max_files_per_fix": 50
                }
            }
            
            with open(self.main_config_file, 'w') as f:
                json.dump(default_main_config, f, indent=2)
        
        # Rules configuration
        if not self.rules_config_file.exists():
            default_rules_config = {
                "hardcoded_strings": {
                    "event_names": {
                        "enabled": True,
                        "severity": "warning",
                        "patterns": [
                            "user-joined", "user-left", "game-started", 
                            "game-ended", "question-answered", "timer-update"
                        ]
                    },
                    "api_endpoints": {
                        "enabled": True,
                        "severity": "error", 
                        "patterns": ["/api/", "/endpoint/"]
                    },
                    "magic_numbers": {
                        "enabled": True,
                        "severity": "warning",
                        "exclude": [0, 1, -1, 100, 1000]
                    }
                },
                "code_quality": {
                    "console_statements": {
                        "enabled": True,
                        "severity": "warning",
                        "auto_fix": True
                    },
                    "debugger_statements": {
                        "enabled": True,
                        "severity": "error",
                        "auto_fix": False
                    },
                    "todo_comments": {
                        "enabled": True,
                        "severity": "info",
                        "patterns": ["TODO", "FIXME", "HACK", "XXX"]
                    }
                },
                "typescript": {
                    "any_usage": {
                        "enabled": True,
                        "severity": "warning",
                        "max_percentage": 5
                    },
                    "type_assertions": {
                        "enabled": True,
                        "severity": "warning",
                        "max_per_file": 3
                    },
                    "implicit_any": {
                        "enabled": True,
                        "severity": "error"
                    }
                },
                "dependencies": {
                    "circular_dependencies": {
                        "enabled": True,
                        "severity": "error"
                    },
                    "unused_dependencies": {
                        "enabled": True,
                        "severity": "warning",
                        "auto_fix": False
                    },
                    "duplicate_dependencies": {
                        "enabled": True,
                        "severity": "warning",
                        "auto_fix": True
                    }
                },
                "architecture": {
                    "cross_module_imports": {
                        "enabled": True,
                        "severity": "warning",
                        "allowed_patterns": ["@/shared/**", "@/utils/**"]
                    },
                    "deep_import_paths": {
                        "enabled": True,
                        "severity": "warning",
                        "max_depth": 3
                    }
                }
            }
            
            with open(self.rules_config_file, 'w') as f:
                yaml.dump(default_rules_config, f, default_flow_style=False, indent=2)
        
        # Thresholds configuration
        if not self.thresholds_config_file.exists():
            default_thresholds_config = {
                "scores": {
                    "excellent": 90,
                    "good": 75,
                    "fair": 60,
                    "poor": 40
                },
                "limits": {
                    "max_errors_per_file": 5,
                    "max_warnings_per_file": 20,
                    "max_file_size_kb": 100,
                    "max_function_length": 50,
                    "max_cyclomatic_complexity": 10
                },
                "bundle": {
                    "max_bundle_size_mb": 5,
                    "max_chunk_size_mb": 1,
                    "min_tree_shaking_percentage": 80
                },
                "performance": {
                    "max_load_time_ms": 3000,
                    "max_memory_usage_mb": 100,
                    "min_lighthouse_score": 80
                }
            }
            
            with open(self.thresholds_config_file, 'w') as f:
                json.dump(default_thresholds_config, f, indent=2)
    
    def get_main_config(self) -> Dict[str, Any]:
        """Get the main configuration."""
        with open(self.main_config_file, 'r') as f:
            return json.load(f)
    
    def get_rules_config(self) -> Dict[str, Any]:
        """Get the rules configuration."""
        with open(self.rules_config_file, 'r') as f:
            return yaml.safe_load(f)
    
    def get_thresholds_config(self) -> Dict[str, Any]:
        """Get the thresholds configuration."""
        with open(self.thresholds_config_file, 'r') as f:
            return json.load(f)
    
    def update_config(self, config_type: str, updates: Dict[str, Any]) -> bool:
        """Update a configuration file."""
        try:
            if config_type == "main":
                config = self.get_main_config()
                config.update(updates)
                with open(self.main_config_file, 'w') as f:
                    json.dump(config, f, indent=2)
            
            elif config_type == "rules":
                config = self.get_rules_config()
                config.update(updates)
                with open(self.rules_config_file, 'w') as f:
                    yaml.dump(config, f, default_flow_style=False, indent=2)
            
            elif config_type == "thresholds":
                config = self.get_thresholds_config()
                config.update(updates)
                with open(self.thresholds_config_file, 'w') as f:
                    json.dump(config, f, indent=2)
            
            else:
                return False
            
            return True
            
        except Exception:
            return False
    
    def is_rule_enabled(self, category: str, rule: str) -> bool:
        """Check if a specific rule is enabled."""
        try:
            rules = self.get_rules_config()
            return rules.get(category, {}).get(rule, {}).get('enabled', False)
        except Exception:
            return False
    
    def get_rule_severity(self, category: str, rule: str) -> str:
        """Get the severity level for a rule."""
        try:
            rules = self.get_rules_config()
            return rules.get(category, {}).get(rule, {}).get('severity', 'warning')
        except Exception:
            return 'warning'
    
    def get_threshold(self, category: str, threshold: str) -> Optional[Any]:
        """Get a specific threshold value."""
        try:
            thresholds = self.get_thresholds_config()
            return thresholds.get(category, {}).get(threshold)
        except Exception:
            return None
    
    def is_auto_fix_enabled(self, category: str, rule: str) -> bool:
        """Check if auto-fix is enabled for a rule."""
        try:
            rules = self.get_rules_config()
            return rules.get(category, {}).get(rule, {}).get('auto_fix', False)
        except Exception:
            return False
    
    def get_exclude_patterns(self) -> list:
        """Get file/directory exclusion patterns."""
        try:
            config = self.get_main_config()
            return config.get('analysis', {}).get('exclude_patterns', [])
        except Exception:
            return []
    
    def should_exclude_file(self, file_path: str) -> bool:
        """Check if a file should be excluded from analysis."""
        import fnmatch
        
        exclude_patterns = self.get_exclude_patterns()
        
        for pattern in exclude_patterns:
            if fnmatch.fnmatch(file_path, pattern):
                return True
        
        return False
