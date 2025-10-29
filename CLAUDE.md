
# Angular Expense Tracker - Project Memory

## Project Overview

Modern Angular 19 expense tracking application with comprehensive financial management capabilities including account management, transaction tracking, categorization, analytics, budget management, and reminders.

## # Memory: Project Structure and Architecture

### Core Architecture Pattern
- **Framework**: Angular 19 with standalone components (no NgModules)
- **Module Organization**: Feature-based structure with lazy-loaded routes
- **Component Pattern**: Standalone components with inline templates and styles
- **State Management**: Service-based reactive patterns using BehaviorSubject
- **Data Persistence**: Hybrid approach - Backend REST API for Accounts, Local storage for other entities
- **Backend Integration**: HTTP communication via dedicated API service layer
- **Navigation**: Route-based lazy loading with dynamic imports

### Directory Structure Pattern
```
src/app/
├── models/           # Data entities and DTOs with barrel exports (includes API request/response interfaces)
├── services/         # Business logic and state management (StorageService, DateRangeService, API services)
├── pages/           # Feature pages (dashboard, accounts, categories, transactions, budget, reminders)
├── shared/          # Reusable components (data-table, dialogs, page-header, icon-selector)
├── app.component.*  # Root component with navigation sidebar
├── app.config.ts    # Application configuration (includes HttpClient provider)
└── app.routes.ts    # Route definitions with lazy loading

src/environments/
├── environment.ts      # Development environment config (API URLs)
└── environment.prod.ts # Production environment config
```

### Component Architecture Pattern
- **Standalone Components**: All components use `standalone: true` with explicit imports
- **Template Approach**: Inline templates with Angular's modern control flow (@if, @for, @switch)
- **Communication**: Parent-child via @Input/@Output, cross-component via services
- **Lifecycle**: OnInit for initialization, OnDestroy for cleanup with subscription management

## # Memory: Coding Style and Naming Conventions

### File Naming Conventions
- **Components**: `component-name.component.ts` (kebab-case)
- **Services**: `service-name.service.ts` (kebab-case)
- **Models**: `entity-name.model.ts` (kebab-case)
- **Barrel Exports**: `index.ts` for clean imports
- **Route Paths**: kebab-case URLs matching component names

### TypeScript Naming Patterns
- **Classes**: PascalCase (AccountDialogComponent, StorageService)
- **Properties/Methods**: camelCase (currentBalance, generateId)
- **Interfaces**: PascalCase with descriptive names (Transaction, TableColumn)
- **Enums**: PascalCase with UPPER_CASE values (TransactionType.INCOME)
- **Constants**: UPPER_SNAKE_CASE (STORAGE_KEYS)

### Component Selector Pattern
- **Prefix**: All components use 'app-' prefix
- **Format**: kebab-case (app-data-table, app-account-dialog)
- **Consistency**: Matches file naming convention

### Service Injection Pattern
- **Root Level**: All services use `providedIn: 'root'`
- **Constructor Injection**: Private readonly for injected dependencies
- **Service Names**: Descriptive with 'Service' suffix

## # Memory: Tech Stack and Dependencies

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
- **Style Budgets**: 4kB warning, 8kB error per component

### External Libraries
- **Chart.js**: v4.5.0 (data visualization for dashboard analytics)
- **Zone.js**: v0.15.0 (Angular change detection)

### Project Configuration
- **Component Prefix**: 'app' (defined in angular.json)
- **Default Style**: SCSS (configured in schematics)
- **Output Path**: dist/expense-tracker
- **Source Root**: src/ with main.ts entry point

## # Memory: Development Patterns and Best Practices

