# MathQuest - Comprehensive Application Overview

## 🎯 What is MathQuest?

MathQuest is a **free, open-source, real-time educational quiz platform** designed specifically for mathematics education. It serves as a modern alternative to Kahoot, built with a focus on:

- **Educational Excellence**: Comprehensive LaTeX support for mathematical expressions
- **Real-time Interactivity**: Live quizzes, tournaments, and collaborative learning
- **Open Source Freedom**: No data collection, self-hosted, customizable
- **Multi-level Support**: From elementary school (CP) to university level (L3/M2)
- **Three Game Modes**: Quiz, Tournament, and Training modes

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Custom CSS with Tailwind CSS
- **Real-time**: Socket.IO client for live interactions
- **Math Rendering**: MathJax for LaTeX support

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Real-time**: Redis for session management and live updates
- **Authentication**: JWT tokens with HTTP-only cookies
- **Real-time**: Socket.IO server with Redis adapter

### Shared
- **Type Safety**: Shared TypeScript types and Zod schemas
- **Constants**: Centralized configuration and game timings
- **Validation**: Runtime validation for all API and socket events

## 👥 User Roles and Workflows

### 1. Guest Users
- **Access**: No registration required
- **Capabilities**:
  - Join public quizzes and tournaments
  - Participate in training mode
  - View results and leaderboards
- **Limitations**:
  - No persistent data
  - Cannot create content
  - Cannot access teacher features

### 2. Students
- **Registration**: Email + password required
- **Capabilities**:
  - All guest features
  - Persistent progress tracking
  - Personal statistics
  - Create and join private sessions
- **Features**:
  - Profile management
  - Game history
  - Achievement tracking

### 3. Teachers
- **Registration**: Requires admin password
- **Capabilities**:
  - All student features
  - Create and manage quizzes
  - Access teacher dashboard
  - Manage student progress
  - Generate reports
- **Admin Features**:
  - Question bank management
  - Tournament organization
  - Class management

## 🎮 Three Core Game Modes

### 1. Quiz Mode (Teacher-Led)
**Purpose**: Traditional classroom quiz with teacher control

**Workflow**:
1. Teacher creates/selects quiz from question templates
2. Generates access code and QR code
3. Students join via mobile/desktop
4. Teacher controls question flow and timing
5. Real-time statistics and responses
6. Immediate feedback (optional)
7. Final leaderboard and results

**Key Features**:
- **Live Projection**: Dedicated teacher view for projection
- **Real-time Stats**: Response distribution charts
- **Timer Control**: Teacher can pause/resume/modify timers
- **Flexible Feedback**: Teacher chooses when to reveal answers
- **Mobile Responsive**: Works on all devices

### 2. Tournament Mode (Competitive)
**Purpose**: Competitive mathematics challenges

**Types**:
- **Synchronous**: All players answer simultaneously
- **Deferred**: Players can join and answer at their own pace

**Workflow**:
1. Create tournament with question set
2. Set time limits and rules
3. Share access code
4. Players join and compete
5. Real-time leaderboard updates
6. Final rankings and statistics

**Key Features**:
- **Live Leaderboard**: Real-time ranking updates
- **Deferred Replay**: Review past tournaments
- **Scoring System**: Points based on speed and accuracy
- **Historical Data**: Tournament archives

### 3. Training Mode (Self-Paced)
**Purpose**: Individual practice and skill development

**Workflow**:
1. Select subject areas and difficulty
2. Choose number of questions
3. Answer at own pace (no timer pressure)
4. Immediate feedback on each answer
5. Progress tracking and statistics
6. Review incorrect answers

**Key Features**:
- **No Time Pressure**: Learn at your own speed
- **Detailed Explanations**: Rich feedback for each question
- **Progress Tracking**: Personal improvement metrics
- **Flexible Topics**: Mix and match subjects

## 📚 Question Management System

### Question Structure
Each question contains:
- **Unique ID**: Auto-generated or custom
- **Question Text**: Supports LaTeX math expressions
- **Question Type**: Single choice, multiple choice, or numeric
- **Answer Options**: For choice-based questions
- **Correct Answers**: Single or multiple correct options
- **Metadata**: Difficulty, grade level, subject, themes
- **Feedback**: Optional explanations and hints
- **Timing**: Default time limits
- **Compatibility**: Which modes can use the question

### Question Types
1. **Single Choice**: One correct answer from options
2. **Multiple Choice**: Multiple correct answers possible
3. **Numeric**: Exact number or range answer

### Question Bank
- **Shared Repository**: Community-contributed questions
- **GitHub Integration**: Version-controlled question database
- **Filtering System**: Search by grade, subject, difficulty
- **Import/Export**: YAML format for bulk operations

## 🔐 Authentication & Security

