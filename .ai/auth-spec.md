# Authentication System Architecture Specification

## Document Overview

This specification defines the complete authentication architecture for the 10x-recipes application, implementing user registration (US-002) and login (US-001) functionality. The design integrates Supabase Auth with Astro's server-side rendering model while preserving all existing recipe management features.

**Key Design Principles:**

- Supabase Auth handles credential verification, session management, and security
- **CRITICAL:** Application NEVER stores passwords or credentials - Supabase Auth manages all credential hashing and verification
- Server-side authentication checks protect all recipe routes and API endpoints
- Client-side React components provide interactive authentication forms
- Existing recipe functionality remains fully operational for authenticated users
- Per-request Supabase clients ensure proper SSR session handling in Astro

---

## 0. PRD ALIGNMENT & CONFLICT RESOLUTION

### 0.1 Document Cross-Reference Status

**Analysis Date:** 2026-02-01  
**PRD Version:** `.ai/prd.md` (148 lines)  
**Auth Spec Version:** `.ai/auth-spec.md` (this document)

### 0.2 Key Conflicts Identified & Resolved

#### **CONFLICT 1: Credential Storage Language**

**PRD Statement (line 38):**

> "Store credentials securely and log authentication events for analytics."

**Issue:** This language implies storing passwords/credentials in the application database, which is a critical security anti-pattern.

**Resolution:** ✅ RESOLVED

- **Clarification:** PRD language is imprecise. Intent is to "manage authentication securely."
- **Implementation:** Supabase Auth stores bcrypt-hashed passwords in its internal `auth.users` table
- **Application:** NEVER stores, logs, or handles raw passwords
- **Auth Spec Updated:** Section 7 (Key Design Principles) explicitly states application never stores credentials

**Updated PRD Understanding:**

> "Implement Supabase Auth for secure credential management (passwords never stored in application database) and log authentication events to `auth_event_logs` for analytics."

---

#### **CONFLICT 2: RLS Policy Implementation Status**

**Auth Spec Statement (line 1068):**

> "Enable RLS policies that were commented out in initial migration"

**Issue:** Spec referenced future migration but didn't confirm existence of base schema.

**Resolution:** ✅ VERIFIED & DOCUMENTED

- **Verification:** Initial migration `20260122120000_create_recipe_schema.sql` confirmed to include:
  - All tables with proper `user_id` foreign keys
  - `auth_event_logs` table present (lines 70-76)
  - RLS enabled on all tables (lines 99-104)
  - **RLS policies commented out** (lines 106-389) - awaiting activation
- **Implementation Plan:** Section 3.3.1 now includes verification status and exact line references
- **Migration Required:** New migration to uncomment policies (covered in Section 3.3.1)

---

#### **CONFLICT 3: Supabase Client Architecture for Astro SSR**

**Original Auth Spec:**

> Used singleton Supabase client pattern

**Issue:** Singleton clients don't work properly with Astro's per-request SSR model. Sessions can leak between requests.

**Resolution:** ✅ CORRECTED

- **Root Cause:** Astro processes requests in isolation; shared client state causes session confusion
- **Solution:** Implement factory pattern with per-request client creation
- **Updated Sections:**
  - Section 3.1.1: Now uses `createSupabaseClient()` factory function
  - Section 2.4.3: Middleware creates new client per request from cookies
  - Includes proper cookie management for access/refresh tokens

---

### 0.3 Implementation Gaps Identified & Addressed

#### **GAP 1: Rate Limiting Specification**

**PRD Requirement:** Brute force protection implied by US-001 acceptance criteria

**Auth Spec Status:** Originally marked as "optional" without concrete guidance

**Resolution:** ✅ CLARIFIED

- **Section 3.2.3 Updated:** Now provides clear decision framework
- **MVP Recommendation:** Use Supabase built-in Auth rate limiting (verify in dashboard)
- **Fallback Plan:** Application-level in-memory rate limiter for MVP if Supabase insufficient
- **Action Required:** Verify Supabase rate limiting settings before implementation

---

#### **GAP 2: Service-Role Client Usage**

**Issue:** Auth event logging requires service-role client (bypasses RLS), but creation pattern not specified.

**Resolution:** ✅ SPECIFIED

- **Section 3.1.1:** Added `src/db/supabase.server.ts` file specification
- **Section 2.3.2:** Updated to use service-role client from server module
- **Security Note:** Service-role client never exposed to frontend, only used for auth logging

---

### 0.4 Redundancy Analysis

**Finding:** Both PRD and Auth Spec document same validation rules and user flows.

**Assessment:** ✅ ACCEPTABLE REDUNDANCY

- **Rationale:** PRD defines "what" (requirements), Auth Spec defines "how" (implementation)
- **Benefit:** Allows verification that implementation satisfies requirements
- **No Action Required:** Redundancy is by design and aids implementation validation

---

### 0.5 User Story Implementation Verification

Each user story from PRD Section 5 mapped to implementation sections:

| User Story             | PRD Line | Auth Spec Implementation        | Status           |
| ---------------------- | -------- | ------------------------------- | ---------------- |
| US-001 (Login)         | 61-67    | Sections 1.2.1, 2.1.2, 4.1-4.5  | ✅ Implementable |
| US-002 (Register)      | 69-75    | Sections 1.2.2, 2.1.1, 4.1-4.5  | ✅ Implementable |
| US-003 (Import)        | 77-84    | Section 2.2 (auth checks added) | ✅ Implementable |
| US-004 (View)          | 86-93    | Sections 1.3.1, 2.2             | ✅ Implementable |
| US-005 (Search)        | 95-101   | Section 2.2 (auth checks added) | ✅ Implementable |
| US-006 (Delete)        | 103-109  | Section 2.2 (auth checks added) | ✅ Implementable |
| US-007 (Status)        | 111-117  | Section 2.2 (preserved)         | ✅ Implementable |
| US-008 (Retry)         | 119-125  | Section 2.2 (preserved)         | ✅ Implementable |
| US-009 (Manual Create) | 127-133  | Section 2.2 (auth checks added) | ✅ Implementable |
| US-010 (Edit)          | 135-141  | Section 2.2 (auth checks added) | ✅ Implementable |

**Conclusion:** All user stories have complete implementation paths defined in auth-spec.

---

### 0.6 Outstanding Decisions Required

| Decision Point       | Section | Options                      | Recommendation               |
| -------------------- | ------- | ---------------------------- | ---------------------------- |
| Rate Limiting Source | 3.2.3   | Supabase built-in vs. custom | Check Supabase first         |
| Session Duration     | 2.4.2   | 7 days vs. other             | Keep 7 days (PRD silent)     |
| Password Min Length  | 2.3.1   | 8 chars vs. more             | Keep 8 chars (PRD compliant) |

**Action Required:** Verify Supabase Auth rate limiting configuration before starting implementation.

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page Structure Overview

The authentication system introduces new dedicated pages while modifying existing pages to enforce authentication requirements:

**New Pages:**

- `/auth/login` - Login form page
- `/auth/register` - Registration form page

**Modified Pages:**

- `/` (index) - Recipe list, now requires authentication
- `/recipes/[id]` - Recipe detail, now requires authentication

**Unchanged Pages:**

- All API endpoints remain but add authentication checks

### 1.2 Authentication Pages

#### 1.2.1 Login Page (`src/pages/auth/login.astro`)

**Purpose:** Provides email/password login interface for existing users.

**Page Structure:**

```
Layout (Astro)
└── LoginView (React Client Component)
    ├── LoginForm (React Component)
    │   ├── Email Input Field
    │   ├── Password Input Field
    │   ├── Submit Button
    │   └── Error Display Area
    └── Link to Register Page
```

**Server-Side Logic (Astro frontmatter):**

- Check if user is already authenticated via session cookie
- If authenticated, redirect to `/` (recipe list)
- If not authenticated, render login form
- Handle query parameters:
  - `?redirectTo={path}` - Return path after successful login
  - `?error={message}` - Display error from redirect (e.g., session expired)

**Client Component Responsibilities:**

- Render form fields with proper HTML5 validation attributes
- Handle form submission via fetch to `/api/auth/login` endpoint
- Display validation errors inline near relevant fields
- Display authentication errors in dedicated error zone
- Manage loading states during submission
- Redirect to target page on successful authentication

**Validation Cases:**

1. **Empty email:** "Email is required"
2. **Invalid email format:** "Please enter a valid email address"
3. **Empty password:** "Password is required"
4. **Incorrect credentials:** "Invalid email or password"
5. **Network/server errors:** "Unable to connect. Please try again."

**User Flow:**

1. User lands on `/auth/login`
2. Server checks session → if authenticated, redirect to `/`
3. User fills email and password fields
4. Client validates inputs on blur and submit
5. On submit, POST to `/api/auth/login` with credentials
6. On success: Client redirects to `redirectTo` param or `/`
7. On error: Display error message, keep form populated (except password)

---

#### 1.2.2 Register Page (`src/pages/auth/register.astro`)

**Purpose:** Allows new users to create accounts with email/password.

**Page Structure:**

```
Layout (Astro)
└── RegisterView (React Client Component)
    ├── RegisterForm (React Component)
    │   ├── Email Input Field
    │   ├── Password Input Field (with strength indicator)
    │   ├── Confirm Password Input Field
    │   ├── Submit Button
    │   └── Error Display Area
    └── Link to Login Page
```

**Server-Side Logic (Astro frontmatter):**

- Check if user is already authenticated
- If authenticated, redirect to `/` (recipe list)
- If not authenticated, render registration form
- Handle query parameters:
  - `?redirectTo={path}` - Return path after successful registration

**Client Component Responsibilities:**

- Render form fields with validation attributes
- Validate password strength client-side (minimum 8 characters)
- Check password confirmation matches
- Handle form submission via fetch to `/api/auth/register` endpoint
- Display validation errors inline
- Display registration errors in dedicated error zone
- Manage loading states during submission
- Automatically log in user and redirect on successful registration

**Validation Cases:**

1. **Empty email:** "Email is required"
2. **Invalid email format:** "Please enter a valid email address"
3. **Empty password:** "Password is required"
4. **Password too short:** "Password must be at least 8 characters"
5. **Passwords don't match:** "Passwords do not match"
6. **Duplicate email:** "An account with this email already exists"
7. **Network/server errors:** "Unable to create account. Please try again."

**User Flow:**

1. User lands on `/auth/register`
2. Server checks session → if authenticated, redirect to `/`
3. User fills email, password, and confirm password fields
4. Client validates inputs on blur and submit
5. On submit, POST to `/api/auth/register` with credentials
6. On success: Backend creates account, establishes session, returns success
7. Client redirects to `redirectTo` param or `/`
8. On error: Display error message, keep email populated, clear passwords