### Data Management Patterns
- **Central Service**: StorageService as single source of truth for all data
- **Reactive Streams**: BehaviorSubject for real-time UI updates
- **Hybrid Storage Strategy**: Backend REST API for Accounts and Categories entities, Local storage for Transactions, Budgets, Reminders
- **API Service Layer**: Dedicated API services for backend communication (e.g., AccountApiService, CategoryApiService)
- **ID Generation**: Backend-generated IDs for API entities, `Date.now()` for localStorage entities
- **ID Type**: All entity IDs are `number` type (not string) for better performance and database compatibility
- **Error Handling**: Try-catch blocks with console logging for storage operations, user-friendly alerts for API errors
- **Shared State Services**: Singleton services with BehaviorSubject for cross-page state synchronization (e.g., DateRangeService)

### Form Handling Standards
- **Form Type**: Reactive forms with FormBuilder and validators
- **Validation**: Dynamic validation based on form state changes
- **Error Display**: Real-time validation feedback with custom error messages
- **Submit Handling**: Separate methods for create vs update operations

### Dialog Architecture Standards
- **Dialog Service**: Centralized DialogService using Angular CDK Dialog
- **Component Structure**: Standard header + content + form-fields + form-actions layout
- **Size Management**: 600px default width, 650px for complex forms, 85vh max height
- **Mobile Responsive**: 90vw max width with adjusted padding
- **Result Handling**: Consistent DialogResult interface with success/data properties

### Data Table Component Pattern
- **Generic Design**: Configurable columns with type-based rendering
- **Column Types**: text, currency, date, badge with custom formatting
- **Virtual Scrolling**: CDK virtual scroll for large datasets
- **Track Functions**: Optimized change detection with trackBy
- **Responsive**: Horizontal scrolling on mobile with touch support

### State Management Best Practices
- **Subscription Management**: Manual subscription cleanup in OnDestroy
- **Immutable Updates**: Spread operators for state modifications
- **Reactive Patterns**: CombineLatest for multi-stream dependencies
- **Error Boundaries**: Service-level error handling with fallback values

### Performance Optimization Patterns
- **Lazy Loading**: Route-based code splitting for all feature pages
- **Change Detection**: OnPush strategy where applicable
- **Bundle Management**: Build budgets monitoring and tree-shaking
- **Virtual Scrolling**: For large data sets in tables

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

## # Memory: Backend API Integration Patterns

### API Service Architecture
- **Dedicated API Services**: Create separate service for each entity API (e.g., AccountApiService)
- **Service Location**: Place API services in src/app/services/ directory
- **Naming Convention**: entity-name-api.service.ts (kebab-case)
- **Service Decorator**: Use `@Injectable({ providedIn: 'root' })` for singleton pattern
- **HTTP Method**: All API endpoints use POST method regardless of operation type
- **Request/Response**: Strongly typed using interfaces defined in model files

### Environment Configuration Pattern
- **Environment Files**: Centralized API URL configuration in src/environments/
- **Development Config**: environment.ts contains development API URL
- **Production Config**: environment.prod.ts contains production API URL
- **Current API Host**: https://localhost:44319 (HTTPS with specific port)
- **Usage Pattern**: Import environment in API services, use `environment.apiUrl` for base URL

### API Request/Response Interfaces
- **Location**: Define in corresponding model file alongside entity interface
- **Naming Pattern**: CreateEntityRequest, UpdateEntityRequest for request DTOs
- **Request Fields**: Include only fields needed for specific operation
- **Update Request**: Must include both initialAmount and currentBalance for Account updates
- **Response Type**: API returns full entity object matching entity interface
- **String Literal Types**: Use string literal types (e.g., 'income' | 'expense') instead of enums in request DTOs for proper JSON serialization
- **Type Conversion**: Explicitly convert enum values to lowercase strings when creating API requests

### Lazy Loading Pattern for API Data
- **On-Demand Loading**: API data loaded only when pages that need it are accessed
- **Loading Method**: Public loadEntity() method in StorageService for component consumption
- **Call Location**: Components call load method in ngOnInit lifecycle hook
- **Applicable Components**: AccountsComponent, CategoriesComponent, DashboardComponent, TransactionsComponent, BudgetComponent, TransactionDialogComponent
- **Automatic Refresh**: After CRUD operations, call load method to refresh data from API
- **No Service Init Loading**: Do NOT load data in service constructor - only on explicit component request

