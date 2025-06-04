# MathQuest Authentication System Documentation

## Overview

The MathQuest authentication system supports a sophisticated 4-state user model with seamless transitions between states. The system is designed around the `AuthProvider` React context that manages all authentication state and provides utilities for the entire application.

## Architecture

### Frontend Components
- **AuthProvider**: Central authentication state management (React Context)
- **Next.js API Routes**: Proxy routes at `/api/auth/*` that handle cookie management
- **Middleware**: Route protection and authentication state detection
- **useAuth Hook**: Consumer interface for components

### Backend Components
- **Express Auth API**: `/api/v1/auth` endpoint handling login/register operations
- **Database**: User storage with roles (STUDENT, TEACHER)
- **JWT Tokens**: Authentication tokens stored as HttpOnly cookies

### Cookie Architecture
The system uses **dual-domain cookies** to solve cross-origin authentication:

```
Backend (port 3007) → Sets teacherToken/authToken → Next.js Proxy (port 3008) → Re-sets for frontend domain
```

This ensures middleware on the frontend can read authentication cookies for route protection.

**CRITICAL IMPLEMENTATION NOTE**: All AuthProvider methods now use frontend API proxy routes (`/api/auth/*`) instead of calling the backend directly (`makeApiRequest`). This is essential because:

1. **Cookie Domain Compatibility**: Backend sets cookies for `localhost:3007`, but frontend middleware runs on `localhost:3008`
2. **Proxy Route Solution**: Frontend API routes at `/api/auth/*` call the backend and re-set cookies for the frontend domain
3. **Middleware Access**: Only cookies set for the frontend domain can be read by Next.js middleware for route protection

**Before Fix**: AuthProvider → `makeApiRequest` → Backend (port 3007) → Cookies not accessible to middleware
**After Fix**: AuthProvider → `fetch('/api/auth/*')` → Frontend Proxy → Backend → Cookies properly set for frontend domain

## User States

The authentication system supports 4 distinct user states:

### 1. `anonymous` 
- **Description**: No user data whatsoever
- **Storage**: None
- **Capabilities**: View public content only
- **Navigation**: Can access landing page, login forms

### 2. `guest`
- **Description**: Username/avatar set via localStorage, no account
- **Storage**: 
  - `localStorage`: `mathquest_username`, `mathquest_avatar`, `mathquest_cookie_id`
  - Database: Guest entry with cookieId for upgrade tracking
- **Capabilities**: Join games, create tournaments, access all student features
- **Navigation**: Same navigation menu as students - can access game areas and create content

### 3. `student`
- **Description**: Full student account with email/password
- **Storage**: 
  - HttpOnly cookies: `authToken` or equivalent
  - Database: Full user record with email/password
- **Capabilities**: Create quizzes, join games, full student features
- **Navigation**: Access to `/student/*` routes

### 4. `teacher`
- **Description**: Teacher account with admin privileges  
- **Storage**: 
  - HttpOnly cookies: `teacherToken`
  - Database: Teacher record in `enseignants` table
- **Capabilities**: Admin features, create/manage content, student features
- **Navigation**: Access to `/teacher/*` and `/student/*` routes (admin privileges)

## API Endpoints

### Frontend API Routes (Next.js - Port 3008)

All authentication operations now go through these frontend proxy routes to ensure proper cookie domain handling:

#### `POST /api/auth`
Proxy route for teacher login and registration
```typescript
// Teacher Login Request
{
  "action": "teacher_login",
  "email": "teacher@example.com", 
  "password": "password123"
}

// Teacher Registration Request
{
  "action": "teacher_register",
  "email": "teacher@example.com", 
  "password": "password123",
  "username": "Teacher Name",
  "adminPassword": "admin_secret",
  "avatar": "🦄"
}

// Response
{
  "message": "Login successful",
  "enseignantId": "uuid",
  "username": "Teacher Name",
  "avatar": "🦄",
  "token": "jwt-token"
}
```

#### `POST /api/auth/register`
Proxy route for student registration
```typescript
// Request
{
  "email": "student@example.com",
  "password": "password123",
  "username": "Student Name",
  "avatar": "🎯",
  "role": "STUDENT"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "username": "Student Name",
    "avatar": "🎯",
    "role": "STUDENT"
  },
  "token": "jwt-token"
}
```