---

### 1.3 Protected Pages (Authentication-Required)

#### 1.3.1 Recipe List Page (`src/pages/index.astro`)

**Modifications Required:**

**Server-Side Logic (Astro frontmatter):**

```typescript
// Before existing code:
const session = await Astro.locals.supabase.auth.getSession();
if (!session.data.session) {
  return Astro.redirect(`/auth/login?redirectTo=${encodeURIComponent(Astro.url.pathname)}`);
}

const userId = session.data.session.user.id;
// Pass userId to API calls for user-specific data
```

**Client Component Updates:**

- `RecipeListView` receives `userId` as prop (for display purposes only)
- Add logout button in page header/navigation
- No other functional changes to existing recipe list behavior

**Authentication Flow:**

1. User navigates to `/`
2. Server checks for valid session
3. If no session: Redirect to `/auth/login?redirectTo=/`
4. If session exists: Fetch user's recipes and render list
5. All recipe operations continue as before (import, create, edit, delete)

---

#### 1.3.2 Recipe Detail Page (`src/pages/recipes/[id].astro`)

**Modifications Required:**

**Server-Side Logic (Astro frontmatter):**

```typescript
// Before existing code:
const session = await Astro.locals.supabase.auth.getSession();
if (!session.data.session) {
  return Astro.redirect(`/auth/login?redirectTo=${encodeURIComponent(Astro.url.pathname)}`);
}

const userId = session.data.session.user.id;
// Verify recipe belongs to user via RLS policies
```

**Client Component Updates:**

- `RecipeDetailView` continues to work as before
- Add logout button in page header/navigation
- No other functional changes

**Authentication Flow:**

1. User navigates to `/recipes/[id]`
2. Server checks for valid session
3. If no session: Redirect to `/auth/login?redirectTo=/recipes/[id]`
4. If session exists: Fetch recipe detail (RLS ensures user owns it)
5. If recipe not found or not owned: Show 404
6. All recipe operations continue as before

---

### 1.4 Shared UI Components

#### 1.4.1 Navigation/Header Component (New)

**Component:** `src/components/auth/AppHeader.tsx`

**Purpose:** Provides consistent navigation and authentication state across pages.

**Structure:**

```
AppHeader (React Client Component)
├── Logo/Home Link
├── Navigation Links (conditional on auth state)
└── User Menu
    ├── User Email Display
    └── Logout Button
```

**Client-Side Behavior:**

- Display user email from session context
- Logout button calls `/api/auth/logout` endpoint
- On successful logout, redirect to `/auth/login`
- Manage loading state during logout

**Integration Points:**

- Add to `Layout.astro` as client component
- Receives authentication state as prop from server
- Conditionally rendered based on route (hide on auth pages)

---

#### 1.4.2 Form Components (Shared)

**Component:** `src/components/auth/FormField.tsx`

**Purpose:** Reusable form input with consistent validation display.

**Props:**

- `label: string` - Field label text
- `name: string` - Input name attribute
- `type: string` - Input type (text, email, password)
- `value: string` - Controlled input value
- `onChange: (value: string) => void` - Change handler
- `error?: string` - Validation error message
- `required?: boolean` - HTML5 required attribute
- `autoComplete?: string` - Autocomplete hint

**Rendering:**

- Label with required indicator
- Input field with validation styling
- Error message display (only when error exists)

**Component:** `src/components/auth/SubmitButton.tsx`

**Purpose:** Form submit button with loading state.

**Props:**

- `label: string` - Button text
- `loadingLabel?: string` - Text shown during loading
- `isLoading: boolean` - Loading state flag
- `disabled?: boolean` - Disabled state

---

### 1.5 Layout Modifications

**File:** `src/layouts/Layout.astro`

**Changes:**

- Accept optional `showHeader?: boolean` prop (default: true)
- When `showHeader` is true and user is authenticated, include `AppHeader` component
- Pass authentication state to header component
- Maintain all existing layout functionality

**Server-Side Logic:**

```typescript
const session = await Astro.locals.supabase.auth.getSession();
const isAuthenticated = !!session.data.session;
const userEmail = session.data.session?.user.email;
```

---

### 1.6 Validation and Error Handling Summary

**Client-Side Validation (Immediate Feedback):**

- Email format validation (HTML5 + regex)
- Password minimum length (8 characters)
- Password confirmation match
- Required field validation
- Display inline near fields, clear on fix

**Server-Side Validation (Security & Data Integrity):**

- Email format re-validation
- Password strength enforcement
- Duplicate email check
- Rate limiting per IP/email
- SQL injection protection (via parameterized queries)

**Error Display Patterns:**

1. **Field Errors:** Shown inline below input, red border on input
2. **Form Errors:** Shown at top of form in error banner (e.g., "Invalid credentials")
3. **Network Errors:** Generic message with retry option
4. **Session Errors:** Redirect to login with error in query param

**Error Messages (User-Facing):**

- Clear, non-technical language
- Action-oriented (what to do next)
- No exposure of system internals
- Consistent tone across all auth pages

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints

#### 2.1.1 Registration Endpoint

**Path:** `POST /api/auth/register`

**File:** `src/pages/api/auth/register.ts`

**Request Body Schema:**

```typescript
{
  email: string; // Valid email format
  password: string; // Minimum 8 characters
}
```

**Response Schemas:**