### Authentication Flow
1. **Login**: Email/password or guest access
2. **JWT Tokens**: HTTP-only cookies for session management
3. **Role-based Access**: Different permissions per user type
4. **Session Management**: Redis-backed session storage

### Security Features
- **Password Requirements**: Minimum 6 characters
- **Admin Password**: Required for teacher registration
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Protection against abuse
- **HTTPS**: Secure communication in production

### Data Protection
- **No External Tracking**: Self-hosted, no third-party analytics
- **Minimal Data Collection**: Only necessary educational data
- **GDPR Compliance**: User data control and deletion
- **Open Source**: Transparent data handling

## 🎯 Real-time Features

### Socket.IO Integration
- **Event-driven**: All real-time updates via WebSocket events
- **Redis Adapter**: Scalable across multiple server instances
- **Room-based**: Isolated communication per game session
- **Typed Events**: Strongly-typed socket messages

### Live Game Events
- **Question Broadcasting**: Real-time question distribution
- **Answer Submission**: Instant response collection
- **Timer Synchronization**: Coordinated countdowns
- **Leaderboard Updates**: Live ranking changes
- **Participant Management**: Join/leave notifications

### Teacher Dashboard
- **Live Monitoring**: Real-time class progress
- **Response Analytics**: Answer distribution charts
- **Timer Control**: Pause/resume/modify timing
- **Manual Control**: Skip questions, reveal answers
- **Projection View**: Dedicated display interface

## 📊 Data Models

### Core Entities

#### User
- **Fields**: id, email, username, avatar, role, createdAt
- **Roles**: GUEST, STUDENT, TEACHER
- **Authentication**: JWT tokens, password hashing

#### GameInstance
- **Fields**: id, name, status, playMode, accessCode, settings
- **Status**: waiting, active, completed, cancelled
- **Modes**: quiz, tournament, training

#### GameParticipant
- **Fields**: id, userId, gameInstanceId, liveScore, deferredScore
- **Status**: active, completed, disconnected
- **Tracking**: join time, attempts, bonus points

#### Question
- **Fields**: uid, text, type, answers, metadata, feedback
- **Relationships**: belongs to question sets, used in games
- **Validation**: Required fields, format checking

#### GameTemplate
- **Fields**: id, name, questions, settings, creator
- **Purpose**: Reusable quiz configurations
- **Sharing**: Public or private templates

### Database Relationships
- **User** → **GameParticipant** (1:many)
- **GameInstance** → **GameParticipant** (1:many)
- **GameTemplate** → **Question** (many:many)
- **GameInstance** → **GameTemplate** (many:1)

## 🚀 API Architecture

### REST Endpoints

#### Authentication (`/api/v1/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - Clear session
- `POST /reset-password` - Password reset flow
- `POST /verify-email` - Email verification

#### Games (`/api/v1/games`)
- `GET /` - List available games
- `POST /` - Create new game
- `GET /:id` - Get game details
- `PUT /:id` - Update game settings

#### Questions (`/api/v1/questions`)
- `GET /` - Search questions with filters
- `POST /` - Create new question (teacher only)
- `GET /filters` - Get available filter options
- `PUT /:id` - Update question

#### Users (`/api/v1/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `GET /stats` - Get user statistics

### Socket Events

#### Game Events
- `join-room` - Join game session
- `leave-room` - Leave game session
- `submit-answer` - Submit answer
- `question-start` - New question begins
- `question-end` - Question timer expires
- `game-end` - Game completion

#### Teacher Events
- `start-game` - Begin game session
- `next-question` - Advance to next question
- `reveal-answers` - Show correct answers
- `update-timer` - Modify question timer

#### System Events
- `participant-joined` - New player joins
- `participant-left` - Player disconnects
- `leaderboard-update` - Ranking changes

## 🎨 User Interface

### Responsive Design
- **Mobile-First**: Optimized for phones and tablets
- **Desktop Support**: Full-featured desktop interface
- **Touch-Friendly**: Large buttons and touch targets
- **Accessibility**: Screen reader support, keyboard navigation

### Key UI Components
- **Question Display**: LaTeX-rendered math questions
- **Answer Interface**: Multiple choice, text input, numeric input
- **Timer Display**: Countdown with visual indicators
- **Leaderboard**: Real-time ranking display
- **Teacher Dashboard**: Control panel with live stats
- **Projection View**: Clean display for classroom projection

### Theme System
- **Light/Dark Mode**: User preference with system detection
- **Custom Colors**: Educational color scheme
- **High Contrast**: Accessibility options
- **Print-Friendly**: Clean layouts for printing

## 📈 Analytics and Reporting

### Student Analytics
- **Performance Tracking**: Scores over time
- **Weakness Identification**: Topics needing improvement
- **Progress Visualization**: Charts and graphs
- **Comparative Analysis**: Class vs individual performance

