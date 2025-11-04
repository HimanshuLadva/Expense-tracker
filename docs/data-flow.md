# Data Flow and State Management Patterns

This document describes how data flows through the application, transaction effects, and reactive state management patterns.

## Transaction Effect System

- **Automatic Balance Updates**: Real-time account balance calculation on transaction changes
- **Transaction Types**:
  - **Income**: Add amount to account balance
  - **Expense**: Subtract amount from account balance
  - **Transfer**: Move amount from one account to another
- **Effect Application**: Immediate balance updates on create/edit/delete operations
- **Data Integrity**: Consistent balance calculation across all operations

## Reactive Data Synchronization

### BehaviorSubject Streams

The application uses BehaviorSubject for reactive state management:

- `accounts$` - Account data stream
- `categories$` - Category data stream
- `transactions$` - Transaction data stream
- `budgets$` - Budget data stream
- `reminders$` - Reminder data stream

### Stream Characteristics

- **Cross-Component Updates**: Automatic UI updates via reactive subscriptions
- **Computed Properties**: Derived data calculated from reactive streams
- **Real-time Updates**: Immediate reflection of changes across application
- **Single Source of Truth**: BehaviorSubject holds current state
- **Stream-First Architecture**: Components primarily consume data through Observable subscriptions

## State Management Best Practices

- **Subscription Management**: Manual subscription cleanup in OnDestroy
- **Immutable Updates**: Spread operators for state modifications
- **Reactive Patterns**: CombineLatest for multi-stream dependencies
- **Error Boundaries**: Service-level error handling with fallback values
- **Subscription Cleanup**: Always unsubscribe in component ngOnDestroy to prevent memory leaks

## Budget Management System

### Budget Structure
- **Named Budgets**: Flexible budgets with custom names for easy identification
- **Multi-Category Tracking**: Single budget can monitor spending across multiple categories simultaneously
- **Flexible Periods**: Support for monthly, weekly, yearly, and custom date range budgets
- **Date Range Definition**: Explicit start and end dates for precise budget planning
- **Active Status Management**: Budgets can be marked active or inactive without deletion
- **Budget Model**: Budget entity with id, name, amount, period, categories array, startDate, endDate, isActive, and timestamps

### Budget Tracking
- **Real-time Tracking**: Automatic calculation of spent amounts from expense transactions across all assigned categories
- **Date Range Filtering**: Spending calculated only for transactions within budget date range
- **Multi-Category Aggregation**: Sums expenses from all categories assigned to the budget
- **Usage Calculation**: Spent = sum of expense transactions for all budget categories within date range
- **Progress Indicators**: Visual progress bars showing percentage of budget used with over-budget warnings
- **Percentage Tracking**: Real-time calculation of budget utilization percentage

## Data Persistence Strategy

### Backend API (REST)
All entities are now fully backed by the backend REST API with complete CRUD operations:

- **Accounts**: Full CRUD via AccountApiService
- **Categories**: Full CRUD via CategoryApiService
- **Reminders**: Full CRUD via ReminderApiService with date range filtering
- **Transactions**: Full CRUD via TransactionApiService with date range filtering
- **Budgets**: Full CRUD via BudgetApiService with date range filtering and multi-category support

### StorageService Pattern
- **Bridge Role**: Acts as unified interface between components and API services
- **Single Interface**: Components interact only with StorageService, never directly with API services
- **Observable Return**: All API operations return Observable for async handling
- **Reactive Streams**: BehaviorSubject maintained for all entities to enable reactive UI updates
- **Component Responsibility**: Components reload data after CRUD operations with their specific filter parameters
- **No Local Storage**: All data persistence handled by backend database for consistency and scalability

## Data Loading Patterns

### Lazy Loading for API Data
- **On-Demand**: API data loaded only when pages that need it are accessed
- **Component Init**: Components call load methods in ngOnInit lifecycle hook
- **No Service Init**: Do NOT load data in service constructor

### Initial Load Optimization
- **Avoid Duplicates**: Rely on BehaviorSubject subscriptions for initial data load
- **No Redundant Calls**: Don't add explicit load call when subscription already triggers initial load

## Cross-Component Data Consistency

### Synchronization Mechanisms
- **BehaviorSubject Updates**: All components subscribing to a stream automatically receive updates
- **Refresh After CRUD**: Components explicitly reload data after create/update/delete operations
- **Filter Consistency**: Maintain UI state consistency by passing same filter parameters when reloading

### DateRangeService Pattern
- **Shared State**: Centralized service for date range state across pages
- **Bidirectional Sync**: Pages update service on changes AND listen for external changes
- **Persistent State**: Date range persists when navigating between pages
- **Loop Prevention**: Use `{ emitEvent: false }` when patching form to prevent infinite loops

## Performance Optimization Patterns

- **Lazy Loading**: Route-based code splitting for all feature pages
- **Change Detection**: OnPush strategy where applicable
- **Virtual Scrolling**: For large data sets in tables
- **Debouncing User Input**: Apply debounceTime operator (500ms) to form valueChanges streams for date range filters and search inputs
- **Server-Side Filtering**: Offload filtering logic to backend APIs instead of client-side filtering
- **Prevent Duplicate Loads**: Avoid redundant API calls through subscription management
- **Component-Controlled Reload**: Components explicitly reload data with their filter parameters after CRUD operations
- **No Automatic Service Reload**: Services do NOT auto-reload after CRUD to prevent unnecessary API calls
- **Bidirectional Date Sync**: DateRangeService synchronizes date range across pages with emitEvent: false to prevent loops

## Transaction-Account Relationship

### Balance Calculation
1. Transaction created → Account balance updated immediately
2. Transaction updated → Previous effect reversed, new effect applied
3. Transaction deleted → Effect reversed, balance restored

### Balance Integrity
- **Frontend Calculation**: Calculate new balance before sending update request to API
- **Consistency Check**: Balance always reflects sum of initial amount and all transaction effects
- **Real-time Updates**: UI updates immediately through reactive streams