**Success (201 Created):**

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    created_at: string;
  }
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }
}
```

**Error (400 Bad Request):**

```typescript
{
  success: false;
  error: {
    code: string;        // e.g., "VALIDATION_ERROR", "DUPLICATE_EMAIL"
    message: string;     // User-friendly message
    fields?: {           // Field-specific errors
      [key: string]: string;
    };
  };
}
```

**Error (500 Internal Server Error):**

```typescript
{
  success: false;
  error: {
    code: "SERVER_ERROR";
    message: "An unexpected error occurred";
  }
}
```

**Implementation Steps:**

1. Parse and validate request body (Zod schema)
2. Normalize email (trim, lowercase)
3. Validate password strength (min 8 chars)
4. Call `supabase.auth.signUp()` with email/password
5. Handle Supabase errors:
   - Email already exists → Return 400 with DUPLICATE_EMAIL
   - Invalid format → Return 400 with VALIDATION_ERROR
   - Service error → Return 500 with SERVER_ERROR
6. On success:
   - Log authentication event to `auth_event_logs` table
   - Set session cookie via Supabase client
   - Return user and session data
7. Catch unexpected errors, log, return generic 500

**Error Handling Cases:**

- Invalid email format: 400, "Please enter a valid email address"
- Password too short: 400, "Password must be at least 8 characters"
- Email already registered: 400, "An account with this email already exists"
- Supabase service down: 500, "Service temporarily unavailable"
- Network timeout: 500, "Request timeout, please try again"

---

#### 2.1.2 Login Endpoint

**Path:** `POST /api/auth/login`

**File:** `src/pages/api/auth/login.ts`

**Request Body Schema:**

```typescript
{
  email: string;
  password: string;
}
```

**Response Schemas:**

**Success (200 OK):**

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
  }
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }
}
```

**Error (401 Unauthorized):**

```typescript
{
  success: false;
  error: {
    code: "INVALID_CREDENTIALS";
    message: "Invalid email or password";
  }
}
```

**Error (400 Bad Request):**

```typescript
{
  success: false;
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    fields?: {
      [key: string]: string;
    };
  };
}
```

**Implementation Steps:**

1. Parse and validate request body (Zod schema)
2. Normalize email (trim, lowercase)
3. Call `supabase.auth.signInWithPassword()` with credentials
4. Handle Supabase errors:
   - Invalid credentials → Return 401 with INVALID_CREDENTIALS
   - Invalid format → Return 400 with VALIDATION_ERROR
   - Account locked/disabled → Return 401 with generic error
   - Service error → Return 500 with SERVER_ERROR
5. On success:
   - Log authentication event to `auth_event_logs` table
   - Set session cookie via Supabase client
   - Return user and session data
6. Catch unexpected errors, log, return generic 500

**Error Handling Cases:**

- Empty email/password: 400, specific field errors
- Invalid credentials: 401, "Invalid email or password" (generic for security)
- Too many attempts: 429, "Too many login attempts, please try again later"
- Service unavailable: 500, "Service temporarily unavailable"

**Security Considerations:**

- Generic error message for invalid credentials (don't reveal if email exists)
- Rate limiting on email and IP to prevent brute force
- Log all login attempts (success and failure) for monitoring
- Session tokens stored in httpOnly cookies

---

#### 2.1.3 Logout Endpoint

**Path:** `POST /api/auth/logout`

**File:** `src/pages/api/auth/logout.ts`

**Request Body:** None (authentication via session cookie)

**Response Schemas:**

**Success (200 OK):**

```typescript
{
  success: true;
}
```

**Error (500 Internal Server Error):**

```typescript
{
  success: false;
  error: {
    code: "SERVER_ERROR";
    message: "Logout failed";
  }
}
```

**Implementation Steps:**

1. Extract session from cookies via `Astro.locals.supabase`
2. Call `supabase.auth.signOut()`
3. Clear session cookies
4. Log logout event to `auth_event_logs` table (if user was authenticated)
5. Return success response
6. Catch unexpected errors, log, return 500 (but still clear cookies)

**Error Handling:**

- No session exists: Still return 200 success (idempotent)
- Supabase error: Log error, clear cookies anyway, return 200
- Always succeed from client perspective to avoid UX issues

---

#### 2.1.4 Session Check Endpoint (Optional, for client-side checks)

**Path:** `GET /api/auth/session`

**File:** `src/pages/api/auth/session.ts`

**Request:** None (authentication via session cookie)

**Response Schemas:**

**Success (200 OK) - Authenticated:**

```typescript
{
  authenticated: true;
  user: {
    id: string;
    email: string;
  }
}
```

**Success (200 OK) - Not Authenticated:**

```typescript
{
  authenticated: false;
}
```

**Implementation Steps:**

1. Extract session from cookies via `Astro.locals.supabase`
2. Call `supabase.auth.getSession()`
3. If session exists and valid, return user data
4. If no session or expired, return authenticated: false
5. Optionally refresh session if refresh token is valid

**Use Cases:**

- Client-side components checking auth state
- Polling for session expiration
- Refreshing session before expiration

---

### 2.2 API Endpoint Modifications (Existing)

All existing recipe API endpoints require authentication checks:

#### 2.2.1 Recipe Endpoints

**Files to Modify:**

- `src/pages/api/recipes/index.ts` (GET, POST)
- `src/pages/api/recipes/[id].ts` (GET, PUT, DELETE)
- `src/pages/api/recipes/import.ts` (POST)

**Authentication Check Pattern (apply to all):**

```typescript
// At the start of each API handler:
const session = await Astro.locals.supabase.auth.getSession();

if (!session.data.session) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

const userId = session.data.session.user.id;
// Use userId in queries and pass to service functions
```

**Changes to Service Functions:**

**Pattern:** All recipe service functions receive `userId` parameter:

- `listRecipes(supabase, userId, query)`
- `getRecipeDetail(supabase, userId, recipeId)`
- `createRecipe(supabase, userId, command)`
- `updateRecipe(supabase, userId, recipeId, command)`
- `deleteRecipe(supabase, userId, recipeId)`
- `createRecipeImport(supabase, userId, command)`

**RLS Policy Enforcement:**

- Supabase RLS policies automatically filter by `user_id = auth.uid()`
- No additional filtering needed in queries
- Attempts to access other users' data return empty results or errors

---

### 2.3 Data Models and Validation

#### 2.3.1 Request Validation Schemas (Zod)

**File:** `src/lib/validation/auth.ts` (new)

**Registration Schema:**

```typescript
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

**Login Schema:**

```typescript
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
```

**Usage in API Endpoints:**

```typescript
const parseResult = registerSchema.safeParse(body);
if (!parseResult.success) {
  const fieldErrors = parseResult.error.flatten().fieldErrors;
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fields: fieldErrors,
      },
    }),
    { status: 400 }
  );
}
```

---

#### 2.3.2 Authentication Event Logging

**Purpose:** Track authentication events for analytics and security monitoring (as per PRD Section 6, line 38).

**Table:** `auth_event_logs` ✅ VERIFIED - Exists in migration `20260122120000_create_recipe_schema.sql` lines 70-76

**Schema:**

```sql
create table public.auth_event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

