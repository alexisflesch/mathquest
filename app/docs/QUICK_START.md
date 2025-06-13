# ⚡ Quick Start Guide

Get MathQuest running in 5 minutes! This guide gets you from zero to a working development environment.

## 🚀 Prerequisites

- **Node.js** 18+ with npm
- **PostgreSQL** 12+ running locally
- **Git** for version control

## 📥 Installation

### 1. Clone and Setup
```bash
git clone <repository-url>
cd mathquest/app
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL (if not running)
sudo service postgresql start

# Create database
createdb mathquest_dev
```

### 3. Environment Configuration
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend environment  
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your settings
```

### 4. Database Migration
```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
cd ..
```

## 🏃 Start Development

### Option A: Full Stack (Recommended)
```bash
npm run dev
```
This starts both frontend (port 3000) and backend (port 5000).

### Option B: Individual Services
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:frontend
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs (if available)

## ✅ Verify Installation

### 1. Basic Health Check
```bash
# Check backend
curl http://localhost:5000/health

# Check frontend (visit in browser)
# Should see MathQuest landing page
```

### 2. Run Tests
```bash
# Quick test suite
npm run test:quick

# Full test suite (optional)
npm run test
```

## 🔧 Common Issues

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Reset database if needed
cd backend
npx prisma migrate reset
```

### Port Conflicts
If ports 3000 or 5000 are in use:
```bash
# Frontend: Edit frontend/.env
NEXT_PUBLIC_PORT=3001

# Backend: Edit backend/.env  
PORT=5001
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
```

## 📚 Next Steps

Once running, explore:

1. **[Developer Onboarding](guides/developer-onboarding.md)** - Complete setup and workflow guide
2. **[Architecture Overview](architecture/overview.md)** - Understand the system design
3. **[Frontend Guide](frontend/)** - React components and state management
4. **[Backend Guide](backend/)** - API services and database design
5. **[Testing Strategy](testing/)** - How to write and run tests

## 🆘 Need Help?

- **Documentation**: [docs/README.md](README.md) - Complete documentation hub
- **Troubleshooting**: [docs/troubleshooting/](troubleshooting/) - Common issues and solutions
- **Architecture**: [docs/architecture/](architecture/) - System design and patterns

## 🎯 Development Workflow

```bash
# Daily development cycle
npm run dev              # Start development servers
npm run type-check       # Verify TypeScript
npm run lint            # Check code quality
npm run test            # Run test suite
git add . && git commit # Commit changes
```

Ready to build awesome math quizzes! 🚀📚
