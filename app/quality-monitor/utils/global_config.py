#!/usr/bin/env python3
"""
Global Configuration Loader for MathQuest Quality Monitor
Provides centralized access to configuration settings across all analysis scripts.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional


class GlobalConfig:
    """Singleton class for loading and accessing global configuration."""
    
    _instance = None
    _config = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GlobalConfig, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance
    
    def _load_config(self):
        """Load global configuration from config file."""
        try:
            # Find config file relative to this file's location
            config_file = Path(__file__).parent.parent / "config" / "global.json"
            
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                print(f"✅ Loaded global config from {config_file}")
            else:
                print(f"⚠️  Global config not found at {config_file}, using defaults")
                self._config = self._get_default_config()
        except Exception as e:
            print(f"❌ Failed to load global config: {e}")
            self._config = self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration if config file is not available."""
        return {
            "project_config": {
                "name": "MathQuest",
                "version": "1.0.0",
                "root_directory": "/home/aflesch/mathquest/app"
            },
            "server_config": {
                "frontend": {
                    "url": "http://localhost:3008",
                    "port": 3008,
                    "protocol": "http"
                },
                "backend": {
                    "url": "http://localhost:3007",
                    "port": 3007,
                    "protocol": "http"
                },
                "api_base": {
                    "url": "http://localhost:3007/api",
                    "prefix": "/api"
                }
            },
            "analysis_config": {
                "timeouts": {
                    "script_execution": 300,
                    "network_request": 30000,
                    "navigation_analysis": 60000
                },
                "paths": {
                    "frontend_src": "frontend/src",
                    "backend_src": "backend/src",
                    "shared_src": "shared",
                    "test_directories": ["tests", "__tests__", "*.test.*", "*.spec.*"]
                },
                "file_extensions": {
                    "typescript": [".ts", ".tsx"],
                    "javascript": [".js", ".jsx"],
                    "config": [".json", ".yaml", ".yml", ".toml"],
                    "ignore": [".d.ts", ".min.js", ".bundle.js"]
                }
            }
        }
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value using dot notation.
        
        Args:
            key_path: Dot-separated path to config value (e.g., 'server_config.frontend.port')
            default: Default value if key is not found
        
        Returns:
            Configuration value or default
        """
        try:
            keys = key_path.split('.')
            value = self._config
            
            for key in keys:
                if isinstance(value, dict) and key in value:
                    value = value[key]
                else:
                    return default
            
            return value
        except Exception:
            return default
    
    def get_server_config(self, server_type: str = 'frontend') -> Dict[str, Any]:
        """Get server configuration for specified type."""
        return self.get(f'server_config.{server_type}', {})
    
    def get_analysis_config(self) -> Dict[str, Any]:
        """Get analysis configuration."""
        return self.get('analysis_config', {})
    
    def get_project_root(self) -> str:
        """Get project root directory."""
        return self.get('project_config.root_directory', '/home/aflesch/mathquest/app')
    
    def get_timeout(self, timeout_type: str = 'script_execution') -> int:
        """Get timeout value for specified type."""
        return self.get(f'analysis_config.timeouts.{timeout_type}', 300)
    
    def get_file_extensions(self, ext_type: str = 'typescript') -> list:
        """Get file extensions for specified type."""
        return self.get(f'analysis_config.file_extensions.{ext_type}', [])
    
    def should_skip_file(self, file_path: str) -> bool:
        """Check if file should be skipped during analysis."""
        skip_patterns = [
            *self.get_file_extensions('ignore'),
            *self.get('analysis_config.paths.test_directories', [])
        ]
        
        file_path_lower = file_path.lower()
        return any(
            pattern.replace('*', '') in file_path_lower 
            for pattern in skip_patterns
        )


# Global instance for easy import
config = GlobalConfig()


def get_config() -> GlobalConfig:
    """Get global configuration instance."""
    return config


if __name__ == '__main__':
    # Test the configuration
    cfg = get_config()
    print("🧪 Testing Global Configuration:")
    print(f"Frontend URL: {cfg.get('server_config.frontend.url')}")
    print(f"Backend URL: {cfg.get('server_config.backend.url')}")
    print(f"Project Root: {cfg.get_project_root()}")
    print(f"TypeScript Extensions: {cfg.get_file_extensions('typescript')}")
    print(f"Script Timeout: {cfg.get_timeout('script_execution')}s")
