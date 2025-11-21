# Angular Expense Tracker - Project Guide

Modern Angular 19 expense tracking application with comprehensive financial management capabilities including account management, transaction tracking, categorization, analytics, budget management, and reminders.

## Project Structure and Architecture

### Core Architecture Pattern
- **Framework**: Angular 19 with standalone components (no NgModules)
- **Module Organization**: Feature-based structure with lazy-loaded routes
- **Component Pattern**: Standalone components with inline templates and styles
- **State Management**: Service-based reactive patterns using BehaviorSubject
- **Data Persistence**: Full Backend REST API integration - All entities (Accounts, Categories, Reminders, Transactions, Budgets, Users) backed by backend API
- **Backend Integration**: HTTP communication via dedicated API service layer
- **Navigation**: Route-based lazy loading with dynamic imports

### Directory Structure
```
src/app/
├── models/           # Data entities and DTOs with barrel exports
├── services/         # Business logic, state management, API services
├── pages/           # Feature pages (dashboard, accounts, categories, transactions, budget, reminders, user-management, user-profile, auth/login, auth/signup)
├── shared/          # Reusable components (data-table, dialogs, page-header, icon-selector)
├── guards/          # Route guards (auth.guard.ts for authentication protection)
├── interceptors/    # HTTP interceptors (auth.interceptor.ts for JWT token management)
├── app.component.*  # Root component with navigation sidebar and logout functionality
├── app.config.ts    # Application configuration (includes HttpClient provider and interceptors)
└── app.routes.ts    # Route definitions with lazy loading and guards

src/environments/
├── environment.ts      # Development environment config (API URL: https://localhost:44319)
└── environment.prod.ts # Production environment config
```

### Component Architecture
- **Standalone Components**: All use `standalone: true` with explicit imports
- **Template Approach**: Inline templates with Angular's modern control flow (@if, @for, @switch)
- **Communication**: Parent-child via @Input/@Output, cross-component via services
- **Lifecycle**: OnInit for initialization, OnDestroy for cleanup with subscription management

## Coding Style and Naming Conventions

### File Naming
- **Components**: `component-name.component.ts` (kebab-case)
- **Services**: `service-name.service.ts` (kebab-case)
- **Models**: `entity-name.model.ts` (kebab-case)
- **Barrel Exports**: `index.ts` for clean imports
- **Route Paths**: kebab-case URLs matching component names

