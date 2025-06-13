# 🏗️ System Architecture Overview

MathQuest is a modern, full-stack TypeScript application designed for real-time multiplayer math quizzes and educational tournaments.

## 🎯 Architecture Goals

- **Real-time Collaboration** - Multiple users in live quiz sessions
- **Scalable Design** - Support for classroom to school-wide usage
- **Type Safety** - End-to-end TypeScript with shared type definitions
- **Developer Experience** - Modern tooling with hot reloading and debugging
- **Maintainability** - Clean separation of concerns and comprehensive documentation

## 🏛️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MathQuest System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  Frontend   │◄──►│   Backend   │◄──►│  Database   │        │
│  │ (Next.js)   │    │ (Node.js)   │    │(PostgreSQL) │        │
│  │             │    │             │    │             │        │
│  │ ┌─────────┐ │    │ ┌─────────┐ │    │ ┌─────────┐ │        │
│  │ │ React   │ │    │ │Express  │ │    │ │ Prisma  │ │        │
│  │ │Components│ │    │ │+ Socket │ │    │ │ Schema  │ │        │
│  │ └─────────┘ │    │ └─────────┘ │    │ └─────────┘ │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Shared Types                          │   │
│  │            (TypeScript + Zod Validation)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Technology Stack
- **Next.js 14** - React framework with App Router
- **React 18** - Component-based UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication

### Component Structure
```
frontend/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Teacher dashboard
│   ├── quiz/              # Quiz gameplay
│   └── tournament/        # Tournament management
│
├── components/            # Reusable UI Components
│   ├── ui/               # Basic UI elements (buttons, inputs)
│   ├── auth/             # Authentication components
│   ├── quiz/             # Quiz-specific components
│   └── tournament/       # Tournament components
│
├── contexts/             # React Context Providers
│   ├── AuthContext.tsx  # User authentication state
│   ├── GameContext.tsx  # Quiz game state
│   └── SocketContext.tsx # Socket.IO connection
│
├── hooks/                # Custom React Hooks
│   ├── useAuth.ts       # Authentication logic
│   ├── useSocket.ts     # Socket.IO integration
│   └── useGameTimer.ts  # Quiz timer management
│
└── lib/                  # Utility Functions
    ├── api.ts           # API client functions
    ├── socket.ts        # Socket.IO client setup
    └── utils.ts         # General utilities
```

### State Management
- **React Context** - Global state (auth, socket connection)
- **useState/useReducer** - Local component state
- **Custom Hooks** - Reusable stateful logic
- **Socket.IO** - Real-time state synchronization

### Routing & Navigation
- **Next.js App Router** - File-based routing system
- **Dynamic Routes** - `/quiz/[quizId]`, `/tournament/[tournamentId]`
- **Route Protection** - Authentication middleware
- **SEO Optimization** - Server-side rendering and metadata

## ⚙️ Backend Architecture

### Technology Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server-side code
- **Socket.IO** - Real-time bidirectional communication
- **Prisma ORM** - Database access and migrations
- **JWT** - Authentication tokens

### Service Architecture
```
backend/src/
├── controllers/          # Request/Response Handlers
│   ├── authController.ts    # Authentication endpoints
│   ├── quizController.ts    # Quiz CRUD operations
│   └── userController.ts    # User management
│
├── services/             # Business Logic Layer
│   ├── authService.ts       # Authentication logic
│   ├── quizService.ts       # Quiz management
│   ├── gameService.ts       # Quiz gameplay logic
│   └── tournamentService.ts # Tournament management
│
├── middleware/           # Express Middleware
│   ├── auth.ts             # JWT authentication
│   ├── validation.ts       # Request validation
│   └── errorHandler.ts     # Error handling
│
├── routes/               # API Route Definitions
│   ├── auth.ts             # /api/auth/*
│   ├── quiz.ts             # /api/quiz/*
│   └── user.ts             # /api/user/*
│
├── sockets/              # Real-time Event Handlers
│   ├── gameHandlers.ts     # Quiz gameplay events
│   ├── lobbyHandlers.ts    # Quiz lobby events
│   └── tournamentHandlers.ts # Tournament events
│
└── types/                # Backend-specific Types
    ├── express.d.ts        # Express type extensions
    └── socket.d.ts         # Socket.IO type definitions
```

### API Design Principles
- **RESTful Endpoints** - Standard HTTP methods and status codes
- **Consistent Response Format** - Uniform API responses
- **Input Validation** - Zod schemas for all requests
- **Error Handling** - Structured error responses
- **Authentication** - JWT-based with refresh tokens

### Real-time Features
- **Quiz Gameplay** - Live question synchronization and answers
- **Lobby Management** - Players joining/leaving quiz sessions
- **Tournament Updates** - Live bracket updates and scores
- **Chat System** - Real-time messaging during quizzes

## 🗄️ Database Architecture

### Technology Stack
- **PostgreSQL** - Primary relational database
- **Prisma ORM** - Type-safe database access
- **Prisma Migrate** - Database schema management
- **Connection Pooling** - Efficient database connections

### Schema Design
```sql
-- Core Entities
Users (id, name, email, role, created_at)
Quizzes (id, title, questions, settings, created_by)
Questions (id, quiz_id, question_text, options, correct_answer)
QuizSessions (id, quiz_id, host_id, status, participants)
Tournaments (id, name, quizzes, participants, bracket)

-- Relationships
UserQuizSession (user_id, session_id, score, answers)
TournamentRounds (tournament_id, round_number, matches)
QuizAttempts (user_id, quiz_id, score, completed_at)
```

