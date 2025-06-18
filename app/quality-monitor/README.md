# MathQuest Code Quality Monitoring TODO

> **🚨 This file should NEVER be edited unless modifications are made to the scripts in this directory. Run systematically every 2 weeks to catch code quality issues.**

---

## 📋 **SYSTEMATIC CHECKS** (Run every 2 weeks)

### **1. Hardcoded Strings Detection**
- [ ] **Socket Events**: Find any `socket.emit()` or `socket.on()` calls with hardcoded strings instead of `SOCKET_EVENTS.*` constants
- [ ] **API Endpoints**: Find hardcoded `/api/` paths instead of using API constants
- [ ] **Error Messages**: Find duplicate error message strings that should be centralized
- [ ] **Room Names**: Find hardcoded room patterns like `"game_" + id` instead of using helper functions

### **2. Code Duplication Detection**
- [ ] **Similar Files**: Find files with similar names (e.g., `handler.ts` vs `handlerNew.ts`, `projector.ts` vs `projection.ts`)
- [ ] **Duplicate Functions**: Find functions with identical or nearly identical logic across different files
- [ ] **Duplicate Type Definitions**: Find interfaces/types defined in multiple places with same properties
- [ ] **Copy-Paste Code Blocks**: Find repeated code blocks (>5 lines) that should be extracted to shared functions

### **3. Import/Dependency Analysis**
- [ ] **Mixed Import Paths**: Find files importing from both `@shared/types` and `@/types` for same entities
- [ ] **Circular Dependencies**: Detect import cycles between modules
- [ ] **Unused Imports**: Find imported items that are never used
- [ ] **Missing Shared Types**: Find local type definitions that should use existing shared types
- [ ] **Relative paths vs Aliased Imports**: Find inconsistent import paths (e.g., `import { X } from '../../shared/types'` vs `import { X } from '@/shared/types'`). Don't use aliasing for test files.

### **4. Type Safety Violations**
- [ ] **Any Types**: Find all `any` type usages that should be properly typed
- [ ] **Type Casting**: Find `as any` or `as unknown` casts that indicate patching over proper fixes
- [ ] **Implicit Any**: Find parameters or variables without explicit types
- [ ] **Missing Validation**: Find API endpoints without Zod schema validation

### **5. Architecture Violations**
- [ ] **Business Logic in Components**: Find React components with database queries or complex business logic
- [ ] **Direct DB Access in Frontend**: Find frontend code importing backend database types
- [ ] **Missing Error Handling**: Find API calls or socket events without proper error handling
- [ ] **Inconsistent Patterns**: Find similar features implemented with different patterns

### **6. Legacy Code Detection**
- [ ] **TODO/FIXME Comments**: Find unresolved technical debt markers
- [ ] **Commented Code**: Find large blocks of commented-out code
- [ ] **Backup Files**: Find `.backup`, `.old`, `_temp` files indicating incomplete refactoring
- [ ] **Version Inconsistencies**: Find features using old patterns while new patterns exist

### **7. Documentation Drift**
- [ ] **Plan vs Reality**: Check if `plan.md` checkboxes match actual code implementation
- [ ] **Missing Log Entries**: Find significant code changes not documented in `log.md`
- [ ] **Outdated Comments**: Find code comments that no longer match the implementation
- [ ] **Missing Type Docs**: Find complex types without JSDoc documentation

### **8. Performance Red Flags**
- [ ] **Large Bundle Analysis**: Find unexpectedly large JavaScript bundles
- [ ] **Memory Leaks**: Find components/hooks not cleaning up properly
- [ ] **Unnecessary Re-renders**: Find React components with missing optimization
- [ ] **Inefficient Queries**: Find database queries that could be optimized

---

## 🎯 **QUALITY METRICS TO TRACK**

### **Violation Counts** (should trend toward zero):
- Hardcoded strings: `___`
- Duplicate code blocks: `___`
- Type safety violations: `___`
- Architecture violations: `___`
- Legacy patterns: `___`

### **Health Indicators** (should trend upward):
- Shared type usage percentage: `___%`
- Code coverage: `___%`
- TypeScript strict compliance: `___%`
- Documentation sync score: `___%`

---

## 🚨 **ESCALATION TRIGGERS**

### **Stop AI Work If:**
- [ ] Hardcoded strings increase instead of decrease
- [ ] New duplicate files appear
- [ ] TypeScript errors increase significantly
- [ ] Similar bugs appear in multiple places
- [ ] Documentation becomes severely out of sync

### **Review AI Behavior If:**
- [ ] Same types of violations repeat across sessions
- [ ] Code quality metrics plateau or decline
- [ ] Architecture patterns become inconsistent
- [ ] Build times increase significantly

---

## 📊 **SESSION TEMPLATE**

```
## Quality Check: [DATE]

**Violation Summary:**
- Hardcoded strings: ___
- Duplicate code: ___
- Type violations: ___
- Architecture issues: ___
- Legacy patterns: ___

**Total Quality Score: ___/100**

**Critical Issues Found:**
- [ ] [List major problems]

**Next Check Due: [DATE + 2 weeks]**
```