### Component-Entity Dependencies Matrix
- **AccountsComponent**: Calls loadAccounts() only
- **CategoriesComponent**: Calls loadCategories() only
- **DashboardComponent**: Calls both loadAccounts() and loadCategories() for comprehensive dashboard view
- **TransactionsComponent**: Calls both loadAccounts() and loadCategories() for transaction form dependencies
- **BudgetComponent**: Calls loadCategories() only for budget-category associations
- **TransactionDialogComponent**: Calls both loadAccounts() and loadCategories() when dialog opens
- **AccountDialogComponent**: No load calls needed, works with parent's loaded data
- **CategoryDialogComponent**: No load calls needed, works with parent's loaded data
- **Pattern**: Page components load data, dialog components work with already-loaded data except TransactionDialog which needs fresh data on open

### StorageService Bridge Pattern
- **Hybrid Role**: Acts as bridge between components and both localStorage and API services
- **Single Interface**: Components interact only with StorageService, not directly with API services
- **Observable Return**: API operations return Observable for async handling in components
- **BehaviorSubject Maintained**: Keep reactive streams pattern even for API-backed entities
- **Stream Updates**: After API calls complete, update BehaviorSubject to trigger reactive UI updates
- **Error Propagation**: Catch API errors, log to console, and propagate to calling component

### Data Consistency Patterns for API-Backed Entities
- **Single Source of Truth**: BehaviorSubject holds current state, components subscribe to stream for reactive updates
- **Optimistic vs Pessimistic Updates**: Current implementation uses pessimistic updates - only update BehaviorSubject after successful API response
- **Refresh Strategy**: Always call loadEntity() after create/update/delete to ensure frontend state matches backend reality
- **Synchronous Getters**: Provide synchronous getEntity() methods that return BehaviorSubject.value for immediate access when needed
- **Stream-First Architecture**: Components primarily consume data through Observable subscriptions, not direct method calls
- **State Initialization**: Start with empty arrays in BehaviorSubject, populate only after explicit load calls
- **Cross-Component Sync**: Reactive streams automatically propagate changes to all subscribed components when BehaviorSubject updates
- **Error State Handling**: On load errors, set empty array to BehaviorSubject to provide consistent fallback state
- **No Local Caching**: API-backed entities do not cache in localStorage, backend is always source of truth
- **Concurrent Load Safety**: Multiple components calling same loadEntity() simultaneously is safe - last response wins pattern

### API Error Handling Pattern
- **Subscribe Pattern**: Use subscribe with next and error callbacks for all API calls
- **Console Logging**: Always log errors to console with descriptive context
- **User Feedback**: Display user-friendly alert messages for failed operations
- **State Reset**: Reset isSubmitting flags on error to allow retry
- **Error Messages**: "Failed to [operation] [entity]. Please try again."
- **Graceful Degradation**: On load errors, set empty array to BehaviorSubject

### HTTP Client Configuration
- **Provider Location**: Add provideHttpClient in app.config.ts providers array
- **Fetch API**: Use withFetch() option for modern fetch-based implementation
- **Dependency Injection**: Inject HttpClient in API service constructors
- **Request Configuration**: Set Content-Type to application/json for all requests
- **Body Serialization**: Angular automatically serializes request objects to JSON

### Account API Integration Specifics
- **GetAll Endpoint**: POST with empty object body to retrieve all accounts
- **GetById Endpoint**: POST with id in request body to retrieve single account
- **Create Endpoint**: POST with name, initialAmount, icon in request body
- **Update Endpoint**: POST with id, name, initialAmount, currentBalance, icon in request body
- **Delete Endpoint**: POST with id in request body, returns void
- **Balance Updates**: Frontend calculates new balance before sending update request

