# Expense Tracker - Frontend Data Models, Services & API Specification

> **Document Version**: 1.2
> **Date**: January 2025
> **Last Updated**: November 2025 (Added User Management Module with Role-Based Access)
> **Project**: Angular 19 Expense Tracker Application

---

## Table of Contents

1. [Overview](#overview)
2. [Data Models](#data-models)
3. [Service Architecture](#service-architecture)
4. [API Endpoints Specification](#api-endpoints-specification)
5. [Business Logic & Rules](#business-logic--rules)
6. [Data Flow Patterns](#data-flow-patterns)
7. [API Migration Strategy](#api-migration-strategy)
8. [Testing & Validation](#testing--validation)

---

## Overview

This document provides comprehensive documentation of the Expense Tracker frontend application's data models, service architecture, and API requirements. The application currently uses **localStorage** for data persistence with reactive BehaviorSubject streams. This specification defines the required backend API for full-stack implementation.

### Technology Stack

- **Frontend**: Angular 19 with standalone components
- **State Management**: RxJS BehaviorSubject streams
- **Current Storage**: Browser localStorage with JSON serialization
- **Target Backend**: RESTful API with JSON payloads
- **Currency**: Indian Rupee (INR) with `en-IN` locale formatting

### Key Features

- **User Authentication**: Secure signup and login with SHA256 password hashing
- **User Management**: Admin panel for managing users with role-based access control
- **Account Management**: Automatic balance calculation with transaction effects
- **Transaction Tracking**: Income, Expense, and Transfer operations
- **Category Organization**: Income and expense categorization
- **Budget Management**: Monthly budget tracking with real-time spending calculations
- **Financial Reminders**: Date-based notifications with customizable windows
- **Date Range Filtering**: Synchronized filtering across time-based pages
- **Reactive Data Synchronization**: BehaviorSubject-based state management
- **Advanced Form Validation**: Real-time async validation for username and email availability

---

## Data Models

### 0. User & Authentication Models

**Purpose**: User registration, authentication, and session management

#### User Model

```typescript
interface User {
  id: number;                  // Unique identifier (integer)
  username: string;            // Unique username (min 3 characters)
  email: string;               // Unique email address
  password: string;            // Hashed password (SHA256 with secret key)
  isAdmin: boolean;            // Admin/user role flag
  createdAt: Date;             // Account creation timestamp
  updatedAt: Date;             // Last modification timestamp
}
```

#### Authentication DTOs

**Signup Request**:
```typescript
interface SignupData {
  username: string;            // Min 3 characters, unique
  email: string;               // Valid email format, unique
  password: string;            // Min 7 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
  confirmPassword: string;     // Must match password
}
```

**Signup Response**:
```typescript
interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;  // User object without password
  token?: string;                  // JWT token (for API-based auth)
}
```

**Login Request**:
```typescript
interface LoginCredentials {
  usernameOrEmail: string;     // Accept either username or email
  password: string;            // Plain text password (hashed before comparison)
}
```

**Login Response**:
```typescript
interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;  // User object without password
  token?: string;                  // JWT token (for API-based auth)
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | number | Yes | Unique, Integer | Auto-generated on server |
| `username` | string | Yes | Min 3 chars, unique, alphanumeric | Case-sensitive |
| `email` | string | Yes | Valid email format, unique | Case-insensitive |
| `password` | string | Yes | Hashed (SHA256) | Never returned in responses |
| `isAdmin` | boolean | Yes | true/false | Role-based access control flag |
| `createdAt` | Date | Yes | ISO 8601 | Auto-generated on creation |
| `updatedAt` | Date | Yes | ISO 8601 | Auto-updated on modification |

**Password Requirements**:
- Minimum 7 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (!@#$%^&*)

**Business Rules**:
- Username must be unique (case-sensitive)
- Email must be unique (case-insensitive comparison)
- Passwords are hashed using SHA256 with secret key before storage
- Current implementation uses localStorage with keys:
  - `expense_tracker_users` - Array of all users
  - `expense_tracker_current_user` - Currently logged-in user
- Future API implementation will use JWT tokens for session management

---

### 1. Account Model

**Purpose**: Represents financial accounts (bank accounts, cash wallets, credit cards, etc.)

```typescript
interface Account {
  id: number;                  // Unique identifier (integer)
  name: string;                // Account name (e.g., "Salary Account", "Cash Wallet")
  initialAmount: number;       // Starting balance when account created
  currentBalance: number;      // Real-time calculated balance (auto-updated)
  icon: string;                // Icon identifier for UI display
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last modification timestamp
}
```

**Create Request DTO**:
```typescript
interface CreateAccountRequest {
  name: string;
  initialAmount: number;
  icon: string;
}
```

**Update Request DTO**:
```typescript
interface UpdateAccountRequest {
  id: number;
  name: string;
  initialAmount: number;
  icon: string;
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | number | Yes | Unique, Integer | Auto-generated on server |
| `name` | string | Yes | Max 100 chars | Account display name |
| `initialAmount` | number | Yes | >= 0 | Starting balance |
| `currentBalance` | number | Yes | Any number | Auto-calculated, not in requests |
| `icon` | string | Yes | Non-empty | Icon identifier |
| `createdAt` | Date | Yes | ISO 8601 | Auto-generated on creation |
| `updatedAt` | Date | Yes | ISO 8601 | Auto-updated on modification |

**Business Rules**:
- `currentBalance` is automatically calculated from transactions
- Initial balance sets the starting point: `currentBalance = initialAmount + sum(transaction_effects)`
- When updating `initialAmount`, recalculate balance: `newBalance = newInitialAmount + (oldBalance - oldInitialAmount)`
- Account is a **persistent entity** (no date filtering applied)

---

### 2. Category Model

**Purpose**: Categorizes transactions as income or expense types

```typescript
enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

interface Category {
  id: number;                  // Unique identifier (integer)
  name: string;                // Category name (e.g., "Salary", "Groceries", "Transport")
  type: CategoryType;          // Either 'income' or 'expense'
  icon: string;                // Icon identifier for UI display
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last modification timestamp
}
```

**Create Request DTO**:
```typescript
interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  icon: string;
}
```

**Update Request DTO**:
```typescript
interface UpdateCategoryRequest {
  id: number;
  name: string;
  type: CategoryType;
  icon: string;
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | number | Yes | Unique, Integer | Auto-generated on server |
| `name` | string | Yes | Max 100 chars | Category display name |
| `type` | CategoryType | Yes | 'income' \| 'expense' | Determines usage context |
| `icon` | string | Yes | Non-empty | Icon identifier |
| `createdAt` | Date | Yes | ISO 8601 | Auto-generated |
| `updatedAt` | Date | Yes | ISO 8601 | Auto-updated |

**Business Rules**:
- Categories are **persistent entities** (no date filtering)
- Can have multiple categories of same type
- Used for transaction categorization and budget planning
- Only expense categories can have budgets

---

### 3. Transaction Model

**Purpose**: Records financial transactions (income, expenses, transfers between accounts)

```typescript
enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

interface Transaction {
  id: number;                  // Unique identifier (integer)
  type: TransactionType;       // Transaction type
  amount: number;              // Transaction amount (always positive)
  date: Date;                  // Transaction date
  accountId: number;           // Source account ID (foreign key)
  categoryId?: number;         // Category ID (optional, not used for transfers)
  toAccountId?: number;        // Destination account ID (only for transfers)
  narration?: string;          // Optional description/notes
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last modification timestamp
}
```

**Create Request DTO**:
```typescript
interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: number;
  categoryId?: number;         // Required for INCOME/EXPENSE
  toAccountId?: number;        // Required for TRANSFER
  narration?: string;
}
```

**Update Request DTO**:
```typescript
interface UpdateTransactionRequest {
  id: number;
  type: TransactionType;
  amount: number;
  date: Date;
  accountId: number;
  categoryId?: number;
  toAccountId?: number;
  narration?: string;
}
```

**Field Requirements by Type**:

| Transaction Type | Required Fields | Optional Fields | Notes |
|-----------------|----------------|-----------------|-------|
| **INCOME** | type, amount, date, accountId, categoryId | narration | Adds to account balance |
| **EXPENSE** | type, amount, date, accountId, categoryId | narration | Subtracts from account balance |
| **TRANSFER** | type, amount, date, accountId, toAccountId | narration | Moves between accounts |

**Field Specifications**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | number | Yes | Unique, Integer | Auto-generated |
| `type` | TransactionType | Yes | Enum value | Determines effect on accounts |
| `amount` | number | Yes | > 0 | Always positive |
| `date` | Date | Yes | Valid date | Transaction date |
| `accountId` | number | Yes | Must exist | Source account reference |
| `categoryId` | number | Conditional | Must exist | Required for income/expense |
| `toAccountId` | number | Conditional | Must exist | Required for transfer |
| `narration` | string | No | Max 500 chars | Optional description |
| `createdAt` | Date | Yes | ISO 8601 | Auto-generated |
| `updatedAt` | Date | Yes | ISO 8601 | Auto-updated |

**Business Rules**:
- Amount is always stored as positive number
- Transaction effects on account balances:
  - **INCOME**: `accountBalance += amount`
  - **EXPENSE**: `accountBalance -= amount`
  - **TRANSFER**: `fromAccountBalance -= amount`, `toAccountBalance += amount`
- When updating transaction:
  1. Revert old transaction effects
  2. Apply new transaction effects
- When deleting transaction: revert transaction effects
- Transactions are **time-based entities** (date filtering applied)

---

### 4. Budget Model

**Purpose**: Monthly budget limits for expense categories with real-time spending tracking

```typescript
interface Budget {
  id: number;                  // Unique identifier (integer)
  categoryId: number;          // Category ID (foreign key, must be expense category)
  month: number;               // Month (1-12)
  year: number;                // Year (e.g., 2025)
  limit: number;               // Budget limit amount
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last modification timestamp
}

interface BudgetWithUsage extends Budget {
  categoryName: string;        // Computed: Category name
  categoryIcon: string;        // Computed: Category icon
  spent: number;               // Computed: Sum of expenses in month/year
  remaining: number;           // Computed: limit - spent
  percentageUsed: number;      // Computed: (spent / limit) * 100
}
```

**Create Request DTO**:
```typescript
interface CreateBudgetRequest {
  categoryId: number;
  month: number;               // 1-12
  year: number;                // e.g., 2025
  limit: number;
}
```

**Update Request DTO**:
```typescript
interface UpdateBudgetRequest {
  id: number;
  limit: number;               // Only limit is updatable
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | number | Yes | Unique, Integer | Auto-generated |
| `categoryId` | number | Yes | Must exist, must be expense | Foreign key |
| `month` | number | Yes | 1-12 | Calendar month |
| `year` | number | Yes | >= current year - 10 | Calendar year |
| `limit` | number | Yes | > 0 | Budget limit |
| `createdAt` | Date | Yes | ISO 8601 | Auto-generated |
| `updatedAt` | Date | Yes | ISO 8601 | Auto-updated |

**Computed Fields (BudgetWithUsage)**:

| Field | Type | Calculation | Notes |
|-------|------|------------|-------|
| `categoryName` | string | Join with Category | Display name |
| `categoryIcon` | string | Join with Category | Icon for UI |
| `spent` | number | SUM(expenses for category in month/year) | Real-time calculation |
| `remaining` | number | `limit - spent` | Can be negative |
| `percentageUsed` | number | `(spent / limit) * 100` | Progress indicator |

**Business Rules**:
- One budget per category per month/year (unique constraint)
- Only expense categories can have budgets
- Spent amount includes all expenses created before budget was set (historical data)
- Budget tracking is real-time (updated on transaction create/edit/delete)
- Budgets are **time-based** but use month/year granularity

---

### 5. Reminder Model

**Purpose**: Financial reminders with date-based notification windows

```typescript
interface Reminder {
  id: number;                  // Unique identifier (integer)
  title: string;               // Reminder title/description
  date: Date;                  // Target reminder date
  beforeDays: number;          // Show reminder X days before date
  afterDays: number;           // Show reminder X days after date
  isActive: boolean;           // Active/inactive status
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last modification timestamp
}
```

**Create Request DTO**:
```typescript
interface CreateReminderRequest {
  title: string;
  date: Date;
  beforeDays: number;
  afterDays: number;
  // isActive defaults to true on creation
}
```

**Update Request DTO**:
```typescript
interface UpdateReminderRequest {
  id: number;
  title: string;
  date: Date;
  beforeDays: number;
  afterDays: number;
  isActive: boolean;
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `id` | number | Yes | Unique, Integer | Auto-generated |
| `title` | string | Yes | Max 200 chars | Reminder description |
| `date` | Date | Yes | Valid date | Target reminder date |
| `beforeDays` | number | Yes | >= 0, <= 365 | Notification window start |
| `afterDays` | number | Yes | >= 0, <= 365 | Notification window end |
| `isActive` | boolean | Yes | true/false | Toggle active status |
| `createdAt` | Date | Yes | ISO 8601 | Auto-generated |
| `updatedAt` | Date | Yes | ISO 8601 | Auto-updated |

**Business Rules**:
- Reminder window: `(date - beforeDays)` to `(date + afterDays)`
- Dashboard displays only active reminders within window
- Reminders are **time-based entities** (date filtering applied)
- Status display logic:
  - **Today**: date equals current date
  - **Tomorrow**: date is 1 day away
  - **In X days**: date is X days in future
  - **Overdue**: current date > (date + afterDays)

---

### 6. Shared Models

**DateRange Interface** (DateRangeService):
```typescript
interface DateRange {
  fromDate: string;            // Format: 'YYYY-MM-DD'
  toDate: string;              // Format: 'YYYY-MM-DD'
}
```

**Dashboard Stats Interface**:
```typescript
interface DashboardStats {
  totalAccounts: number;
  totalCategories: number;
  totalTransactions: number;
  totalBalance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  netIncome: number;
}
```

---

## Service Architecture

### 0. AuthService

**Purpose**: User authentication, registration, and session management

**Current Implementation**: localStorage-based with SHA256 password hashing
**Future**: JWT-based API authentication

**File**: `src/app/services/auth.service.ts`

**Dependencies**:
- `crypto-js` for SHA256 password hashing
- `BehaviorSubject` for current user state management

**Key Methods**:

#### Authentication Operations
```typescript
signup(data: SignupData): AuthResponse
login(credentials: LoginCredentials): AuthResponse
logout(): void
isLoggedIn(): boolean
getCurrentUser(): Omit<User, 'password'> | null
```

#### Validation Operations
```typescript
isUsernameExists(username: string): boolean
isEmailExists(email: string): boolean
validatePasswordStrength(password: string): { valid: boolean; errors: string[] }
```

#### Internal Security Operations
```typescript
private hashPassword(password: string): string
private verifyPassword(plainPassword: string, hashedPassword: string): boolean
private generateId(): string
```

**Current User State**:
```typescript
private currentUserSubject = new BehaviorSubject<Omit<User, 'password'> | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();
```

**LocalStorage Keys**:
- `expense_tracker_users` - Array of all registered users (with hashed passwords)
- `expense_tracker_current_user` - Currently logged-in user object (without password)
- `expense_tracker_secret_key` - Secret key for password hashing (auto-generated)

**Security Implementation**:
1. **Password Hashing**: SHA256 with application-specific secret key
2. **Password Storage**: Only hashed passwords stored, never plain text
3. **Uniqueness Checks**: Real-time validation for username and email
4. **Session Management**: Current user stored in localStorage and BehaviorSubject

**Password Validation Rules**:
```typescript
{
  minLength: 7,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  allowedSpecialChars: '!@#$%^&*'
}
```

**Response Patterns**:

**Success Response**:
```typescript
{
  success: true,
  message: 'Registration successful',
  user: {
    id: '1234567890',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  message: 'Username already exists'
}
```

**Common Error Messages**:
- `"Username already exists"`
- `"Email already exists"`
- `"Invalid username or password"`
- `"Password does not meet requirements"`
- `"Passwords do not match"`

---

### 1. StorageService

**Purpose**: Central data management service with reactive streams

**Current Implementation**: localStorage-based
**Future**: HTTP-based API calls

**File**: `src/app/services/storage.service.ts`

**Reactive Streams**:
```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  // Observable streams for reactive UI updates
  accounts$: Observable<Account[]>
  categories$: Observable<Category[]>
  transactions$: Observable<Transaction[]>
  budgets$: Observable<Budget[]>
  reminders$: Observable<Reminder[]>
}
```

**Key Methods**:

#### Account Operations
```typescript
generateId(): number
getAccounts(): Account[]
saveAccount(account: Account): void
deleteAccount(id: number): void
updateAccountBalance(accountId: number, amount: number): void
```

#### Category Operations
```typescript
getCategories(): Category[]
saveCategory(category: Category): void
deleteCategory(id: number): void
```

#### Transaction Operations
```typescript
getTransactions(): Transaction[]
saveTransaction(transaction: Transaction): void
deleteTransaction(id: number): void
```

#### Budget Operations
```typescript
getBudgets(): Budget[]
saveBudget(budget: Budget): void
deleteBudget(id: number): void
```

#### Reminder Operations
```typescript
getReminders(): Reminder[]
saveReminder(reminder: Reminder): void
deleteReminder(id: number): void
```

#### Utility Operations
```typescript
clearAllData(): void
```

**Internal Methods** (Transaction Balance Logic):
```typescript
private applyTransactionEffect(transaction: Transaction): void
private revertTransactionEffect(transaction: Transaction): void
```

**Pattern Details**:

1. **BehaviorSubject Pattern**: All entities use BehaviorSubject for state management
2. **Automatic Updates**: Service methods automatically update streams
3. **Error Handling**: Try-catch blocks with console logging
4. **Date Handling**: Custom JSON parser for Date fields (`*At` fields and `date`)
5. **ID Generation**: `Date.now()` (returns integer timestamp in milliseconds)

---

### 2. DateRangeService

**Purpose**: Centralized date range state management for cross-page synchronization

**File**: `src/app/services/date-range.service.ts`

**Interface**:
```typescript
@Injectable({ providedIn: 'root' })
export class DateRangeService {
  dateRange$: Observable<DateRange>

  updateDateRange(dateRange: DateRange): void
  getCurrentDateRange(): DateRange
}
```

**Initial State**: Current month (first day to last day)

**Usage Pattern**:
```typescript
// Subscribe to changes
this.dateRangeService.dateRange$.subscribe(range => {
  this.filterData(range);
});

// Update date range
this.dateRangeService.updateDateRange({
  fromDate: '2025-01-01',
  toDate: '2025-01-31'
});
```

**Date Format**: `YYYY-MM-DD` (HTML date input compatible)

**Applied To**: Dashboard, Transactions, Reminders pages
**NOT Applied To**: Accounts, Categories pages (persistent entities)

---

### 3. Dialog Services

**DialogService** (Angular CDK Dialog):
```typescript
@Injectable({ providedIn: 'root' })
export class DialogService {
  // Opens dialogs with consistent configuration
  // Handles result returns via DialogResult interface
}
```

**DialogResult Interface**:
```typescript
interface DialogResult {
  success?: boolean;
  data?: any;
}
```

---

## API Endpoints Specification

### Base Configuration

**Base URL**: `/api/v1`
**Authentication**: JWT Bearer token (future implementation)
**Content-Type**: `application/json`
**Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

---

### 0. Authentication Endpoints

#### POST /api/v1/auth/signup
Register a new user account

**Request Body**: `SignupData`
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecureP@ss123",
  "confirmPassword": "SecureP@ss123"
}
```

**Response**: `AuthResponse` (201 Created)
```json
{
  "success": true,
  "message": "Registration successful. Please login to continue.",
  "user": {
    "id": "1704096000000",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules**:
- Username: Minimum 3 characters, unique (case-sensitive)
- Email: Valid email format, unique (case-insensitive)
- Password: Minimum 7 characters with complexity requirements
- ConfirmPassword: Must match password field

**Error Responses**:

**400 Bad Request** - Validation Error:
```json
{
  "success": false,
  "message": "Username already exists"
}
```

**422 Unprocessable Entity** - Password Requirements:
```json
{
  "success": false,
  "message": "Password does not meet requirements",
  "errors": [
    "At least 1 uppercase letter required",
    "At least 1 special character required (!@#$%^&*)"
  ]
}
```

**Business Logic**:
1. Validate all fields (required, format, constraints)
2. Check username uniqueness (case-sensitive)
3. Check email uniqueness (case-insensitive)
4. Validate password strength
5. Verify password confirmation matches
6. Hash password using SHA256 with secret key
7. Generate unique user ID
8. Set timestamps (createdAt, updatedAt)
9. Store user in database
10. Generate JWT token (if using API-based auth)
11. Return user object (without password) and token

---

#### POST /api/v1/auth/login
Authenticate existing user

**Request Body**: `LoginCredentials`
```json
{
  "usernameOrEmail": "johndoe",
  "password": "SecureP@ss123"
}
```

**Alternative with Email**:
```json
{
  "usernameOrEmail": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Response**: `AuthResponse` (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "1704096000000",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:

**401 Unauthorized** - Invalid Credentials:
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

**Business Logic**:
1. Accept username OR email in single field
2. Search user by username first (case-sensitive)
3. If not found, search by email (case-insensitive)
4. Verify password hash matches stored hash
5. Generate JWT token with user ID and expiration
6. Return user object (without password) and token

**Security Notes**:
- Never reveal which field (username/email) was incorrect
- Use generic "Invalid username or password" message
- Implement rate limiting to prevent brute force attacks
- Hash passwords using SHA256 with application secret key
- JWT token should include: userId, username, issued time, expiration time

---

#### POST /api/v1/auth/logout
Logout current user (client-side token removal)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response**: (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Business Logic**:
- For localStorage implementation: Clear current user from storage
- For JWT implementation: Client removes token (server can blacklist if needed)
- Clear any cached user data
- Redirect to login page

---

#### GET /api/v1/auth/me
Get current authenticated user details

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response**: (200 OK)
```json
{
  "id": "1704096000000",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Business Logic**:
- Verify JWT token is valid
- Extract user ID from token
- Fetch user from database
- Return user object without password

---

#### POST /api/v1/auth/validate-username
Check if username is available (for real-time validation)

**Request Body**:
```json
{
  "username": "johndoe"
}
```

**Response**: (200 OK)
```json
{
  "available": false,
  "message": "Username already exists"
}
```

**Or if available**:
```json
{
  "available": true,
  "message": "Username is available"
}
```

**Business Logic**:
- Perform case-sensitive username lookup
- Return availability status
- Used for real-time form validation in signup page

---

#### POST /api/v1/auth/validate-email
Check if email is available (for real-time validation)

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response**: (200 OK)
```json
{
  "available": false,
  "message": "Email already exists"
}
```

**Or if available**:
```json
{
  "available": true,
  "message": "Email is available"
}
```

**Business Logic**:
- Perform case-insensitive email lookup
- Return availability status
- Used for real-time form validation in signup page

---

### 0.1 User Management Endpoints

#### GET /api/v1/users
Get all users (Admin only)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response**: `User[]` (without password field)

**Example Response**:
```json
[
  {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com",
    "isAdmin": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Business Logic**:
- Verify requesting user has admin privileges
- Return all users without password field
- Sort by username ascending

---

#### GET /api/v1/users/:id
Get user by ID (Admin only or own profile)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response**: `User` (without password field)

**Business Logic**:
- Admin can view any user
- Non-admin can only view their own profile
- Return 403 Forbidden if unauthorized

---

#### POST /api/v1/users
Create new user (Admin only)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: `CreateUserRequest`
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecureP@ss123",
  "isAdmin": false
}
```

**Response**: `User` (201 Created, without password)

**Validation**:
- Username: Min 3 characters, unique (case-sensitive)
- Email: Valid format, unique (case-insensitive)
- Password: Min 7 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- isAdmin: Boolean value

**Business Logic**:
1. Verify requesting user is admin
2. Validate all fields
3. Check username uniqueness
4. Check email uniqueness
5. Validate password strength
6. Hash password using SHA256
7. Generate unique ID
8. Set timestamps
9. Store user
10. Return user without password

---

#### PUT /api/v1/users/:id
Update existing user (Admin only or own profile)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: `UpdateUserRequest`
```json
{
  "id": 123,
  "username": "updateduser",
  "email": "updated@example.com",
  "password": "NewP@ss123",
  "isAdmin": true
}
```

**Response**: `User` (200 OK, without password)

**Business Logic**:
- Admin can update any user including isAdmin flag
- Non-admin can only update their own profile (except isAdmin)
- Password field is optional (only update if provided)
- If password provided, validate strength and hash before storing
- Check username/email uniqueness (excluding current user)
- Update timestamp

---

#### DELETE /api/v1/users/:id
Delete user (Admin only)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Response**: `{ success: boolean }` (200 OK)

**Business Logic**:
- Only admin can delete users
- Cannot delete own account
- Consider cascade delete or reassign user data
- Recommended: Soft delete (isDeleted flag) for data integrity

---

#### POST /api/v1/users/check-username
Check username availability (for user management validation)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "username": "testuser",
  "excludeUserId": 123
}
```

**Response**: (200 OK)
```json
{
  "isAvailable": false,
  "message": "Username already exists"
}
```

**Business Logic**:
- Perform case-sensitive username lookup
- Exclude specified user ID (for edit mode)
- Return availability status
- Used for real-time form validation in user dialog

---

#### POST /api/v1/users/check-email
Check email availability (for user management validation)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "email": "test@example.com",
  "excludeUserId": 123
}
```

**Response**: (200 OK)
```json
{
  "isAvailable": true,
  "message": "Email is available"
}
```

**Business Logic**:
- Perform case-insensitive email lookup
- Exclude specified user ID (for edit mode)
- Return availability status
- Used for real-time form validation in user dialog

---

### 1. Account Endpoints

#### GET /api/v1/accounts
Get all accounts for authenticated user

**Request**: None
**Response**: `Account[]`

**Example Response**:
```json
[
  {
    "id": 123,
    "name": "Salary Account",
    "initialAmount": 50000,
    "currentBalance": 67500,
    "icon": "bank",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

#### POST /api/v1/accounts
Create new account

**Request Body**: `CreateAccountRequest`
```json
{
  "name": "Salary Account",
  "initialAmount": 50000,
  "icon": "bank"
}
```

**Response**: `Account` (201 Created)
```json
{
  "id": 123,
  "name": "Salary Account",
  "initialAmount": 50000,
  "currentBalance": 50000,
  "icon": "bank",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Business Logic**:
- Generate unique ID
- Set `currentBalance = initialAmount` initially
- Set timestamps (createdAt, updatedAt)

---

#### PUT /api/v1/accounts/:id
Update existing account

**Request Body**: `UpdateAccountRequest`
```json
{
  "id": 123,
  "name": "Updated Account Name",
  "initialAmount": 60000,
  "icon": "wallet"
}
```

**Response**: `Account` (200 OK)

**Business Logic**:
- When updating `initialAmount`:
  ```
  newCurrentBalance = newInitialAmount + (oldCurrentBalance - oldInitialAmount)
  ```
- Update `updatedAt` timestamp

---

#### DELETE /api/v1/accounts/:id
Delete account

**Response**: `{ success: boolean }` (200 OK)

**Business Logic**:
- Consider cascade delete or prevent if transactions exist
- Recommended: Soft delete (isDeleted flag) for data integrity

---

### 2. Category Endpoints

#### GET /api/v1/categories
Get all categories

**Query Parameters**:
- `type` (optional): Filter by 'income' or 'expense'

**Response**: `Category[]`

**Example**: `GET /api/v1/categories?type=expense`

---

#### POST /api/v1/categories
Create new category

**Request Body**: `CreateCategoryRequest`
```json
{
  "name": "Groceries",
  "type": "expense",
  "icon": "shopping-cart"
}
```

**Response**: `Category` (201 Created)

---

#### PUT /api/v1/categories/:id
Update existing category

**Request Body**: `UpdateCategoryRequest`

**Response**: `Category` (200 OK)

---

#### DELETE /api/v1/categories/:id
Delete category

**Response**: `{ success: boolean }` (200 OK)

**Business Logic**: Prevent deletion if budgets or transactions exist

---

### 3. Transaction Endpoints

#### GET /api/v1/transactions
Get transactions with optional filtering

**Query Parameters**:
- `fromDate` (optional): ISO date string (e.g., "2025-01-01")
- `toDate` (optional): ISO date string (e.g., "2025-01-31")
- `accountId` (optional): Filter by account
- `categoryId` (optional): Filter by category
- `type` (optional): Filter by type ('income', 'expense', 'transfer')
- `limit` (optional): Pagination limit (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (default: 'date')
- `order` (optional): Sort order ('asc' or 'desc', default: 'desc')

**Response**: `Transaction[]`

**Example**: `GET /api/v1/transactions?fromDate=2025-01-01&toDate=2025-01-31&type=expense`

**Date Filtering Logic**:
- End date should be inclusive: set time to 23:59:59.999
- Default to current month if no dates provided

---

#### POST /api/v1/transactions
Create new transaction

**Request Body**: `CreateTransactionRequest`

**Income Example**:
```json
{
  "type": "income",
  "amount": 5000,
  "date": "2025-01-15T00:00:00.000Z",
  "accountId": 123,
  "categoryId": 456,
  "narration": "Monthly salary"
}
```

**Transfer Example**:
```json
{
  "type": "transfer",
  "amount": 1000,
  "date": "2025-01-15T00:00:00.000Z",
  "accountId": 123,
  "toAccountId": 789,
  "narration": "Transfer to savings"
}
```

**Response**: `Transaction` (201 Created)

**Business Logic**:
1. Validate account existence
2. Validate category exists (for income/expense)
3. Validate toAccount exists (for transfer)
4. Apply transaction effects to account balances:
   - Income: `accountBalance += amount`
   - Expense: `accountBalance -= amount`
   - Transfer: `fromAccountBalance -= amount`, `toAccountBalance += amount`
5. Set timestamps

---

#### PUT /api/v1/transactions/:id
Update existing transaction

**Request Body**: `UpdateTransactionRequest`

**Response**: `Transaction` (200 OK)

**Business Logic**:
1. Get old transaction
2. Revert old transaction effects on account balances
3. Apply new transaction effects
4. Handle transaction type changes
5. Update timestamp

---

#### DELETE /api/v1/transactions/:id
Delete transaction

**Response**: `{ success: boolean }` (200 OK)

**Business Logic**:
1. Get transaction
2. Revert transaction effects on account balance(s)
3. Delete transaction

---

### 4. Budget Endpoints

#### GET /api/v1/budgets
Get budgets with optional filtering and computed usage data

**Query Parameters**:
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year (e.g., 2025)
- `includeUsage` (optional): Include computed fields (default: true)

**Response**: `BudgetWithUsage[]`

**Example Response**:
```json
[
  {
    "id": 123,
    "categoryId": 456,
    "month": 1,
    "year": 2025,
    "limit": 10000,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "categoryName": "Groceries",
    "categoryIcon": "shopping-cart",
    "spent": 7500,
    "remaining": 2500,
    "percentageUsed": 75
  }
]
```

**Spent Calculation Logic**:
```sql
SELECT SUM(amount) as spent
FROM transactions
WHERE categoryId = :categoryId
  AND type = 'expense'
  AND MONTH(date) = :month
  AND YEAR(date) = :year
```

**Computed Fields**:
```javascript
spent = SUM(expenses for category in month/year)
remaining = limit - spent
percentageUsed = (spent / limit) * 100
```

---

#### POST /api/v1/budgets
Create new budget

**Request Body**: `CreateBudgetRequest`
```json
{
  "categoryId": 456,
  "month": 1,
  "year": 2025,
  "limit": 10000
}
```

**Response**: `Budget` (201 Created)

**Business Logic**:
- Validate category exists and is expense type
- Prevent duplicate budgets (same category + month + year)
- Return 409 Conflict if duplicate exists

---

#### PUT /api/v1/budgets/:id
Update budget limit

**Request Body**: `UpdateBudgetRequest`
```json
{
  "id": 123,
  "limit": 12000
}
```

**Response**: `Budget` (200 OK)

**Note**: Only limit is updatable; month/year/category cannot be changed

---

#### DELETE /api/v1/budgets/:id
Delete budget

**Response**: `{ success: boolean }` (200 OK)

---

### 5. Reminder Endpoints

#### GET /api/v1/reminders
Get reminders with optional filtering

**Query Parameters**:
- `fromDate` (optional): ISO date string
- `toDate` (optional): ISO date string
- `isActive` (optional): Filter by active status (true/false)
- `limit` (optional): Pagination limit
- `offset` (optional): Pagination offset

**Response**: `Reminder[]`

---

#### GET /api/v1/reminders/upcoming
Get upcoming reminders for dashboard widget

**Query Parameters**:
- `limit` (optional): Max number of reminders (default: 10)

**Response**: Extended reminder objects with computed properties

**Example Response**:
```json
[
  {
    "id": 123,
    "title": "Pay electricity bill",
    "date": "2025-01-20T00:00:00.000Z",
    "beforeDays": 3,
    "afterDays": 2,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "daysUntil": 5,
    "status": "upcoming"
  }
]
```

**Filter Logic**:
```javascript
currentDate >= (reminderDate - beforeDays) AND
currentDate <= (reminderDate + afterDays) AND
isActive = true
```

**Sort**: By date ascending (closest first)

---

#### POST /api/v1/reminders
Create new reminder

**Request Body**: `CreateReminderRequest`
```json
{
  "title": "Pay rent",
  "date": "2025-02-01T00:00:00.000Z",
  "beforeDays": 5,
  "afterDays": 0
}
```

**Response**: `Reminder` (201 Created)

**Business Logic**: Set `isActive = true` by default

---

#### PUT /api/v1/reminders/:id
Update existing reminder

**Request Body**: `UpdateReminderRequest`

**Response**: `Reminder` (200 OK)

---

#### DELETE /api/v1/reminders/:id
Delete reminder

**Response**: `{ success: boolean }` (200 OK)

---

### 6. Dashboard/Analytics Endpoints

#### GET /api/v1/dashboard/stats
Get dashboard statistics

**Query Parameters**:
- `fromDate` (optional): ISO date string
- `toDate` (optional): ISO date string

**Response**:
```json
{
  "totalAccounts": 3,
  "totalCategories": 12,
  "totalTransactions": 45,
  "totalBalance": 67500,
  "thisMonthIncome": 50000,
  "thisMonthExpenses": 35000,
  "netIncome": 15000
}
```

**Calculation Logic**:
```javascript
totalBalance = SUM(accounts.currentBalance)
thisMonthIncome = SUM(transactions.amount WHERE type='income' AND date in range)
thisMonthExpenses = SUM(transactions.amount WHERE type='expense' AND date in range)
netIncome = thisMonthIncome - thisMonthExpenses
```

---

#### GET /api/v1/dashboard/category-breakdown
Get expense breakdown by category

**Query Parameters**:
- `fromDate` (optional): ISO date string
- `toDate` (optional): ISO date string

**Response**:
```json
[
  {
    "categoryId": 123,
    "categoryName": "Food",
    "categoryIcon": "food",
    "totalAmount": 8500,
    "percentage": 24.3,
    "transactionCount": 15
  }
]
```

**Calculation Logic**:
```sql
SELECT
  categoryId,
  SUM(amount) as totalAmount,
  COUNT(*) as transactionCount,
  (SUM(amount) / total_expenses) * 100 as percentage
FROM transactions
WHERE type = 'expense'
  AND date BETWEEN :fromDate AND :toDate
GROUP BY categoryId
ORDER BY totalAmount DESC
```

---

#### GET /api/v1/dashboard/charts
Get chart data for dashboard visualizations

**Query Parameters**:
- `fromDate` (optional): ISO date string
- `toDate` (optional): ISO date string
- `chartType` (optional): 'income-expense' | 'category-wise'

**Response** (Income vs Expense by period):
```json
{
  "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "datasets": [
    {
      "label": "Income",
      "data": [12000, 15000, 10000, 13000]
    },
    {
      "label": "Expense",
      "data": [8000, 9500, 7500, 10000]
    }
  ]
}
```

---

## Business Logic & Rules

### 1. Transaction Balance Effects

**Effect Application**:

```javascript
function applyTransactionEffect(transaction) {
  switch (transaction.type) {
    case 'income':
      account.currentBalance += transaction.amount;
      break;
    case 'expense':
      account.currentBalance -= transaction.amount;
      break;
    case 'transfer':
      fromAccount.currentBalance -= transaction.amount;
      toAccount.currentBalance += transaction.amount;
      break;
  }
}
```

**Effect Reversion** (for updates/deletes):

```javascript
function revertTransactionEffect(transaction) {
  // Apply opposite effect
  switch (transaction.type) {
    case 'income':
      account.currentBalance -= transaction.amount;
      break;
    case 'expense':
      account.currentBalance += transaction.amount;
      break;
    case 'transfer':
      fromAccount.currentBalance += transaction.amount;
      toAccount.currentBalance -= transaction.amount;
      break;
  }
}
```

**Update Transaction Logic**:
```javascript
1. Get old transaction
2. revertTransactionEffect(oldTransaction)
3. Update transaction data
4. applyTransactionEffect(newTransaction)
5. Update timestamps
```

---

### 2. Budget Tracking Logic

**Real-time Spent Calculation**:
```javascript
function calculateBudgetSpent(categoryId, month, year) {
  return transactions
    .filter(t =>
      t.categoryId === categoryId &&
      t.type === 'expense' &&
      t.date.getMonth() + 1 === month &&
      t.date.getFullYear() === year
    )
    .reduce((sum, t) => sum + t.amount, 0);
}
```

**Budget Status Logic**:
```javascript
function getBudgetStatus(spent, limit) {
  const percentage = (spent / limit) * 100;

  if (spent >= limit) {
    return { status: 'exceeded', color: 'red' };
  } else if (percentage >= 80) {
    return { status: 'warning', color: 'orange' };
  } else {
    return { status: 'on-track', color: 'green' };
  }
}
```

---

### 3. Date Range Filtering

**Inclusive Date Logic**:
```javascript
function applyDateRangeFilter(items, fromDate, toDate) {
  // Ensure end date includes entire day
  const endDate = new Date(toDate);
  endDate.setHours(23, 59, 59, 999);

  return items.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(fromDate) && itemDate <= endDate;
  });
}
```

**Default Date Range** (Current Month):
```javascript
function getCurrentMonthRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fromDate: formatDate(firstDay),  // 'YYYY-MM-DD'
    toDate: formatDate(lastDay)
  };
}
```

---

### 4. Entity Relationships

**Database Schema Relationships**:

```
Account (1) ──< (N) Transaction
  - accountId references Account.id
  - toAccountId references Account.id (for transfers)

Category (1) ──< (N) Transaction
  - categoryId references Category.id

Category (1) ──< (N) Budget
  - categoryId references Category.id
  - Only expense categories can have budgets

User (1) ──< (N) Account
User (1) ──< (N) Category
User (1) ──< (N) Transaction
User (1) ──< (N) Budget
User (1) ──< (N) Reminder
```

**Foreign Key Constraints**:
- All `*Id` fields are foreign keys
- Enforce referential integrity
- Consider cascade behavior for deletes

---

### 5. Data Validation Rules

#### Account Validation
```javascript
{
  name: { required: true, maxLength: 100 },
  initialAmount: { required: true, min: 0, type: 'number' },
  icon: { required: true, notEmpty: true }
}
```

#### Category Validation
```javascript
{
  name: { required: true, maxLength: 100 },
  type: { required: true, enum: ['income', 'expense'] },
  icon: { required: true, notEmpty: true }
}
```

#### Transaction Validation
```javascript
{
  type: { required: true, enum: ['income', 'expense', 'transfer'] },
  amount: { required: true, min: 0.01, type: 'number' },
  date: { required: true, validDate: true },
  accountId: { required: true, exists: 'accounts' },
  categoryId: {
    requiredIf: (data) => ['income', 'expense'].includes(data.type),
    exists: 'categories'
  },
  toAccountId: {
    requiredIf: (data) => data.type === 'transfer',
    exists: 'accounts',
    notSameAs: 'accountId'
  },
  narration: { optional: true, maxLength: 500 }
}
```

#### Budget Validation
```javascript
{
  categoryId: {
    required: true,
    exists: 'categories',
    categoryType: 'expense'
  },
  month: { required: true, min: 1, max: 12, type: 'integer' },
  year: { required: true, min: 2020, max: 2100, type: 'integer' },
  limit: { required: true, min: 1, type: 'number' },
  unique: ['categoryId', 'month', 'year']
}
```

#### Reminder Validation
```javascript
{
  title: { required: true, maxLength: 200 },
  date: { required: true, validDate: true },
  beforeDays: { required: true, min: 0, max: 365, type: 'integer' },
  afterDays: { required: true, min: 0, max: 365, type: 'integer' }
}
```

---

## Data Flow Patterns

### 1. Frontend Reactive Pattern

**Current Implementation**:

```typescript
// Service Layer (StorageService)
private accountsSubject = new BehaviorSubject<Account[]>([]);
public accounts$ = this.accountsSubject.asObservable();

saveAccount(account: Account): void {
  // Save to localStorage
  const accounts = this.getAccounts();
  // ... update logic
  this.accountsSubject.next(accounts);  // Trigger UI updates
}

// Component Layer
export class AccountsComponent implements OnInit {
  accounts: Account[] = [];

  ngOnInit() {
    this.storageService.accounts$.subscribe(accounts => {
      this.accounts = accounts;  // Automatic UI update
    });
  }
}
```

**Future API Pattern**:

```typescript
// API Service Layer
export class AccountApiService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  public accounts$ = this.accountsSubject.asObservable();

  loadAccounts(): void {
    this.http.get<Account[]>('/api/v1/accounts').subscribe(
      accounts => this.accountsSubject.next(accounts)
    );
  }

  createAccount(data: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>('/api/v1/accounts', data).pipe(
      tap(() => this.loadAccounts())  // Refresh list
    );
  }
}
```

---

### 2. Date Range Synchronization Pattern

**Implementation**:

```typescript
// Service maintains shared state
export class DateRangeService {
  private dateRangeSubject = new BehaviorSubject<DateRange>(initialRange);
  public dateRange$ = this.dateRangeSubject.asObservable();
}

// Pages subscribe and update
export class DashboardComponent {
  ngOnInit() {
    // Listen for external changes
    this.dateRangeService.dateRange$.subscribe(range => {
      this.dateRangeForm.patchValue(range, { emitEvent: false });
      this.filterData(range);
    });

    // Publish local changes
    this.dateRangeForm.valueChanges.subscribe(value => {
      this.dateRangeService.updateDateRange(value);
    });
  }
}
```

**Key Points**:
- Use `{ emitEvent: false }` to prevent infinite loops
- Date range persists across page navigation
- Only time-based pages participate in synchronization

---

### 3. Transaction Effect Cascade

**Create Transaction Flow**:

```
1. User submits transaction form
2. Component calls StorageService.saveTransaction()
3. Service saves transaction to storage
4. Service calls applyTransactionEffect()
   - Updates account balance(s)
   - Saves updated accounts
   - Triggers accounts$ stream update
5. Service triggers transactions$ stream update
6. UI automatically updates:
   - Transaction list
   - Account balances
   - Dashboard stats
   - Budget spent amounts
```

**Update Transaction Flow**:

```
1. User edits transaction
2. Service calls saveTransaction() with existing ID
3. Service finds old transaction
4. Service calls revertTransactionEffect(oldTransaction)
   - Reverts old balance changes
5. Service updates transaction data
6. Service calls applyTransactionEffect(newTransaction)
   - Applies new balance changes
7. All streams update, UI refreshes
```

---

### 4. Budget Real-time Tracking

**Flow**:

```
Transaction Created/Updated/Deleted
       ↓
Check if transaction.type === 'expense'
       ↓
Find budgets for transaction.categoryId + month + year
       ↓
Recalculate spent amount
       ↓
Update BudgetWithUsage computed fields
       ↓
UI updates budget cards with:
  - New spent amount
  - Updated remaining
  - New percentage used
  - Status color change if threshold crossed
```

---

## API Migration Strategy

**Recommended Approach**:
1. Create API service layer alongside existing StorageService with identical interfaces
2. Implement data export/import endpoints (POST /api/v1/import, GET /api/v1/export)
3. Add authentication (JWT-based user registration/login)
4. Migrate existing localStorage data to backend
5. Switch to API-based storage

**Future Enhancements**:
- Pagination and sorting for list endpoints
- Full-text search capabilities
- Bulk operations for batch create/update/delete
- Multi-currency support with exchange rates
- File attachments for receipts
- Flexible tagging system
- Recurring transaction auto-generation

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., budget) |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Server Error | Unexpected server error |

---

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0",
        "value": -100
      },
      {
        "field": "accountId",
        "message": "Account does not exist",
        "value": "invalid_id"
      }
    ]
  }
}
```

---

### Frontend Error Handling

```typescript
this.apiService.createTransaction(data).subscribe({
  next: (transaction) => {
    // Success handling
    this.showSuccessMessage('Transaction created');
  },
  error: (error) => {
    if (error.status === 400) {
      // Validation errors
      this.showValidationErrors(error.error.details);
    } else if (error.status === 401) {
      // Redirect to login
      this.router.navigate(['/login']);
    } else {
      // Generic error
      this.showErrorMessage('Failed to create transaction');
    }
  }
});
```

---

## Security Considerations

### Authentication & Authorization
- JWT Bearer token authentication for all API requests
- User isolation: All queries filtered by authenticated user ID
- Authorization header format: `Bearer ${token}`

### Data Validation & Security
- Server-side validation (never trust client data)
- Parameterized queries (prevent SQL injection)
- Input sanitization (prevent XSS attacks)
- Type checking against model definitions

### Rate Limiting & Privacy
- Rate limits on endpoints (e.g., 100 req/hour for transactions)
- HTTPS only for all communications
- Encryption at rest for sensitive data
- CORS policies and audit logging

---

## Performance Optimization

### Database Optimization
- **Indexing**: Create indexes on frequently queried fields (date, accountId, categoryId, userId)
- **Composite Indexes**: transactions(userId, date), budgets(categoryId, month, year)
- **Database Views**: Use views for complex aggregate queries (dashboard stats)
- **Pagination**: Always limit query results (default 50, max 100)

### Caching Strategy
- **Redis Caching**: Cache rarely-changing data (categories, accounts) with TTL
- **Cache Invalidation**: Clear cache on entity updates
- **ETags**: Support conditional requests with If-None-Match headers
- **Frontend Caching**: Store API responses in memory with expiration

### Frontend Optimization
- Lazy loading with route-based code splitting (implemented)
- Virtual scrolling for large transaction lists (implemented)
- Debouncing for search and filter inputs (implemented)
- In-memory response caching with expiration

---

## Conclusion

This comprehensive specification provides everything needed to implement a backend API for the Expense Tracker application. The frontend is already structured with:

✅ **User Authentication Module** with secure signup/login functionality
✅ **User Management System** with admin panel and role-based access control
✅ **Well-defined data models** with complete DTOs for all entities
✅ **Reactive service patterns** ready for API integration
✅ **Consistent business logic** documented and tested
✅ **Clear separation of concerns** for easy migration
✅ **Password Security** with SHA256 hashing and validation
✅ **Real-time Form Validation** for authentication and user management fields
✅ **Advanced Async Validation** for username and email availability checking

### Next Steps

1. **Backend Setup**: Choose technology stack (.NET Core web api, Node.js, etc.)
2. **Database Schema**: Create tables based on models with proper relationships
   - User table with hashed password storage
   - Account, Category, Transaction, Budget, Reminder tables
   - Foreign key relationships (userId, accountId, categoryId)
3. **Authentication Implementation**:
   - Implement JWT-based authentication endpoints
   - Password hashing with bcrypt or SHA256
   - Token generation and validation
   - Rate limiting for login attempts
4. **API Implementation**: Implement all CRUD endpoints following this specification
5. **Testing**: Write comprehensive tests for all endpoints including authentication flow
6. **Frontend Migration**: Switch from localStorage to API service layer
7. **Data Migration**: Export localStorage data and import to backend database
8. **Deployment**: Deploy backend API and update frontend configuration

### Authentication & User Management Status

✅ **Completed Features**:
- User registration with validation
- Login with username OR email
- Password strength requirements
- Real-time uniqueness checks
- SHA256 password hashing
- Session management via localStorage
- Responsive UI with modern design
- Admin panel for user management
- Role-based access control (isAdmin flag)
- User CRUD operations (create, read, update, delete)
- Advanced form validation with custom validators
- Real-time async username/email availability checking
- Password optional in edit mode
- Loading states during data fetch and validation

🚧 **Pending for Backend Integration**:
- JWT token generation and validation
- Token-based session management
- Authorization middleware for admin-only endpoints
- Password reset functionality
- Email verification
- Multi-factor authentication (optional)
- OAuth integration (optional)
- User activity audit logging

---

**Document Maintained By**: Development Team
**Last Updated**: November 2025
**Version**: 1.2 (Added User Management Module with Role-Based Access)
