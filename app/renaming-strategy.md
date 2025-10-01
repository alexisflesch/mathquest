# MathQuest Renaming Strategy

## 🎯 Overview

This document outlines a **smart, low-risk renaming strategy** for rebranding MathQuest to a new name. Instead of a full codebase rename (260+ references across 162 files), we focus only on **user-facing elements** while preserving all internal technical infrastructure.

## 🛡️ Philosophy: Keep Internal, Change External

**Keep Internal (Technical)**
- Database names, package names, environment variables
- Code comments and internal documentation
- Service names, file paths, build artifacts
- All backend infrastructure and configuration

**Change External (User-Facing)**
- UI text and branding users see
- Documentation and marketing materials
- Email sender names and public URLs
- App display names in interfaces

## 📊 Impact Comparison

| Approach | Files Changed | Risk Level | Time Estimate | Breaking Changes |
|----------|---------------|------------|---------------|------------------|
| **Full Rename** | 162 files | 🔴 High | 2-3 days | Many potential |
| **Smart Rename** | ~15-20 files | 🟢 Low | 4-6 hours | Minimal |

## ✅ What STAYS THE SAME

### Database & Infrastructure
- Database name: `mathquest` (in `DATABASE_URL`)
- Environment variables: `DB_NAME=mathquest`
- Package.json names: `"mathquest-doc"`, `"frontend"`, `"backend"`
- Internal service names and file paths

### Code & Comments
- All code comments referencing "MathQuest design system"
- Service descriptions and internal documentation
- Logger messages and debug output
- Build artifacts and generated code

### Backend Configuration
- Internal API endpoints and service names
- Environment variable names (only values change)
- Database connection strings (except display names)

## 🔄 What GETS CHANGED

### 1. Frontend UI Elements (~30 references)
**Files to update:**
- `app/frontend/src/components/` - Any component displaying app name
- `app/frontend/src/app/` - Page titles, headers, welcome messages
- `app/frontend/src/constants/` - Any user-facing constants

**Examples:**
```tsx
// BEFORE
<h1>MathQuest</h1>
<title>MathQuest - Quiz Platform</title>

// AFTER
<h1>MathMaster</h1>
<title>MathMaster - Quiz Platform</title>
```

### 2. Documentation (~40 references)
**Files to update:**
- `README.md` - Title, description, features
- `vuepress/docs/**/*.md` - All user-facing documentation
- Installation guides and user manuals

**Examples:**
```markdown
# BEFORE
# 🎓 MathQuest

**MathQuest** est une application de quiz...

# AFTER
# 🎓 MathMaster

**MathMaster** est une application de quiz...
```

### 3. Email & External Services (~5 references)
**Files to update:**
- `app/backend/example.env`
- `app/frontend/example.env`
- `scripts/example.env`

**Changes:**
```env
# BEFORE
BREVO_SENDER_NAME=MathQuest
APP_NAME=MathQuest

# AFTER
BREVO_SENDER_NAME=MathMaster
APP_NAME=MathMaster
```

### 4. Public URLs & Domains (~5 references)
**Files to update:**
- Environment files with public URLs
- Documentation with example URLs
- Any hardcoded public links

**Examples:**
```env
# BEFORE
NEXT_PUBLIC_BACKEND_BASE_URL=https://mathquest.alexisfles.ch

# AFTER
NEXT_PUBLIC_BACKEND_BASE_URL=https://mathmaster.alexisfles.ch
```

## 📋 Implementation Plan

### Phase 1: Preparation (30 min)
1. Choose new app name (e.g., "MathMaster", "QuizPro", etc.)
3. Document new name in this file

### Phase 2: Environment Variables (30 min)
1. Update `BREVO_SENDER_NAME` in backend env files
2. Update `APP_NAME` in backend env files
3. Update public URLs in frontend env files

### Phase 3: Frontend UI (1-2 hours)
1. Find all user-facing text displaying "MathQuest"
2. Update component titles, headers, welcome messages
3. Update page titles and meta descriptions
4. Test UI changes don't break functionality

### Phase 4: Documentation (1-2 hours)
1. Update README.md title and description
2. Update all vuepress documentation files
3. Update installation guides and examples
4. Update any hardcoded URLs in docs

### Phase 5: Testing & Validation (30 min)
1. Run full test suite: `npm run test:e2e`
2. Check email functionality with new sender name
3. Verify all public URLs work
4. Test user-facing UI elements

## 🧪 Testing Checklist

- [ ] All existing tests pass
- [ ] Email sending works with new sender name
- [ ] Public URLs redirect correctly
- [ ] UI displays new app name consistently
- [ ] No broken links in documentation
- [ ] Database connections still work
- [ ] All environment variables load correctly

## 🚨 Risk Mitigation

**Low Risk Approach:**
- No database schema changes
- No package.json name changes (avoids npm conflicts)
- No internal API endpoint changes
- Preserves all existing functionality
- Easy rollback if needed

**Backup Strategy:**
- Create feature branch for all changes
- Test thoroughly before merging
- Keep old domain active during transition
- Update DNS after full testing

## 📝 Current Status

**New App Name:** [TBD - Replace with chosen name]

**Completed:**
- [ ] Strategy documented
- [ ] Files identified
- [ ] Risk assessment done

**Next Steps:**
- [ ] Choose new app name
- [ ] Create implementation branch
- [ ] Begin Phase 1 changes

## 🔍 Discovery Notes

**Files with user-facing "MathQuest" references:**
- Frontend components (titles, headers)
- Documentation files (README, guides)
- Environment files (email, URLs)
- Public-facing configuration

**Files to IGNORE (internal only):**
- Code comments and JSDoc
- Package.json names and descriptions
- Database names and connection strings
- Internal service documentation
- Build artifacts and generated files

---

*This strategy minimizes risk while achieving complete user-facing rebranding. Update this document as implementation progresses.*