### Category API Integration Specifics
- **GetAll Endpoint**: POST with empty object body to retrieve all categories
- **GetById Endpoint**: POST with id in request body to retrieve single category
- **Create Endpoint**: POST with name, type, icon in request body
- **Update Endpoint**: POST with id, name, type, icon in request body
- **Delete Endpoint**: POST with id in request body, returns void
- **Category Types**: type field must be lowercase string 'income' or 'expense' (not numeric values)
- **Type Conversion**: Frontend explicitly converts CategoryType enum to lowercase string before sending to API
- **String Literal Pattern**: Request DTOs use string literal types for enum-like fields to ensure proper API serialization
- **Components Using Categories**: CategoriesComponent, DashboardComponent, TransactionsComponent, BudgetComponent, TransactionDialogComponent all call loadCategories() in ngOnInit

### Entity Migration from localStorage to API - Step-by-Step Pattern
1. **Update Environment Configuration**: Verify correct API URL in environment.ts and environment.prod.ts
2. **Create Request/Response Interfaces**: Add CreateEntityRequest and UpdateEntityRequest to entity model file using string literal types for enum fields
3. **Create API Service**: Build entity-api.service.ts following established service pattern with all five CRUD endpoints
4. **Update StorageService Initialization**: Change entity BehaviorSubject initialization from loading localStorage to empty array for lazy loading
5. **Add Load Method**: Create public loadEntity() method in StorageService that calls API service and updates BehaviorSubject
6. **Update Save Method**: Convert saveEntity() to return Observable, add isUpdate parameter, call appropriate API endpoint, refresh data after operation
7. **Update Delete Method**: Convert deleteEntity() to return Observable, call API delete endpoint, refresh data after operation
8. **Update Get Method**: Change getEntity() to return current BehaviorSubject value instead of reading from localStorage
9. **Inject API Service**: Add API service to StorageService constructor dependencies
10. **Update Main Component**: Add loadEntity() call in entity page component ngOnInit
11. **Update Dialog Component**: Change save/delete operations to subscribe to Observables with error handling and user feedback
12. **Update Related Components**: Add loadEntity() calls to all components that consume the entity data in their ngOnInit
13. **Handle Type Conversions**: Apply toLowerCase() or other conversions for enum fields in request object creation
14. **Remove localStorage Logic**: Delete all localStorage-related methods for the migrated entity
15. **Test CRUD Operations**: Verify create, read, update, delete operations work correctly with API
16. **Update Documentation**: Document new API endpoints, components affected, and any special patterns in CLAUDE.md

### API Integration Best Practices
- **Type Safety**: Always use strongly typed interfaces for request/response objects
- **Error Messages**: Provide clear, user-friendly error messages for all API failures
- **Loading State**: Manage isSubmitting flags in dialogs to prevent duplicate submissions
- **Data Refresh**: Always call load method after successful CRUD operations to sync with backend
- **Observable Pattern**: Return Observables from StorageService, let components handle subscriptions
- **Enum Handling**: Use string literal types in DTOs and explicitly convert enum values before sending
- **ID Management**: Set ID to 0 for create operations, backend generates actual IDs
- **Empty Body Pattern**: Send empty object for GetAll endpoints that require no parameters
- **Component Initialization**: Load API data in ngOnInit, never in service constructor
- **Subscription Cleanup**: Always unsubscribe in component ngOnDestroy to prevent memory leaks
- **Centralized Configuration**: Use environment files for all API URLs, never hardcode endpoints
- **Consistent Error Handling**: Log to console for debugging, show alerts for user notification