### Key Design Decisions
- **UUID Primary Keys** - Globally unique identifiers
- **Soft Deletes** - Preserve historical data
- **Audit Trails** - Track creation and modification timestamps
- **Normalized Schema** - Reduce data redundancy
- **Indexed Queries** - Optimize frequently accessed data

## 🔗 Shared Types & Validation

### Architecture Benefits
- **Single Source of Truth** - Types defined once, used everywhere
- **Runtime Validation** - Zod schemas ensure data integrity
- **Development Experience** - IntelliSense and type checking
- **API Contracts** - Guaranteed type safety across boundaries

### Type Organization
```
shared/
├── types/                # TypeScript Interfaces
│   ├── auth.ts              # Authentication types
│   ├── quiz.ts              # Quiz and question types
│   ├── user.ts              # User and profile types
│   └── socket.ts            # Socket.IO event types
│
├── validation/           # Zod Validation Schemas
│   ├── authSchemas.ts       # Authentication validation
│   ├── quizSchemas.ts       # Quiz validation
│   └── userSchemas.ts       # User validation
│
├── constants/            # Shared Constants
│   ├── questionTypes.ts     # Quiz question type definitions
│   ├── gameStates.ts        # Game state enumerations
│   └── socketEvents.ts      # Socket.IO event names
│
└── utils/                # Shared Utility Functions
    ├── validation.ts        # Common validation helpers
    └── formatters.ts        # Data formatting utilities
```

## 🔄 Data Flow Architecture

### Request/Response Flow
```
1. User Interaction (Frontend)
   ↓
2. React Component State Update
   ↓
3. API Call via HTTP Client
   ↓
4. Express Route Handler (Backend)
   ↓
5. Request Validation (Zod Schema)
   ↓
6. Service Layer Business Logic
   ↓
7. Database Query (Prisma ORM)
   ↓
8. Response Validation & Formatting
   ↓
9. HTTP Response to Frontend
   ↓
10. React State Update & UI Re-render
```

### Real-time Event Flow
```
1. User Action (Frontend)
   ↓
2. Socket.IO Event Emission
   ↓
3. Backend Socket Handler
   ↓
4. Business Logic Processing
   ↓
5. Database Update (if needed)
   ↓
6. Broadcast to Connected Clients
   ↓
7. Frontend Socket Event Listener
   ↓
8. React State Update & UI Refresh
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Tokens** - Stateless authentication
- **Refresh Tokens** - Secure token renewal
- **Role-based Access** - Teacher vs Student permissions
- **Session Management** - Secure logout and token invalidation

### Data Protection
- **Input Validation** - Prevent injection attacks
- **CORS Configuration** - Control cross-origin requests
- **HTTPS Enforcement** - Encrypted communication
- **Environment Variables** - Secure configuration management

### Real-time Security
- **Socket Authentication** - JWT verification for Socket.IO
- **Room Authorization** - Verify user access to quiz sessions
- **Rate Limiting** - Prevent abuse of real-time features

## 📈 Performance Considerations

### Frontend Optimization
- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Next.js automatic image optimization
- **Caching Strategy** - Browser and CDN caching
- **Bundle Analysis** - Monitor and optimize bundle size

### Backend Optimization
- **Database Indexing** - Optimize query performance
- **Connection Pooling** - Efficient database connections
- **Response Compression** - Reduce payload size
- **Memory Management** - Proper garbage collection

### Real-time Performance
- **Event Debouncing** - Reduce unnecessary Socket.IO events
- **Room Management** - Efficient user grouping
- **Connection Scaling** - Handle concurrent users
- **Message Queuing** - Reliable event delivery

## 🚀 Deployment Architecture

### Development Environment
- **Hot Reloading** - Instant development feedback
- **Local Database** - PostgreSQL development instance
- **Environment Isolation** - Separate dev/staging/production configs

### Production Considerations
- **Container Deployment** - Docker for consistent environments
- **Load Balancing** - Handle multiple server instances
- **Database Scaling** - Read replicas and connection pooling
- **Monitoring & Logging** - Application performance monitoring

## 🔍 Monitoring & Observability

### Logging Strategy
- **Structured Logging** - JSON formatted logs
- **Log Levels** - Appropriate logging verbosity
- **Error Tracking** - Capture and monitor errors
- **Performance Metrics** - Response times and throughput

### Health Monitoring
- **Health Check Endpoints** - Service availability
- **Database Monitoring** - Connection and query performance
- **Real-time Metrics** - Socket.IO connection statistics

## 📚 Architecture Documentation

### Key Principles
- **Separation of Concerns** - Clear module boundaries
- **Single Responsibility** - Each component has one purpose
- **Dependency Injection** - Loose coupling between modules
- **Error Handling** - Graceful degradation and recovery

### Future Considerations
- **Microservices** - Potential service decomposition
- **Caching Layer** - Redis for session and data caching
- **Message Queue** - Asynchronous processing
- **API Gateway** - Centralized request handling

This architecture provides a solid foundation for a scalable, maintainable educational quiz platform while ensuring excellent developer experience and type safety throughout the stack.