#### `POST /api/auth/upgrade`
Proxy route for guest upgrade to account
```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "Existing Guest Name",
    "avatar": "🎯",
    "role": "STUDENT"
  }
}
```

#### `PUT /api/auth/profile`
Proxy route for profile updates
```typescript
// Request
{
  "username": "New Username",
  "avatar": "🚀"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "New Username",
    "avatar": "🚀",
    "role": "STUDENT"
  }
}
```

#### `POST /api/auth/logout`
Clears all authentication cookies
```typescript
// Response
{
  "message": "Déconnexion réussie."
}
```

#### `GET /api/auth/status`
Returns current authentication status
```typescript
// Response
{
  "isTeacher": true,
  "teacherId": "uuid",
  "isStudent": false,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "Username", 
    "avatar": "🎯",
    "role": "TEACHER"
  }
}
```

#### `POST /api/auth/universal-login`
Universal login that detects user type
```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response - Teacher
{
  "enseignantId": "uuid",
  "username": "Teacher",
  "token": "jwt"
}

// Response - Student  
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "username": "Student",
    "role": "STUDENT"
  },
  "token": "jwt"
}
```

### Backend API Routes (Express - Port 3007)

#### `POST /api/v1/auth`
Handles multiple authentication actions based on `action` parameter:

**Teacher Login**
```typescript
// Request
{
  "action": "teacher_login",
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Teacher Registration**
```typescript
// Request  
{
  "action": "teacher_register",
  "email": "teacher@example.com", 
  "password": "password123",
  "username": "Teacher Name",
  "adminPassword": "admin_secret",
  "avatar": "🦄"
}
```

## AuthProvider Methods

### Authentication Methods

#### `universalLogin(email: string, password: string)`
Automatically detects whether user is student or teacher and sets appropriate state.
- **Route**: `POST /api/auth/universal-login` (frontend proxy)
- **Cookies**: Sets appropriate `teacherToken` or `authToken` for frontend domain
- **State**: Updates to `teacher` or `student` based on server response

#### `loginStudent(email: string, password: string)`
Explicit student login using universal login endpoint.
- **Route**: `POST /api/auth/universal-login` (frontend proxy)
- **Cookies**: Sets `authToken` for frontend domain
- **State**: Updates to `student`

#### `loginTeacher(email: string, password: string)`  
Explicit teacher login.
- **Route**: `POST /api/auth` with `action: "teacher_login"` (frontend proxy)
- **Cookies**: Sets `teacherToken` for frontend domain
- **State**: Updates to `teacher`

#### `registerStudent(email: string, password: string, username: string, avatar: string)`
Create new student account.
- **Route**: `POST /api/auth/register` (frontend proxy)
- **Cookies**: Sets `authToken` for frontend domain
- **State**: Updates to `student`

#### `registerTeacher(email: string, password: string, username: string, adminPassword: string, avatar: string)`
Create new teacher account (requires admin password).
- **Route**: `POST /api/auth` with `action: "teacher_register"` (frontend proxy)
- **Cookies**: Sets `teacherToken` for frontend domain
- **State**: Updates to `teacher`

#### `logout(redirectUrl?: string)`
Centralized logout that:
- Clears localStorage
- Calls `POST /api/auth/logout` (frontend proxy) to clear HttpOnly cookies  
- Resets all authentication state
- Optionally redirects to specified URL

### Guest Profile Methods

#### `setGuestProfile(username: string, avatar: string)`
Sets guest profile and registers user in database for upgrade tracking.
- **Storage**: localStorage (`mathquest_username`, `mathquest_avatar`, `mathquest_cookie_id`)
- **Route**: `POST /api/auth/register` (frontend proxy) for database registration
- **State**: Updates to `guest`

#### `clearGuestProfile()`
Removes guest profile from localStorage.

#### `upgradeGuestToAccount(email: string, password: string)`
Converts guest profile to full student account.
- **Route**: `POST /api/auth/upgrade` (frontend proxy)
- **Process**: Links existing cookieId to new account
- **State**: Updates to `student`

### Utility Methods

#### `canCreateQuiz(): boolean`
Returns `true` if user can create quizzes (student or teacher).

#### `canJoinGame(): boolean`  
Returns `true` if user can join games (not anonymous).

#### `requiresAuth(): boolean`
Returns `true` if user needs to authenticate (is anonymous).

#### `updateProfile(data: { username: string; avatar: string })`
Updates user profile. For guests, updates localStorage. For accounts, calls API.
- **Route**: `PUT /api/auth/profile` (frontend proxy) for authenticated users
- **Storage**: localStorage for guest users

#### `refreshAuth()`
Refreshes authentication state by checking localStorage and calling authentication status endpoint.
- **Route**: `GET /api/auth/status` (frontend proxy)
- **Process**: Reads HttpOnly cookies and returns current authentication state
- **Critical**: This method uses frontend proxy to ensure cookies are readable by middleware

## State Management

### AuthProvider State

```typescript
interface AuthContextType {
  // New 4-state system
  userState: 'anonymous' | 'guest' | 'student' | 'teacher';
  userProfile: UserProfile;
  