**Event Types:**

- `user_registered` - New account created
- `user_logged_in` - Successful login
- `user_logged_out` - Logout action
- `login_failed` - Invalid credentials
- `login_rate_limited` - Too many attempts

**Service Function:** `src/lib/services/auth/logAuthEvent.ts` (new)

**Function Signature:**

```typescript
export async function logAuthEvent(
  eventType: string,
  userId: string | null,
  metadata: Record<string, unknown>
): Promise<void>;
```

**Metadata Examples:**

```typescript
// Registration
{
  email: "user@example.com",
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0..."
}

// Login failure
{
  email: "user@example.com",
  reason: "invalid_credentials",
  ip_address: "192.168.1.1"
}
```

**Implementation:**

- Use service-role client (from `src/db/supabase.server.ts`) to write to `auth_event_logs`
- Never expose this data to clients
- Fire-and-forget pattern (don't block auth flow on logging failure)
- Include timestamp (handled by DB default `now()`)
- RLS intentionally disabled for this table (service-role only)

---

### 2.4 Session Management

#### 2.4.1 Cookie Configuration

**Strategy:** Use Supabase's built-in session cookie handling with httpOnly cookies.

**Cookie Names:**

- `sb-access-token` - Access token (short-lived)
- `sb-refresh-token` - Refresh token (long-lived)

**Cookie Attributes:**

- `httpOnly: true` - Prevent JavaScript access (XSS protection)
- `secure: true` - HTTPS only in production
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - Available site-wide
- `maxAge: 604800` - 7 days for refresh token

**Implementation:**

- Supabase client automatically manages cookies via `@supabase/ssr` helpers
- No manual cookie manipulation required
- Cookies set on successful registration/login
- Cookies cleared on logout

---

#### 2.4.2 Session Refresh

**Strategy:** Automatic refresh via Supabase client when access token expires.

**Behavior:**

- Access tokens expire after 1 hour
- Supabase client automatically refreshes using refresh token
- Refresh token valid for 7 days
- After 7 days of inactivity, user must re-login

**Implementation:**

- Supabase client handles refresh automatically on API calls
- Middleware can check session and refresh if needed:
  ```typescript
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  ```
- If refresh token expired, redirect to login

---

#### 2.4.3 Session Verification Middleware

**File:** `src/middleware/index.ts` (modify existing)

**Current Behavior:**

- Injects Supabase client into `context.locals`

**New Behavior:**

- Create per-request Supabase client using `createSupabaseClient()` factory
- Extract session from cookies and inject into client
- Set `context.locals.supabase`, `context.locals.session`, and `context.locals.user` for easy access

**Implementation Pattern:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client";
import type { Session, User } from "@supabase/supabase-js";

export const onRequest = defineMiddleware(async (context, next) => {
  // Extract tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // Create per-request Supabase client
  const supabase = createSupabaseClient(accessToken, refreshToken);
  context.locals.supabase = supabase;

  // Get session for all requests (optional, for convenience)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  // Update cookies if session was refreshed
  if (session) {
    context.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    context.cookies.set("sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // Continue to next handler
  return next();
});
```

**Update Type Definitions:**

```typescript
// In src/env.d.ts
import type { SupabaseClient } from "./db/supabase.client";
import type { Session, User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
      user: User | null;
    }
  }
}
```

---

### 2.5 Error Handling Strategy

#### 2.5.1 Error Categories

**Validation Errors (400):**

- Missing required fields
- Invalid format (email, password length)
- Schema validation failures

**Authentication Errors (401):**

- Invalid credentials
- Missing session/token
- Expired session (if not auto-refreshed)

**Authorization Errors (403):**

- Attempting to access other user's resources
- (RLS policies handle this automatically)

**Rate Limiting Errors (429):**

- Too many login attempts
- Too many registration attempts

**Server Errors (500):**

- Supabase service unavailable
- Database connection errors
- Unexpected exceptions

#### 2.5.2 Error Response Format

**Consistent Structure:**

```typescript
{
  success: false;
  error: {
    code: string;        // Machine-readable code
    message: string;     // User-friendly message
    fields?: {           // Optional field-specific errors
      [key: string]: string;
    };
    details?: unknown;   // Optional additional context (dev only)
  };
}
```

**Error Codes:**

- `VALIDATION_ERROR` - Input validation failed
- `INVALID_CREDENTIALS` - Login failed
- `DUPLICATE_EMAIL` - Email already registered
- `UNAUTHORIZED` - No session/token
- `RATE_LIMIT_EXCEEDED` - Too many attempts
- `SERVER_ERROR` - Unexpected server error

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Supabase Client Configuration

**File:** `src/db/supabase.client.ts` (modify existing)

**Current Configuration:**

- Creates client with anon key
- No session management

**New Configuration for Astro SSR:**

**IMPORTANT:** Astro requires per-request Supabase clients for SSR. We must create clients dynamically per request, not use a singleton.

```typescript
// src/db/supabase.client.ts - REMOVE singleton, export factory function
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Factory function to create Supabase client per request
export function createSupabaseClient(accessToken?: string, refreshToken?: string) {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true, // Auto-refresh before expiry
      persistSession: false, // SSR handles cookies externally
      detectSessionInUrl: true, // Support magic links (future)
      flowType: "pkce", // Use PKCE flow for security
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
```

**Server-Side Client (Service Role):**

**File:** `src/db/supabase.server.ts` (new)

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Service role client bypasses RLS - use with caution
export const supabaseServerClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

**Usage:**

- Use `supabaseClient` for user-facing operations (respects RLS)
- Use `supabaseServerClient` only for admin tasks (auth event logging)

---

#### 3.1.2 Authentication Methods

**Registration Flow:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: undefined, // No email verification in MVP
  },
});
```

**Login Flow:**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
});
```

**Logout Flow:**

```typescript
const { error } = await supabase.auth.signOut();
```

**Session Check:**

```typescript
const {
  data: { session },
  error,
} = await supabase.auth.getSession();
```

**User Retrieval:**

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
```