---

# 🛠️ **IMPLEMENTATION PLAN**

## 📁 **Directory Structure**
```
quality-monitor/           # Main directory name
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies  
├── config/
│   ├── eslint-rules.js    # Custom ESLint rules
│   ├── patterns.json      # Pattern definitions for detection
│   └── thresholds.json    # Quality thresholds and scoring
├── scripts/
│   ├── javascript/        # Node.js analysis scripts
│   │   ├── bundle-analyzer.js
│   │   ├── dependency-graph.js
│   │   └── typescript-analyzer.js
│   └── python/           # Python analysis scripts
│       ├── hardcoded_strings.py
│       ├── code_duplicator.py
│       ├── architecture_checker.py
│       └── documentation_sync.py
├── main.py               # Master orchestrator script
├── utils/
│   ├── file_scanner.py   # File system utilities
│   ├── ast_parser.py     # Code parsing utilities
│   └── report_generator.py # HTML/JSON report generation
└── reports/              # Generated reports directory
    ├── latest.json
    ├── history/
    └── dashboard.html
```

---

## 📦 **Dependencies to Install**

### **Node.js Dependencies** (`quality-monitor/package.json`):
```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint-plugin-sonarjs": "^0.21.0",
    "eslint-plugin-import": "^2.28.0",
    "eslint-plugin-unused-imports": "^3.0.0",
    "jscpd": "^3.5.0",
    "madge": "^6.1.0",
    "depcheck": "^1.4.0",
    "dependency-cruiser": "^13.0.0",
    "webpack-bundle-analyzer": "^4.9.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "documentation": "^14.0.0"
  }
}
```

### **Python Dependencies** (`quality-monitor/requirements.txt`):
```
ast-tools==0.2.0
gitpython==3.1.32
pygments==2.15.1
jinja2==3.1.2
click==8.1.6
colorama==0.4.6
tabulate==0.9.0
matplotlib==3.7.2
plotly==5.15.0
```

---

## 🐍 **Python Scripts**

### **1. `scripts/python/hardcoded_strings.py`**
**Purpose**: Detect hardcoded strings that should use constants
**Features**:
- Scan for `socket.emit("hardcoded")` vs `socket.emit(SOCKET_EVENTS.X)`
- Find hardcoded API paths `/api/games` vs `API_ENDPOINTS.GAMES`
- Detect duplicate error messages across files
- Pattern matching for room naming conventions

### **2. `scripts/python/code_duplicator.py`**
**Purpose**: Find duplicate code blocks and similar files
**Features**:
- AST-based function similarity comparison
- File name similarity detection (Levenshtein distance)
- Duplicate interface/type detection across modules
- Configurable similarity thresholds

### **3. `scripts/python/architecture_checker.py`**
**Purpose**: Enforce architectural boundaries and patterns
**Features**:
- Detect frontend importing backend types
- Find React components with business logic
- Check for missing error handling patterns
- Validate import path consistency (`@shared/` vs `@/`)

### **4. `scripts/python/documentation_sync.py`**
**Purpose**: Check documentation accuracy vs code reality
**Features**:
- Parse `plan.md` checkboxes vs actual implementation
- Git log analysis for undocumented changes
- JSDoc coverage analysis
- Comment staleness detection

### **5. `scripts/python/legacy_detector.py`**
**Purpose**: Find legacy patterns and technical debt
**Features**:
- TODO/FIXME comment aggregation
- Backup file detection (`.old`, `.backup`, `_temp`)
- Commented code block identification
- Pattern version consistency checking

---

## 🟨 **JavaScript/Node.js Scripts**

### **1. `scripts/javascript/typescript-analyzer.js`**
**Purpose**: TypeScript-specific analysis using TS compiler API
**Features**:
- `any` type usage detection
- Type casting analysis (`as any`, `as unknown`)
- Implicit any detection
- Type definition duplication

### **2. `scripts/javascript/dependency-graph.js`**
**Purpose**: Advanced dependency analysis
**Features**:
- Circular dependency detection using Madge
- Unused export detection
- Import path validation
- Bundle size analysis integration

### **3. `scripts/javascript/bundle-analyzer.js`**
**Purpose**: Performance and bundle analysis
**Features**:
- Webpack stats parsing
- Large bundle identification
- Duplicate package detection
- Tree-shaking effectiveness analysis

### **4. `scripts/javascript/eslint-runner.js`**
**Purpose**: Custom ESLint rule execution
**Features**:
- Run custom rules for project-specific patterns
- Aggregate ESLint results across modules
- Performance rule checking
- React-specific pattern validation

### **5. `scripts/javascript/interface-similarity-checker.js`**
**Purpose**: TypeScript interface analysis using ts-morph
**Features**:
- Detect locally defined interfaces that duplicate shared types
- Identify interfaces that could be unified or generalized
- Flag type definitions that should use canonical shared types
- AST-based semantic similarity analysis