### TypeScript Naming
- **Classes**: PascalCase (`AccountDialogComponent`, `StorageService`)
- **Properties/Methods**: camelCase (`currentBalance`, `generateId`)
- **Interfaces**: PascalCase (`Transaction`, `TableColumn`)
- **Enums**: PascalCase with UPPER_CASE values (`TransactionType.INCOME`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEYS`)

### Component Selector Pattern
- **Prefix**: All components use 'app-' prefix
- **Format**: kebab-case (`app-data-table`, `app-account-dialog`)

### Service Injection Pattern
- **Root Level**: All services use `providedIn: 'root'`
- **Constructor Injection**: Private readonly for injected dependencies
- **Service Names**: Descriptive with 'Service' suffix

## Tech Stack and Dependencies

### Core Angular Framework
- **Angular**: v19.2.0 (latest with modern features)
- **Angular CLI**: v19.2.16 (build system and tooling)
- **Angular CDK**: v19.2.19 (dialog components and utilities)
- **Angular HTTP Client**: Built-in HTTP module with fetch API support
- **TypeScript**: v5.7.2 (strict mode enabled)
- **RxJS**: v7.8.0 (reactive programming)

### Build and Development Tools
- **Build Target**: ES2022 (modern JavaScript features)
- **Style Preprocessor**: SCSS with inline component styles
- **Testing**: Karma + Jasmine framework
- **Bundle Budgets**: 500kB warning, 1MB error for initial bundle

### External Libraries
- **Chart.js**: v4.5.0 (data visualization for dashboard analytics)
- **Zone.js**: v0.15.0 (Angular change detection)

### Project Configuration
- **Component Prefix**: 'app' (defined in angular.json)
- **Default Style**: SCSS (configured in schematics)
- **Output Path**: dist/expense-tracker
- **API Endpoint**: https://localhost:44319 (configured in environment files)

## Development Patterns and Best Practices

### Data Management Patterns
- **Central Service**: StorageService as single source of truth for all data
- **Reactive Streams**: BehaviorSubject for real-time UI updates
- **Full API Integration**: All entities backed by backend REST API
  - **Backend API**: Accounts, Categories, Reminders, Transactions, Budgets, Users (via dedicated API services)
  - **No Local Storage**: All data persisted in backend database for consistency and scalability
- **API Service Layer**: AccountApiService, CategoryApiService, ReminderApiService, TransactionApiService, BudgetApiService, UserApiService, AuthApiService
- **ID Type**: All entity IDs are `number` type for better performance and database compatibility
- **Error Handling**: User-friendly alerts for API errors with console logging for debugging

### API Integration Essentials
- **Lazy Loading**: API data loaded on-demand when pages are accessed (call loadEntity() in ngOnInit)
- **HTTP Method**: All API endpoints use POST method
- **Request/Response**: Strongly typed interfaces in model files
- **Observable Pattern**: API operations return Observable for async handling
- **Component Reload**: Components explicitly reload data after CRUD operations with their filter parameters
- **No Service Init Loading**: Do NOT load data in service constructor
- **GetById for Edit Mode**: All edit dialogs must fetch fresh data via GetById API endpoint to prevent stale edits
- **Server-Side Filtering Required**: ALL loadTransactions calls MUST include fromDate and toDate parameters for performance

### Authentication and Security Patterns
- **JWT Token Authentication**: Backend API-based authentication with JWT tokens
- **Token Storage**: JWT stored in localStorage with key `auth_token`, user data with key `currentUser`
- **HTTP Interceptor**: Automatic JWT token attachment to all API requests via authInterceptor
- **Route Protection**: AuthGuard protects all routes requiring authentication
- **Password Security**: SHA256 hashing done client-side before sending to backend API
- **Public Endpoints**: Login and signup endpoints excluded from token requirements
- **Auth Service Layer**: AuthApiService handles API calls, AuthService manages authentication state
- **Observable Auth Flow**: All authentication operations return Observables for async handling
- **401 Handling**: Interceptor automatically clears token and redirects to login on unauthorized responses
- **Validation Strategy**: Backend validates username/email uniqueness on submit (not client-side async validators)
- **Logout Pattern**: Call API logout endpoint first, then clear local token/user data, finally navigate to login page
- **Return URL Preservation**: AuthGuard captures intended destination in returnUrl query parameter for post-login redirect
- **Post-Login Navigation**: Login component reads returnUrl query parameter and redirects to intended page instead of always going to dashboard
- **Sidebar Visibility Logic**: Extract path from URL (removing query parameters) before checking against auth routes to properly hide sidebar on login/signup pages

### Form Handling Standards
- **Form Type**: Reactive forms with FormBuilder and validators
- **Validation**: Dynamic validation based on form state changes
- **Async Validation**: Use valueChanges subscriptions for real-time async validation (e.g., username/email availability checking)
- **Error Display**: Real-time validation feedback with custom error messages
- **Submit Handling**: Separate methods for create vs update operations
- **Custom Validators**: Implement custom validator functions for complex requirements (e.g., password strength, field matching)

### Dialog Architecture Standards
- **Dialog Service**: Centralized DialogService using Angular CDK Dialog
- **Component Structure**: Header + content + scrollable form-fields + fixed form-actions layout
- **Size Management**: 600px default width, 650px for complex forms, 85vh max height
- **Mobile Responsive**: 90vw max width with adjusted padding
- **Result Handling**: Consistent DialogResult interface with success/data properties
- **Edit Mode Data Fetching**: Always call getEntityById API in edit mode, show loading state during fetch
- **Loading States**: Use isLoading flag with spinner for API fetch operations in dialogs
- **Dialog Subscription Pattern**: Do NOT wrap dialogRef.closed.subscribe() with subscription.add() - subscribe directly and cast result type using 'as' operator

### State Management Best Practices
- **Subscription Management**: Manual subscription cleanup in OnDestroy
- **Immutable Updates**: Spread operators for state modifications
- **Reactive Patterns**: CombineLatest for multi-stream dependencies
- **Error Boundaries**: Service-level error handling with fallback values

### Performance Optimization Patterns
- **Lazy Loading**: Route-based code splitting for all feature pages
- **Change Detection**: OnPush strategy where applicable
- **Virtual Scrolling**: For large data sets in tables
- **Debouncing User Input**: Apply debounceTime(500ms) to form valueChanges streams
- **Server-Side Filtering**: Offload filtering logic to backend APIs
- **Prevent Duplicate Loads**: Avoid redundant load calls when BehaviorSubject subscriptions trigger initial loading

### Responsive Design Standards
- **Breakpoints**: Progressive design (1024px, 768px, 480px)
- **Mobile First**: Touch-friendly interactions and scroll behavior
- **Flexible Layouts**: CSS Grid and Flexbox for adaptive layouts
- **Typography Scaling**: Responsive font sizes across breakpoints

### Code Quality Standards
- **TypeScript Strict Mode**: Comprehensive type safety
- **No Any Types**: Explicit typing for all data structures
- **Interface First**: Define interfaces before implementation
- **Consistent Imports**: Barrel exports for clean import statements
- **Optional Property Pattern**: Use local constants inside if blocks when accessing optional properties to satisfy TypeScript strict null checking

## Essential Patterns Reference

### Currency Display
- Use full currency formatting with Intl.NumberFormat
- Locale: 'en-IN', Currency: INR
- Format: ₹12,345.00 (no compact notation)

### Date Range Filtering
- **Applicable Pages**: Dashboard, Transactions, Reminders (NOT Accounts or Categories)
- **DateRangeService**: Centralized service for cross-page date range synchronization
- **Debouncing**: Apply 500ms debounceTime to date range inputs
- **Timezone Safety**: Use string concatenation for date parameters (`${fromDate}T00:00:00.000Z`)

### DateTime Input Handling
- **Two Patterns**: Filter dates (string concatenation) vs Form datetime inputs (Date.UTC)
- **Filter Dates**: Use string concatenation to preserve selected date across timezones
- **Form DateTime**: Use Date.UTC() to preserve user's selected time when submitting to API
- **Critical Pitfall**: Avoid using new Date(string) + toISOString() for datetime-local inputs - causes timezone shift
- **Display Pattern**: Use local timezone methods (getHours, getMinutes) for showing dates in forms
- **API Submission**: Construct Date with Date.UTC() so toISOString() outputs the exact time user selected

### Transaction Effect System
- **Automatic Balance Updates**: Real-time account balance calculation
- **Transaction Types**: Income (add), Expense (subtract), Transfer (move between accounts)
- **Effect Application**: Immediate balance updates on create/edit/delete operations

### Budget Management
- **Named Budgets**: Flexible budget system with custom names, amounts, and date ranges
- **Multi-Category Support**: Single budget can track spending across multiple categories simultaneously
- **Period Types**: Support for weekly, monthly, quarterly, yearly, and custom period budgets
- **Period Ordering**: Arranged from shortest to longest duration for intuitive selection
- **Date Range Tracking**: Budgets have explicit start and end dates for flexible planning
- **Budget-Specific Calculation**: Each budget tracks spending using its own date range, not page filter dates
- **Active/Inactive Status**: Budgets can be toggled active or inactive without deletion
- **Real-time Tracking**: Automatic calculation of spent amounts from expense transactions across all assigned categories
- **Progress Indicators**: Visual progress bars showing percentage of budget used with over-budget warnings

## Quick Reference

For detailed information on specific topics, see the docs/ folder:

- **API Integration**: See [@docs/api-integration.md](docs/api-integration.md) for backend API patterns, endpoints, migration guides, and error handling
- **UI Patterns**: See [@docs/ui-patterns.md](docs/ui-patterns.md) for styling standards, dialog patterns, responsive design, and component layouts
- **Data Flow**: See [@docs/data-flow.md](docs/data-flow.md) for transaction effects, reactive patterns, state management, and budget system
- **Lessons Learned**: See [@docs/lessons-learned.md](docs/lessons-learned.md) for historical context, completed migrations, and architectural decisions

## Application Summary

Comprehensive Angular 19 expense tracker demonstrating modern development practices:
- **Architecture**: Standalone components with feature-based organization and lazy loading
- **State Management**: Reactive service patterns with BehaviorSubject streams
- **Backend Integration**: Full REST API integration for all entities with complete CRUD operations
- **Authentication**: JWT token-based authentication with HTTP interceptor and route guards
- **User Experience**: Mobile-first responsive design with professional dialog system
- **Performance**: Optimized change detection, lazy data loading, server-side filtering, and debounced inputs
- **Security**: JWT-based authentication, route protection, client-side password hashing, and role-based access control
- **Validation**: Form validation with backend-based uniqueness checks and password strength requirements
- **Maintainability**: Consistent patterns, comprehensive TypeScript, and clean organization

Serves as foundation for financial management applications with emphasis on responsive design, mobile optimization, production-ready performance optimizations, scalable backend architecture, JWT authentication, and secure user management.