---

### 3.2 Security Considerations

#### 3.2.1 Password Security

**Requirements:**

- Minimum 8 characters (enforced client and server)
- No maximum length (Supabase handles hashing)
- Supabase uses bcrypt for password hashing
- No plain-text passwords stored or logged

**Future Enhancements (Out of MVP Scope):**

- Password strength meter (weak/medium/strong)
- Common password check
- Password history (prevent reuse)

---

#### 3.2.2 Session Security

**Protection Mechanisms:**

- HttpOnly cookies prevent XSS token theft
- Secure flag ensures HTTPS transmission
- SameSite=Lax prevents most CSRF attacks
- Short-lived access tokens (1 hour)
- Automatic token rotation on refresh

**Session Expiration:**

- Access token: 1 hour
- Refresh token: 7 days (configurable in Supabase)
- Absolute session: 7 days (user must re-login after)

---

#### 3.2.3 Rate Limiting

**Purpose:** Prevent brute force attacks on login/registration (required by US-001 acceptance criteria).

**⚠️ IMPLEMENTATION GAP:** Rate limiting is mentioned in PRD but not fully specified. This is a critical security requirement.

**Implementation Strategy for MVP:**

**Option 1: Supabase Built-in Rate Limiting (RECOMMENDED)**

- Check Supabase project settings for Auth rate limiting configuration
- Supabase Auth automatically provides rate limiting at the API level
- Default limits typically: 10 requests per 10 seconds per IP
- No additional code required if enabled in Supabase dashboard

**Option 2: Application-Level Rate Limiting (if Supabase limits insufficient)**

**File:** `src/middleware/rateLimiter.ts` (new, if needed)

**Limits:**

- Login: 5 attempts per email per 15 minutes
- Registration: 3 attempts per IP per hour
- Session check: No limit (read-only)

**Implementation Notes:**

- **MVP Simplification:** Use in-memory Map with email/IP as keys
- **Production Enhancement:** Use Redis or database for distributed rate limiting
- Track attempt count and timestamp
- Return 429 with `Retry-After` header on exceeded limit
- Clear counter on successful auth
- Log rate limit violations to `auth_event_logs`

**Decision Required:** Verify if Supabase Auth built-in rate limiting is sufficient for MVP before implementing custom solution.

---

#### 3.2.4 SQL Injection Prevention

**Protection:**

- All queries use parameterized statements via Supabase client
- Zod validation prevents malicious input
- RLS policies provide additional data isolation

**Examples:**

```typescript
// Safe - uses parameterized query
const { data } = await supabase.from("recipes").select("*").eq("user_id", userId);

// Unsafe - never construct raw SQL from user input (don't do this)
const { data } = await supabase.rpc("raw_query", {
  sql: `SELECT * FROM recipes WHERE user_id = '${userId}'`,
});
```

---

#### 3.2.5 XSS Prevention

**Protection Mechanisms:**

- React automatically escapes rendered content
- HttpOnly cookies prevent script access to tokens
- Content Security Policy headers (future enhancement)