### Common API Integration Pitfalls
- **Missing Load Calls**: Forgetting to add loadEntity() calls to consuming components results in empty data
- **Enum Serialization Issues**: TypeScript enums may serialize to numbers or strings depending on definition - always use explicit string literal types for API contracts
- **Type Case Sensitivity**: Backend may expect specific casing for string values - verify and enforce with explicit conversions
- **Unhandled Observables**: Failing to subscribe to returned Observables means operations never execute
- **Missing Error Handlers**: Operations without error callbacks fail silently and confuse users
- **Hardcoded IDs**: Using Date.now() for create operations when backend expects ID to be 0 or undefined
- **Stale Data Display**: Not calling load method after CRUD operations leaves UI showing outdated information
- **Multiple API Calls**: Loading data in service constructor causes unnecessary duplicate API requests
- **Subscription Leaks**: Missing unsubscribe in ngOnDestroy causes memory leaks and unexpected behavior
- **Environment Mismatch**: Using wrong API URL or forgetting to update environment files after backend port changes
- **Component Order Dependencies**: Assuming entity data is available immediately when it requires async API load
- **Dialog State Bugs**: Not resetting isSubmitting flag on errors prevents retry attempts

## # Memory: Data Flow and Transaction Patterns

### Transaction Effect System
- **Automatic Balance Updates**: Real-time account balance calculation on transaction changes
- **Transaction Types**: Income (add), Expense (subtract), Transfer (move between accounts)
- **Effect Application**: Immediate balance updates on create/edit/delete operations
- **Data Integrity**: Consistent balance calculation across all operations

### Reactive Data Synchronization
- **BehaviorSubject Streams**: accounts$, categories$, transactions$, budgets$, reminders$
- **Cross-Component Updates**: Automatic UI updates via reactive subscriptions
- **Computed Properties**: Derived data calculated from reactive streams
- **Real-time Updates**: Immediate reflection of changes across application

### Budget Management System
- **Monthly Budgets**: Each category can have different budget limits per month (month + year combination)
- **Real-time Tracking**: Automatic calculation of spent amounts from expense transactions
- **Historical Data**: Includes previous spending when setting budgets mid-month
- **Usage Calculation**: Spent = sum of expense transactions for category in current month
- **Progress Indicators**: Visual progress bars showing percentage of budget used
- **Dynamic Sections**: Categories move between "Budgeted" and "Not Budgeted" sections based on budget status
- **Budget Model**: Budget entity with categoryId, month, year, limit, and timestamps

## # Memory: UI Enhancement and Styling Patterns

### Currency Display Standards
- **Full Amount Display**: Use standard currency formatting with Indian Rupee (INR) locale
- **Format Pattern**: Intl.NumberFormat with 'en-IN' locale and INR currency
- **Data Table Currency**: All currency columns in data tables display full amounts (₹12,345.00)
- **Stat Cards**: Summary statistics display full formatted currency values
- **No Compact Notation**: Avoid K/M/B notation to ensure clarity and precision in financial data
- **Consistent Application**: Applied uniformly across all pages (Dashboard, Accounts, Transactions, Budget)

### Table Layout and Alignment
- **Header-Data Alignment**: Matching padding values between headers and data
- **Column Spacing**: Balanced spacing with minimum width constraints
- **Text Truncation**: Ellipsis handling for overflow content
- **Responsive Behavior**: Horizontal scrolling with touch support

### Dialog System Standardization
- **Unified Structure**: Consistent header + content + form layout
- **Scrollable Forms**: Fixed action buttons with scrollable content area
- **Mobile Adaptation**: Responsive sizing and touch-friendly interactions
- **Component Completeness**: All CRUD operations have corresponding dialogs

### Mobile-First Design Approach
- **Touch Targets**: Minimum 32px height for interactive elements
- **Horizontal Navigation**: Scrollable tabs and filter options
- **Compact Spacing**: Optimized padding and margins for mobile
- **Progressive Enhancement**: Desktop features enhance mobile base experience

