
# Angular Expense Tracker - Project Memory

## Project Overview

Modern Angular 19 expense tracking application with comprehensive financial management capabilities including account management, transaction tracking, categorization, analytics, budget management, and reminders.

## # Memory: Project Structure and Architecture

### Core Architecture Pattern
- **Framework**: Angular 19 with standalone components (no NgModules)
- **Module Organization**: Feature-based structure with lazy-loaded routes
- **Component Pattern**: Standalone components with inline templates and styles
- **State Management**: Service-based reactive patterns using BehaviorSubject
- **Data Persistence**: Local storage with JSON serialization and date handling
- **Navigation**: Route-based lazy loading with dynamic imports

### Directory Structure Pattern
```
src/app/
├── models/           # Data entities and DTOs with barrel exports
├── services/         # Business logic and state management (StorageService, DateRangeService)
├── pages/           # Feature pages (dashboard, accounts, categories, transactions, budget, reminders)
├── shared/          # Reusable components (data-table, dialogs, page-header, icon-selector)
├── app.component.*  # Root component with navigation sidebar
├── app.config.ts    # Application configuration
└── app.routes.ts    # Route definitions with lazy loading
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
- **Storage Strategy**: Local storage with JSON serialization and custom date revival
- **ID Generation**: Integer-based using `Date.now()` (timestamp in milliseconds)
- **ID Type**: All entity IDs are `number` type (not string) for better performance and database compatibility
- **Error Handling**: Try-catch blocks with console logging for storage operations
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
- **Integer ID Migration**: Migrated all entity IDs from string to number type for better performance and database compatibility (uses `Date.now()` for generation)

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

## Application Summary

Comprehensive Angular 19 expense tracker demonstrating modern development practices:
- **Architecture**: Standalone components with feature-based organization and lazy loading
- **State Management**: Reactive service patterns with BehaviorSubject streams
- **User Experience**: Mobile-first responsive design with professional dialog system
- **Performance**: Optimized change detection, virtual scrolling, and bundle management
- **Maintainability**: Consistent patterns, comprehensive TypeScript, and clean organization

Serves as foundation for financial management applications with emphasis on responsive design and mobile optimization in 2024.