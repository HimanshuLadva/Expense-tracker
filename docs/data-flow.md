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
- **Monthly Budgets**: Each category can have different budget limits per month (month + year combination)
- **Budget Model**: Budget entity with categoryId, month, year, limit, and timestamps

### Budget Tracking
- **Real-time Tracking**: Automatic calculation of spent amounts from expense transactions
- **Historical Data**: Includes previous spending when setting budgets mid-month
- **Usage Calculation**: Spent = sum of expense transactions for category in current month
- **Progress Indicators**: Visual progress bars showing percentage of budget used
- **Dynamic Sections**: Categories move between "Budgeted" and "Not Budgeted" sections based on budget status

## Data Persistence Strategy (Hybrid)

### Backend API (REST)
- **Accounts**: Full CRUD via AccountApiService
- **Categories**: Full CRUD via CategoryApiService
- **Reminders**: Full CRUD via ReminderApiService with date range filtering

### Local Storage
- **Transactions**: Stored in localStorage (localStorage key: 'expense_tracker_transactions')
- **Budgets**: Stored in localStorage (localStorage key: 'expense_tracker_budgets')

### StorageService Pattern
- **Bridge Role**: Acts as bridge between components and both localStorage and API services
- **Single Interface**: Components interact only with StorageService
- **Observable Return**: API operations return Observable for async handling
- **Reactive Streams**: BehaviorSubject maintained for both API-backed and localStorage entities
- **Component Responsibility**: Components reload data after CRUD operations with their specific filter parameters

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
- **Debouncing User Input**: Apply debounceTime operator (500ms) to form valueChanges streams
- **Server-Side Filtering**: Offload filtering logic to backend APIs
- **Prevent Duplicate Loads**: Avoid redundant API calls through subscription management

## Transaction-Account Relationship

### Balance Calculation
1. Transaction created → Account balance updated immediately
2. Transaction updated → Previous effect reversed, new effect applied
3. Transaction deleted → Effect reversed, balance restored

### Balance Integrity
- **Frontend Calculation**: Calculate new balance before sending update request to API
- **Consistency Check**: Balance always reflects sum of initial amount and all transaction effects
- **Real-time Updates**: UI updates immediately through reactive streams