### Data Table First Column Optimization
- **Text Content Support**: First column optimized for text content (titles, names) not just icons
- **Consistent Typography**: First column uses inherit font-size to match other text columns
- **Proper Alignment**: Left-aligned text with proper text overflow handling (ellipsis)
- **Responsive Width**: 120px min-width desktop, 80px mobile with appropriate padding
- **Universal Pattern**: Applied across all table implementations for consistency

### Page Header Component Pattern
- **Content Projection**: Supports ng-content for flexible header actions (filters, buttons, controls)
- **Actions Container**: header-actions wrapper with flexbox layout for right-aligned content
- **Responsive Behavior**: Stacks header actions vertically on mobile (below 768px)
- **Flexible Integration**: Can host date pickers, buttons, or custom controls alongside page title

### Date Range Filter Implementation Pattern
- **Form Integration**: ReactiveFormsModule with FormBuilder for date range controls
- **Default Date Range**: Initialize with current month (first to last day) using formatDateForInput helper
- **Real-time Filtering**: Subscribe to valueChanges for automatic data refresh
- **Inclusive Date Logic**: Set end date to end of day (23:59:59.999) for proper date comparisons
- **Comprehensive Filtering**: Apply date filters to all dashboard components (stats, charts, category breakdown)
- **Filter Propagation**: Pass date range to all data calculation methods for consistent filtering
- **Applicable Pages**: Dashboard, Transactions, Reminders (NOT Accounts or Categories - see below)

### Date Range Picker Styling Standards
- **Compact Design**: "Fr:" and "To:" labels (2-character abbreviations for space efficiency)
- **Inline Label Positioning**: Absolute positioning inside input with Verdana font, 0.875rem, 500 weight
- **Input Dimensions**: 170px width, 2.7rem left padding for label space
- **Gap Spacing**: 0.5rem gap between date field wrappers
- **Label Offset**: 0.625rem from left edge of input
- **Consistent Application**: Same styling across date-filtered pages (Dashboard, Transactions, Reminders)

### Global Date Range Synchronization Pattern
- **DateRangeService**: Centralized service managing shared date range state across application
- **Service Architecture**: BehaviorSubject-based with Observable stream (dateRange$)
- **Initial State**: Current month (first to last day) set on service initialization
- **Bidirectional Sync**: Pages update service on local changes AND listen for external changes
- **Update Pattern**: `dateRangeService.updateDateRange(value)` on form valueChanges
- **Listen Pattern**: Subscribe to `dateRangeService.dateRange$` and patchValue with `{ emitEvent: false }`
- **Loop Prevention**: Use `{ emitEvent: false }` when patching form from service to prevent infinite loops
- **Cross-Page Behavior**: Date range changes persist when navigating between pages
- **Data Filtering**: Each page filters its data based on the synchronized date range
- **Constant Entity Pattern**: Accounts and Categories pages do NOT use date filtering - these are constant entities that persist across all time periods, unlike time-based transactions and reminders

### Dialog Form Scrolling Pattern
- **Form Structure**: Use flexbox layout with form-fields and form-actions sections
- **Scrollable Content**: Apply `max-height: calc(90vh - 200px)` to form-fields container
- **Fixed Actions**: Keep action buttons always visible at bottom without `margin-top: auto`
- **Scroll Container**: form-fields div has `overflow-y: auto` with custom scrollbar styling
- **Custom Scrollbar**: 6px width, rounded thumb, hover effects for better UX
- **Button Visibility**: Ensures Cancel/Submit buttons remain visible when form content expands
- **Consistent Pattern**: Applied across all dialog components (Category, Transaction, Reminder)