### Teacher Analytics
- **Class Performance**: Overall class statistics
- **Question Analysis**: Which questions are challenging
- **Participation Rates**: Student engagement metrics
- **Time Analysis**: Average response times

### Game Analytics
- **Session Reports**: Detailed game summaries
- **Answer Patterns**: Common mistakes and misconceptions
- **Engagement Metrics**: Participation and completion rates

## 🚀 Deployment and Scaling

### Development Setup
- **Local Development**: npm scripts for dev servers
- **Hot Reload**: Automatic restart on file changes
- **Debugging**: Integrated debugging tools
- **Testing**: Jest test framework with coverage

### Production Deployment
- **Docker Support**: Containerized deployment
- **Process Management**: PM2 for production
- **Load Balancing**: Nginx reverse proxy
- **SSL/TLS**: HTTPS encryption
- **Database Migration**: Prisma migrations

### Scaling Considerations
- **Horizontal Scaling**: Multiple server instances
- **Redis Clustering**: Distributed cache
- **Database Optimization**: Query optimization and indexing
- **CDN**: Static asset delivery
- **Monitoring**: Performance monitoring and alerting

## 🔧 Configuration and Environment

### Environment Variables
- **Database**: PostgreSQL connection string
- **Redis**: Cache server configuration
- **JWT**: Secret keys and expiration
- **Email**: SMTP configuration for notifications
- **Admin**: Teacher registration password
- **External**: Frontend URL, CORS settings

### Feature Flags
- **Game Modes**: Enable/disable specific modes
- **Question Types**: Supported question formats
- **Authentication**: Login methods and requirements
- **Analytics**: Tracking and reporting features

## 🧪 Testing Strategy

### Unit Tests
- **Backend Services**: Business logic testing
- **Utility Functions**: Helper and utility testing
- **Validation**: Schema and input validation
- **Database Operations**: Prisma query testing

### Integration Tests
- **API Endpoints**: Full request/response cycles
- **Socket Events**: Real-time communication testing
- **Database Integration**: Data persistence testing
- **Authentication Flow**: Login/logout cycles

### End-to-End Tests
- **User Journeys**: Complete user workflows
- **Game Sessions**: Full game playthroughs
- **Cross-Device**: Mobile and desktop compatibility
- **Performance**: Load and stress testing

### Test Infrastructure
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP endpoint testing
- **Socket.IO Client**: Real-time testing
- **Test Database**: Isolated test environment

## 📚 Educational Features

### Subject Coverage
- **Mathematics**: All levels from basic arithmetic to advanced calculus
- **Science**: Physics, chemistry, biology integration
- **Language**: Grammar, vocabulary, literature
- **History/Geography**: Factual knowledge and analysis

### Pedagogical Features
- **Differentiated Learning**: Questions for different ability levels
- **Immediate Feedback**: Instant correction and explanation
- **Progress Tracking**: Individual learning paths
- **Collaborative Learning**: Group activities and discussions

### Assessment Tools
- **Formative Assessment**: Ongoing progress monitoring
- **Summative Assessment**: Comprehensive evaluations
- **Diagnostic Assessment**: Identifying learning gaps
- **Peer Assessment**: Student-to-student evaluation

## 🌟 Unique Selling Points

### Open Source Advantage
- **Transparency**: Code review and community contributions
- **Customization**: Adapt to specific educational needs
- **Cost-Free**: No licensing fees or subscriptions
- **Community-Driven**: Collective improvement and innovation

### Educational Focus
- **Math-Centric**: Specialized for mathematics education
- **LaTeX Support**: Professional mathematical notation
- **Research-Based**: Pedagogical best practices
- **Accessibility**: Inclusive design for all learners

### Technical Excellence
- **Real-time Performance**: Low-latency live interactions
- **Scalability**: Handle large classrooms and events
- **Reliability**: Robust error handling and recovery
- **Security**: Privacy-first approach to student data

## 🎯 Future Roadmap

### Planned Features
- **Advanced Question Types**: Drag-and-drop, drawing responses
- **Collaborative Questions**: Group problem-solving
- **AI-Powered**: Adaptive difficulty and personalized learning
- **Integration APIs**: LMS integration (Moodle, Canvas)
- **Mobile Apps**: Native iOS and Android applications
- **Offline Mode**: Download content for offline use

### Technical Improvements
- **Performance Optimization**: Faster load times and smoother interactions
- **Advanced Analytics**: Machine learning insights
- **Multi-language Support**: Internationalization
- **Accessibility Enhancements**: WCAG 2.1 AA compliance

This comprehensive overview should serve as a complete reference for understanding MathQuest's capabilities, architecture, and educational value proposition.
