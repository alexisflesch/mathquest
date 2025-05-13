# Setup Documentation

This directory contains documentation for setting up the MathQuest development environment.

## Prerequisites

- **Node.js** - Version 18 or higher
- **npm** - Version 8 or higher
- **Git** - For version control
- **PostgreSQL** - For local database (optional, can use SQLite for development)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/mathquest.git
   cd mathquest
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ../shared && npm install
   ```

3. Set up environment variables:
   ```bash
   cp example.env .env
   # Edit .env with your local configuration
   ```

4. Initialize the database:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

## Running the Development Environment

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend server (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Testing

- **Unit Tests**: `npm run test`
- **Integration Tests**: `npm run test:integration`
- **Socket Tests**: `npm run test:socket`

## Build for Production

```bash
npm run build
```

## Related Documentation

- [Deployment Guide](deployment.md)
- [Database Setup](database-setup.md)
- [Environment Variables](environment-variables.md)