**Best Practices:**

- Never use `dangerouslySetInnerHTML` with user content
- Sanitize any HTML rendering (not applicable in MVP)
- Validate and escape all user inputs

---

### 3.3 Migration Strategy

#### 3.3.1 Database Migrations

**File:** `supabase/migrations/20260201000000_enable_auth_rls.sql` (new)

**Purpose:** Enable RLS policies that were commented out in initial migration.

**VERIFICATION STATUS:** ✅ CONFIRMED - Initial schema migration `20260122120000_create_recipe_schema.sql` already includes:

- All required tables with `user_id` columns (recipes, recipe_imports, recipe_revisions)
- Foreign key constraints to `auth.users(id)`
- `auth_event_logs` table for authentication event tracking
- RLS enabled on all tables (lines 99-104)
- **RLS policies are commented out** (lines 106-389) - MUST BE ENABLED

**Migration Contents:**
This migration will uncomment and activate all RLS policy definitions from lines 106-389 of the initial schema. This includes:

1. **recipes table policies** - Enforce `user_id = auth.uid()` for all operations
2. **recipe_ingredients table policies** - Check ownership via recipe relationship
3. **recipe_steps table policies** - Check ownership via recipe relationship
4. **recipe_imports table policies** - Enforce `user_id = auth.uid()` for all operations
5. **recipe_revisions table policies** - Check ownership via recipe relationship

**Note:** `auth_event_logs` table intentionally has NO RLS policies (service-role only access).

**Migration Command:**

```bash
supabase db push
```

---

#### 3.3.2 Environment Variables

**File:** `.env` (update)

**Required Variables:**

```bash
# Existing
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key

# New (for service-role client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**File:** `.env.example` (update)

Add placeholders for new variables.

**File:** `src/env.d.ts` (update)

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}
```

---

### 3.4 Testing Strategy

#### 3.4.1 Manual Testing Scenarios

**Registration:**

1. Valid registration → Success, auto-login, redirect
2. Duplicate email → Error message displayed
3. Weak password → Validation error
4. Invalid email → Validation error
5. Network error → Error message, form remains filled

**Login:**