### **6. `scripts/javascript/navigation-graph-analyzer.js`**
**Purpose**: Dynamic navigation analysis using Puppeteer
**Features**:
- Map actual navigation flows vs defined routes
- Detect orphaned pages unreachable through normal user flows
- Validate that all defined routes are accessible
- Build comprehensive navigation graph with connectivity analysis

---

## 🎯 **Main Orchestrator Script**

### **`main.py` - Master Quality Monitor**
**Purpose**: Orchestrate all quality checks and generate unified report
**Features**:

#### **Phase 1: Environment Setup**
- Validate all dependencies are installed
- Check that codebase paths exist
- Load configuration from `config/` files

#### **Phase 2: Static Analysis Execution**
```python
def run_quality_checks():
    results = {}
    
    # Python-based checks
    results['hardcoded_strings'] = run_hardcoded_strings_check()
    results['code_duplication'] = run_code_duplication_check()
    results['architecture'] = run_architecture_check()
    results['documentation'] = run_documentation_sync_check()
    results['legacy_patterns'] = run_legacy_detection_check()
    
    # Node.js-based checks
    results['typescript_analysis'] = run_typescript_analysis()
    results['dependency_graph'] = run_dependency_analysis()
    results['bundle_analysis'] = run_bundle_analysis()
    results['eslint_results'] = run_eslint_analysis()
    
    return results
```

#### **Phase 3: Scoring & Report Generation**
- Calculate quality score based on violation counts
- Generate trend analysis vs previous runs
- Create HTML dashboard with charts
- Export JSON for CI/CD integration
- Flag critical issues for immediate attention

#### **Phase 4: Recommendations**
- Suggest specific fixes for found violations
- Prioritize issues by severity and impact
- Generate action items for next sprint
- Create ESLint rule recommendations

---

## 🔧 **Configuration Files**

### **`config/patterns.json`**
```json
{
  "hardcoded_patterns": {
    "socket_events": ["socket\\.emit\\(['\"](?!SOCKET_EVENTS)", "socket\\.on\\(['\"](?!SOCKET_EVENTS)"],
    "api_paths": ["\\/api\\/[^'\"]*['\"]", "fetch\\(['\"]\\/(api|backend)"],
    "room_names": ["['\"]game_\\s*\\+", "['\"]dashboard_\\s*\\+"]
  },
  "architecture_violations": {
    "frontend_backend_imports": ["from ['\"].*backend.*['\"]", "import.*from ['\"].*\\/backend"],
    "business_logic_in_components": ["useEffect.*\\bfetch\\b", "useEffect.*\\baxios\\b"]
  }
}
```

### **`config/thresholds.json`**
```json
{
  "quality_scoring": {
    "hardcoded_strings": { "weight": 20, "max_violations": 0 },
    "code_duplication": { "weight": 25, "max_violations": 5 },
    "type_safety": { "weight": 30, "max_violations": 0 },
    "architecture": { "weight": 15, "max_violations": 2 },
    "legacy_patterns": { "weight": 10, "max_violations": 10 }
  },
  "escalation_triggers": {
    "stop_ai_work": 70,
    "review_required": 80,
    "warning_level": 90
  }
}
```

---

## 🚀 **Execution Commands**

### **Setup** (run once):
```bash
cd quality-monitor
npm install
pip install -r requirements.txt
```

### **Full Quality Check** (run every 2 weeks):
```bash
python main.py --full-report --save-history
```

### **Quick Check** (run daily/per commit):
```bash
python main.py --quick --critical-only
```

### **Semantic Analysis** (interface & navigation checks):
```bash
npm run semantic-check
# or individually:
npm run interface-check
npm run nav-analyze
```

### **Specific Module Check**:
```bash
python main.py --module frontend --checks hardcoded_strings,type_safety
```

---

## 🔍 **ADVANCED STATIC ANALYSIS TOOLS**

### **Core Detection Tools**
Beyond standard linters, specialized tools prevent technical debt accumulation:

- **`jscpd`**: Detects duplicate or near-duplicate code blocks across the codebase
- **`eslint-plugin-sonarjs`**: Flags suspicious patterns and unnecessary complexity  
- **`depcheck`**: Identifies unused dependencies that bloat bundles
- **`madge`**: Detects circular imports that create maintenance issues
- **`ts-morph`**: TypeScript AST analysis for advanced semantic checking

### **Custom Semantic Analysis**
Additional scripts catch AI-resistant quality issues:

#### **TypeScript Interface Similarity Checker**
- Uses `ts-morph` to parse TypeScript AST
- Detects locally defined interfaces that duplicate shared types
- Identifies interfaces that could be unified or generalized
- Flags type definitions that should use canonical shared types

#### **Navigation Graph Analyzer** 
- Uses `Puppeteer` for dynamic app exploration
- Maps actual navigation flows vs defined routes
- Detects orphaned pages unreachable through normal user flows
- Validates that all defined routes are accessible

These tools enforce standards that automated PRs and AI agents often overlook, ensuring semantic consistency beyond syntactic correctness.

---

**🔒 DO NOT EDIT THIS FILE - It's your permanent quality monitoring checklist**