### Dashboard Reminder Display Pattern
- **Upcoming Reminders Section**: Display top 10 upcoming reminders on dashboard below category breakdown
- **Filter Logic**: Show only active reminders with dates today or in the future (not past dates)
- **Sorting Strategy**: Sort by reminder date ascending (closest date first)
- **Extended Interface Pattern**: Create extended interfaces for computed properties (e.g., UpcomingReminder extends Reminder)
- **Computed Properties**: Add daysUntil, reminderDate, startDate, endDate as computed fields for UI display
- **Status Display**: Dynamic status badges showing "Today", "Tomorrow", "In X days" based on daysUntil calculation
- **Status Color Coding**: Today (yellow), Future (blue), Overdue (red) for visual distinction
- **Card Design**: White background card with blue left border, bell icon, title, date, and status badge
- **Hover Effects**: Subtle transform translateX on hover for interactive feedback
- **Responsive Layout**: Horizontal layout on desktop, stacked content on mobile with flex-wrap
- **Conditional Rendering**: Only display section when upcomingReminders array has items
















## # Memory: Recent Improvements and Established Patterns

### Key System Enhancements Completed
- **Responsive Design**: Fixed dashboard card overflow, added mobile touch support for filter tabs
- **Currency Display System**: Implemented full currency formatting (₹12,345.00) across all screens for clarity and precision
- **Dialog System**: Created unified dialog architecture with standardized component structure
- **Component Completeness**: Built missing ReminderDialogComponent with full CRUD functionality
- **Mobile Optimization**: Enhanced touch targets, horizontal scrolling, and compact spacing
- **Dashboard Date Filtering**: Implemented date range picker with comprehensive filtering across all dashboard data
- **Page Header Enhancement**: Extended page-header component with content projection for flexible action placement
- **Selective Date Range Filtering**: Date range filters applied only to time-based pages (Dashboard, Transactions, Reminders)
- **Global Date Synchronization**: Implemented DateRangeService for cross-page date range state management
- **Data Filtering System**: Time-based pages filter their data based on selected date range with inclusive date logic
- **Constant Entity Pattern**: Accounts and Categories pages simplified without date filtering - these are persistent organizational entities
- **Dialog Scrolling Fix**: Fixed action button visibility in all dialog forms by implementing proper scrolling containers with max-height constraints
- **Budget Management**: Comprehensive monthly budget tracking system with real-time spending calculations and visual progress indicators
- **Dashboard Reminders Widget**: Top 10 upcoming reminders display on dashboard with smart filtering, status badges, and responsive design
- **Integer ID Migration**: Migrated all entity IDs from string to number type for better performance and database compatibility
- **Backend API Integration**: Implemented REST API integration for Accounts and Categories entities with dedicated service layer
- **Environment Configuration**: Added environment files for centralized API URL management (https://localhost:44319)
- **Lazy Loading API Pattern**: API data loaded on-demand when pages are accessed, not on app initialization
- **Hybrid Data Strategy**: Accounts and Categories use backend API, Transactions/Budgets/Reminders continue using localStorage
- **Category API Migration**: Migrated Categories from localStorage to REST API with CategoryApiService following established patterns

### Lessons Learned from Category API Migration
- **Multi-Component Impact**: Categories are consumed by 5+ components - always identify all consuming components before starting migration
- **String Type Enforcement**: API expected lowercase string values for type field, not enum numeric values - critical to test actual payload format
- **Request DTO Design**: String literal types in request interfaces provide better type safety and clearer API contracts than enum types
- **Lazy Loading Benefits**: Initializing BehaviorSubject with empty array and loading on-demand reduces unnecessary API calls on app startup
- **Observable Conversion**: Converting synchronous save/delete methods to Observable pattern required updating all calling components with subscription handling
- **Error Feedback Loop**: User-friendly error messages in dialogs with alert() provide immediate feedback when API operations fail
- **Type Conversion Layer**: Adding explicit toLowerCase() conversions in StorageService ensures consistent data format regardless of internal representation
- **Component Load Pattern**: Every component using entity data needs explicit loadEntity() call in ngOnInit - reactive streams alone are not sufficient
- **Dialog State Management**: isSubmitting flag must be reset in error callback to allow retry attempts after failed operations
- **Centralized API Configuration**: Environment file changes automatically apply to all API services - single source of truth for backend URL
- **Testing Type Format**: Always verify JSON payload format matches API expectations, especially for enum-like fields that might serialize differently

### Future Development Guidelines
- **Responsive Breakpoints**: Use progressive 1024px, 768px, 480px with appropriate scaling
- **Currency Display**: Always use full currency formatting with Intl.NumberFormat for clarity in financial applications
- **Dialog Pattern**: Follow header + content + scrollable fields + fixed actions structure
- **Component Standards**: Ensure all CRUD operations have corresponding dialog components
- **Mobile Priority**: Implement touch support and horizontal scrolling for overflow scenarios
- **Table First Column**: Always configure first column for text content with left alignment and inherit font-size
- **Typography Consistency**: Ensure consistent font sizing across similar UI elements using inheritance patterns
- **Date Filter Pattern**: Only apply date filtering to time-based pages (Dashboard, Transactions, Reminders) using DateRangeService
- **Constant Entity Pattern**: Accounts and Categories are persistent entities - do NOT apply date filtering to these pages
- **Form Input Labels**: Use inline labels positioned absolutely inside input boxes for compact design
- **Label Styling Standards**: Verdana font family, 0.875rem size, 500 weight, dark color (#1a1a1a) for inline labels
- **Date Picker Dimensions**: 170px width, 2.7rem left padding, "Fr:" and "To:" labels for compact design
- **Shared State Services**: For cross-page state, create dedicated service with BehaviorSubject pattern like DateRangeService
- **Page Filtering**: For time-based pages, maintain separate `all*` and filtered arrays, apply date range filtering on initialization and changes
- **Service Initialization**: Initialize date forms with `getCurrentDateRange()` from DateRangeService for consistency on time-based pages only
- **Extended Interfaces**: When adding computed properties to existing models, create extended interfaces (e.g., UpcomingReminder extends Reminder) for type safety
- **Dashboard Widgets**: Display summary information from other pages (top 10 patterns) with conditional rendering and responsive design
- **API Integration**: When integrating new entities with backend, follow the 16-step Entity Migration pattern documented in Backend API Integration Patterns section
- **Data Loading**: Load API data lazily in component ngOnInit, not in service constructor - call loadEntity() for every entity used by the component
- **Error Handling**: Always provide user-friendly error messages for failed API operations using alert() with "Failed to [operation] [entity]. Please try again." pattern
- **Update Requests**: Include all necessary fields in update requests, including both initial and current values where applicable
- **Observable Pattern**: Return Observables from service methods for API operations, allow components to handle subscription with error callbacks
- **String Literal Types**: When API expects string values for enum-like fields, use string literal types in request DTOs and explicitly convert enum values
- **Component Dependencies**: Identify all components that consume an entity before migration and update each to call appropriate load methods
- **Dialog Subscriptions**: Update dialog components to subscribe to save/delete Observables with proper error handling and isSubmitting state management
- **Type Format Validation**: Verify that enum-like fields are sent as correct string format expected by API, not numeric or other representations
- **Multi-Component Loading**: When multiple entities are needed, call all relevant load methods in ngOnInit without waiting for sequential completion

## Application Summary

Comprehensive Angular 19 expense tracker demonstrating modern development practices:
- **Architecture**: Standalone components with feature-based organization and lazy loading
- **State Management**: Reactive service patterns with BehaviorSubject streams
- **Backend Integration**: REST API communication for Accounts and Categories with hybrid data persistence approach
- **User Experience**: Mobile-first responsive design with professional dialog system
- **Performance**: Optimized change detection, virtual scrolling, lazy data loading, and bundle management
- **Maintainability**: Consistent patterns, comprehensive TypeScript, and clean organization
- **Scalability**: Modular API service layer with multiple entity integrations (Accounts, Categories)

Serves as foundation for financial management applications with emphasis on responsive design, mobile optimization, and progressive backend API integration in 2025.