1. Valid credentials → Success, redirect to recipes
2. Invalid credentials → Generic error (don't reveal if email exists)
3. Empty fields → Validation errors
4. Already logged in → Redirect to recipes
5. Rate limiting → 429 error after 5 attempts

**Session Management:**

1. Logged in user can access protected pages
2. Logged out user redirected to login
3. Session persists across page reloads
4. Session expires after 7 days
5. Access token refreshes automatically

**Recipe Access:**

1. Authenticated user sees only their recipes
2. Attempting to access other user's recipe → 404
3. API calls without session → 401 error
4. All existing recipe features work as before

---

#### 3.4.2 Security Testing

**Tests to Perform:**

1. **SQL Injection:** Attempt malicious input in email/password fields
2. **XSS:** Attempt script injection in form fields
3. **CSRF:** Attempt cross-site request without proper headers
4. **Session Hijacking:** Try using another user's token
5. **Rate Limiting:** Verify lockout after too many attempts

---

## 4. IMPLEMENTATION CHECKLIST

### 4.1 Phase 1: Backend Foundation

- [ ] Create database migration to enable RLS policies
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to environment
- [ ] Create `src/db/supabase.server.ts` for service-role client
- [ ] Update `src/env.d.ts` with session types
- [ ] Update `src/middleware/index.ts` to inject session
- [ ] Create `src/lib/validation/auth.ts` with Zod schemas
- [ ] Create `src/lib/services/auth/logAuthEvent.ts`

### 4.2 Phase 2: Authentication API

- [ ] Create `src/pages/api/auth/register.ts`
- [ ] Create `src/pages/api/auth/login.ts`
- [ ] Create `src/pages/api/auth/logout.ts`
- [ ] Create `src/pages/api/auth/session.ts` (optional)
- [ ] Update all recipe API endpoints with auth checks
- [ ] Update recipe service functions to accept `userId`

### 4.3 Phase 3: UI Components

- [ ] Create `src/components/auth/FormField.tsx`
- [ ] Create `src/components/auth/SubmitButton.tsx`
- [ ] Create `src/components/auth/LoginForm.tsx`
- [ ] Create `src/components/auth/RegisterForm.tsx`
- [ ] Create `src/components/auth/AppHeader.tsx`

### 4.4 Phase 4: Authentication Pages

- [ ] Create `src/pages/auth/login.astro`
- [ ] Create `src/pages/auth/register.astro`
- [ ] Update `src/pages/index.astro` with auth check
- [ ] Update `src/pages/recipes/[id].astro` with auth check
- [ ] Update `src/layouts/Layout.astro` to include header

### 4.5 Phase 5: Testing & Refinement

- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test session persistence
- [ ] Test protected page access
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Verify existing recipe features work
- [ ] Update documentation

---

## 5. SUMMARY

### 5.1 Key Architectural Decisions

1. **Supabase Auth as Foundation:** Leverages battle-tested authentication system with minimal custom code.

2. **Server-Side Session Checks:** All authentication verification happens server-side in Astro pages/API routes, not in client components.

3. **RLS for Data Isolation:** Row-level security policies automatically enforce user data boundaries without manual filtering.

4. **HttpOnly Cookies:** Session tokens stored in httpOnly cookies prevent XSS attacks.

5. **Consistent Error Handling:** Standardized error response format across all endpoints.

6. **No Email Verification (MVP):** Simplified flow meets MVP requirements, can add later.

7. **Middleware Session Injection:** Centralized session retrieval in middleware reduces boilerplate.

8. **React for Forms:** Interactive auth forms use React for state management and validation.

9. **Astro for Pages:** Server-side rendering for authentication pages improves SEO and initial load.

10. **Event Logging:** All authentication events logged for analytics and security monitoring.

---

### 5.2 Compatibility with Existing Features

**Preserved Behaviors:**

- Recipe list, detail, create, edit, delete all work identically
- Import flow with LLM extraction unchanged
- Search by ingredients unchanged
- Status tracking (processing, succeeded, failed) unchanged
- Validation rules for recipes unchanged

**Added Requirements:**

- User must be logged in to access any recipe feature
- Recipes are now user-specific (RLS enforced)
- Navigation includes logout option
- API calls include session authentication

**No Breaking Changes:**

- Existing data models unchanged
- Database schema compatible (just enables RLS)
- API endpoint paths unchanged (added auth check only)
- Component props unchanged (except adding optional auth props)

---

### 5.3 Future Enhancements (Out of Scope)

The following features are explicitly excluded from MVP but can be added:

1. **Email Verification:** Require email confirmation before account activation
2. **Password Recovery:** "Forgot password" flow with reset emails
3. **Password Change:** Allow users to change password while logged in
4. **Multi-Factor Authentication:** SMS or TOTP second factor
5. **Social Login:** Google, GitHub, etc. OAuth providers
6. **Session Management UI:** View/revoke active sessions
7. **Account Deletion:** Self-service account removal
8. **Email Change:** Allow users to update email address
9. **Login History:** Display recent login activity
10. **Remember Me:** Extended session duration option

---

## 6. COMPONENT/MODULE REFERENCE

### 6.1 New Files to Create

**Pages:**

- `src/pages/auth/login.astro`
- `src/pages/auth/register.astro`

**API Endpoints:**

- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/session.ts`

**React Components:**

- `src/components/auth/FormField.tsx`
- `src/components/auth/SubmitButton.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/AppHeader.tsx`

**Services:**

- `src/lib/services/auth/logAuthEvent.ts`

**Utilities:**

- `src/lib/validation/auth.ts`

**Database:**

- `src/db/supabase.server.ts`
- `supabase/migrations/20260201000000_enable_auth_rls.sql`

### 6.2 Files to Modify

**Configuration:**

- `.env` (add SUPABASE_SERVICE_ROLE_KEY)
- `.env.example` (add placeholder)
- `src/env.d.ts` (add Locals types)

**Middleware:**

- `src/middleware/index.ts` (inject session)

**Pages:**

- `src/pages/index.astro` (add auth check)
- `src/pages/recipes/[id].astro` (add auth check)

**Layouts:**

- `src/layouts/Layout.astro` (add AppHeader)

**API Endpoints:**

- `src/pages/api/recipes/index.ts` (add auth check)
- `src/pages/api/recipes/[id].ts` (add auth check)
- `src/pages/api/recipes/import.ts` (add auth check)

**Services:**

- `src/lib/services/recipes/listRecipes.ts` (add userId param)
- `src/lib/services/recipes/getRecipeDetail.ts` (add userId param)
- `src/lib/services/recipes/createRecipe.ts` (add userId param)
- `src/lib/services/recipes/updateRecipe.ts` (add userId param)
- `src/lib/services/recipes/deleteRecipe.ts` (add userId param)
- `src/lib/services/recipes/createRecipeImport.ts` (add userId param)

---

## 7. DATA CONTRACTS

### 7.1 Authentication API Contracts

**POST /api/auth/register**

```typescript
Request: { email: string; password: string; }
Success: { success: true; user: User; session: Session; }
Error: { success: false; error: { code: string; message: string; fields?: Record<string, string>; } }
```

**POST /api/auth/login**

```typescript
Request: {
  email: string;
  password: string;
}
Success: {
  success: true;
  user: User;
  session: Session;
}
Error: {
  success: false;
  error: {
    code: string;
    message: string;
  }
}
```

**POST /api/auth/logout**

```typescript
Request: none;
Success: {
  success: true;
}
Error: {
  success: false;
  error: {
    code: string;
    message: string;
  }
}
```

**GET /api/auth/session**

```typescript
Request: none (session cookie)
Success: { authenticated: true; user: { id: string; email: string; } }
Alt: { authenticated: false; }
```

### 7.2 Modified Recipe API Contracts

**All recipe endpoints now require authentication:**

- Return 401 if no valid session
- Automatically filter results by authenticated user via RLS
- No changes to request/response schemas

---

## 8. CONCLUSION

This specification provides a complete blueprint for implementing email/password authentication in the 10x-recipes application. The architecture:

- **Meets all US-001 and US-002 acceptance criteria** from the PRD
- **Preserves all existing recipe functionality** without breaking changes
- **Leverages Supabase Auth** for security and reliability
- **Follows Astro SSR patterns** for optimal performance
- **Provides clear separation of concerns** between client and server
- **Includes comprehensive error handling** for all edge cases
- **Ensures data isolation** through RLS policies
- **Supports future enhancements** without requiring major refactoring

The implementation can proceed following the phased checklist, starting with backend foundation and building up to UI components and pages. All components, contracts, and integration points are clearly defined for straightforward implementation.