  // Backward compatibility
  isAuthenticated: boolean;
  isStudent: boolean; 
  isTeacher: boolean;
  isLoading: boolean;
  teacherId?: string;
  
  // Methods
  refreshAuth: () => Promise<void>;
  logout: (redirectUrl?: string) => Promise<boolean>;
  setGuestProfile: (username: string, avatar: string) => Promise<void>;
  clearGuestProfile: () => void;
  upgradeGuestToAccount: (email: string, password: string) => Promise<UpgradeGuestResponse>;
  universalLogin: (email: string, password: string) => Promise<void>;
  loginStudent: (email: string, password: string) => Promise<void>;
  registerStudent: (email: string, password: string, username: string, avatar: string) => Promise<void>;
  loginTeacher: (email: string, password: string) => Promise<void>;
  registerTeacher: (email: string, password: string, username: string, adminPassword: string, avatar: string) => Promise<void>;
  canCreateQuiz: () => boolean;
  canJoinGame: () => boolean;
  requiresAuth: () => boolean;
  updateProfile: (data: { username: string; avatar: string }) => Promise<void>;
}
```

### UserProfile Interface

```typescript
interface UserProfile {
  username?: string;
  avatar?: string;
  email?: string;
  role?: 'STUDENT' | 'TEACHER';
  userId?: string;
  cookieId?: string; // For guest users
}
```

## Middleware Configuration

The middleware protects routes based on authentication state:

```typescript
// Protected routes
matcher: [
  '/student/:path*',    // Student-only routes
  '/teacher/:path*',    // Teacher-only routes  
  '/login',            // Redirect if authenticated
  '/debug/:path*'      // Debug routes
]
```

### Route Protection Logic

1. **Anonymous users**: Redirected to `/` for protected routes
2. **Authenticated users**: Redirected away from `/login` to their home page
3. **Role-based access**: 
   - Students can access `/student/*` routes only
   - Teachers have admin privileges and can access both `/teacher/*` and `/student/*` routes

## Cookie Management

### Cookie Names
- `teacherToken`: HttpOnly JWT for teacher authentication
- `authToken`: HttpOnly JWT for student authentication (if different from teacherToken)

### Cookie Properties
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/'
}
```

## Local Storage Keys

- `mathquest_username`: Guest username
- `mathquest_avatar`: Guest avatar  
- `mathquest_cookie_id`: Guest tracking ID for upgrades
- `mathquest_jwt_token`: Legacy token storage (if used)

## Usage Examples

### Basic Authentication Check
```typescript
import { useAuth } from '@/components/AuthProvider';

function MyComponent() {
  const { userState, isAuthenticated, userProfile } = useAuth();
  
  if (userState === 'anonymous') {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {userProfile.username}</div>;
}
```

### Role-Based Rendering  
```typescript
function AdminButton() {
  const { userState, canCreateQuiz } = useAuth();
  
  if (userState !== 'teacher') {
    return null;
  }
  
  return <button>Admin Action</button>;
}
```

### Guest Profile Setup
```typescript
function SetupProfile() {
  const { setGuestProfile } = useAuth();
  
  const handleSubmit = async (username: string, avatar: string) => {
    try {
      await setGuestProfile(username, avatar);
      // User is now in 'guest' state
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };
}
```

### Universal Login
```typescript
function LoginForm() {
  const { universalLogin } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await universalLogin(email, password);
      // User is now authenticated as student or teacher
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

### Logout
```typescript
function LogoutButton() {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    const success = await logout('/');
    if (success) {
      // Logout successful, redirected to home
    }
  };
}
```

## Common Issues and Solutions

### Issue: User stuck on landing page after login
**Cause**: Middleware detecting stale authentication state
**Solution**: Check for HttpOnly cookies that weren't cleared during logout

### Issue: Authentication state not updating
**Cause**: AuthProvider not refreshing after login/logout
**Solution**: Call `refreshAuth()` after authentication operations

### Issue: Cross-origin cookie problems  
**Cause**: Backend cookies not accessible to frontend middleware
**Solution**: ✅ **FIXED** - All AuthProvider methods now use frontend API proxy routes (`/api/auth/*`) instead of calling backend directly via `makeApiRequest`. This ensures cookies are properly set for the frontend domain.

### Issue: Guest profile not persisting
**Cause**: localStorage being cleared or not being set properly
**Solution**: Ensure `setGuestProfile()` is called and check localStorage keys

### Issue: Login redirecting to wrong page or authentication failing
**Cause**: Login page accessing `/login` can clear cookies if accessed by authenticated users
**Solution**: ✅ **FIXED** - Login page now redirects authenticated users away before they can access the authentication forms, preventing accidental logout

### Issue: AuthProvider methods failing with network errors
**Cause**: Using `makeApiRequest` which hits backend directly, causing cookie domain mismatch
**Solution**: ✅ **FIXED** - All methods now use `fetch()` with frontend proxy routes and `credentials: 'include'` to ensure proper cookie handling

## Testing Authentication

### Debug Tools
- Visit `/debug` for authentication state inspection
- Use `/clear-auth.html` to reset all authentication data
- Check browser DevTools → Application → Local Storage and Cookies
- Monitor network requests to see cookie headers

### Manual Testing Scenarios
1. **Guest Flow**: Set username/avatar → Join game → Upgrade to account
2. **Student Flow**: Register → Login → Access student features → Logout
3. **Teacher Flow**: Login → Access admin features → Create content → Logout
4. **State Transitions**: Test all transitions between the 4 states
5. **Route Protection**: Verify middleware blocks unauthorized access

This documentation should be kept updated as the authentication system evolves.

## Recent Architectural Improvements

### Cookie Domain Fix (June 2025)
**Problem**: AuthProvider methods were calling backend endpoints directly via `makeApiRequest`, causing authentication cookies to be set for the backend domain (`localhost:3007`) but not accessible to frontend middleware (`localhost:3008`).

**Solution**: All AuthProvider methods updated to use frontend API proxy routes:
- `universalLogin()` → `POST /api/auth/universal-login`
- `loginTeacher()` → `POST /api/auth` 
- `registerStudent()` → `POST /api/auth/register`
- `registerTeacher()` → `POST /api/auth`
- `upgradeGuestToAccount()` → `POST /api/auth/upgrade`
- `updateProfile()` → `PUT /api/auth/profile`
- `refreshAuth()` → `GET /api/auth/status`
- `logout()` → `POST /api/auth/logout`

**Impact**: 
- ✅ Authentication cookies now properly accessible to middleware
- ✅ Route protection working correctly
- ✅ E2E tests should now pass authentication flows
- ✅ No more circular redirect issues between authenticated states

### Legacy Page Cleanup
**Removed**: Legacy home pages that were causing circular redirects:
- `/student/home/` - Redirected to main landing page (`/`)
- `/teacher/home/` - Redirected to main landing page (`/`)
- `/teacher/signup/` - Functionality moved to unified login page
- `/teacher/login/` - Functionality moved to unified login page

**Updated**: Landing page now shows content for all user types instead of redirecting

### Login Page Access Control
**Updated**: Login page now prevents authenticated users from accessing authentication forms, preventing accidental cookie clearing and logout.