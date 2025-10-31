# Backend API Integration Patterns

This document contains detailed patterns for integrating with the backend REST API.

## API Service Architecture

- **Dedicated API Services**: Create separate service for each entity API (e.g., AccountApiService)
- **Service Location**: Place API services in src/app/services/ directory
- **Naming Convention**: entity-name-api.service.ts (kebab-case)
- **Service Decorator**: Use `@Injectable({ providedIn: 'root' })` for singleton pattern
- **HTTP Method**: All API endpoints use POST method regardless of operation type
- **Request/Response**: Strongly typed using interfaces defined in model files

## Environment Configuration Pattern

- **Environment Files**: Centralized API URL configuration in src/environments/
- **Development Config**: environment.ts contains development API URL
- **Production Config**: environment.prod.ts contains production API URL
- **Current API Host**: https://localhost:44319 (HTTPS with specific port)
- **Usage Pattern**: Import environment in API services, use `environment.apiUrl` for base URL

## API Request/Response Interfaces

- **Location**: Define in corresponding model file alongside entity interface
- **Naming Pattern**: CreateEntityRequest, UpdateEntityRequest for request DTOs
- **Request Fields**: Include only fields needed for specific operation
- **Update Request**: Must include both initialAmount and currentBalance for Account updates
- **Response Type**: API returns full entity object matching entity interface
- **String Literal Types**: Use string literal types (e.g., 'income' | 'expense') instead of enums in request DTOs for proper JSON serialization
- **Type Conversion**: Explicitly convert enum values to lowercase strings when creating API requests

## Lazy Loading Pattern for API Data

- **On-Demand Loading**: API data loaded only when pages that need it are accessed
- **Loading Method**: Public loadEntity() method in StorageService for component consumption
- **Call Location**: Components call load method in ngOnInit lifecycle hook
- **Applicable Components**: AccountsComponent, CategoriesComponent, RemindersComponent, DashboardComponent, TransactionsComponent, BudgetComponent, TransactionDialogComponent
- **Automatic Refresh**: After CRUD operations, call load method to refresh data from API
- **No Service Init Loading**: Do NOT load data in service constructor - only on explicit component request

## Component-Entity Dependencies

**Which components load which entities:**

- **AccountsComponent**: Calls loadAccounts() only
- **CategoriesComponent**: Calls loadCategories() only
- **RemindersComponent**: Calls loadReminders() only
- **DashboardComponent**: Calls loadAccounts(), loadCategories(), and loadReminders()
- **TransactionsComponent**: Calls both loadAccounts() and loadCategories()
- **BudgetComponent**: Calls loadCategories() only
- **TransactionDialogComponent**: Calls both loadAccounts() and loadCategories() when dialog opens
- **Dialog Components**: AccountDialog, CategoryDialog, ReminderDialog work with parent's loaded data

**Pattern**: Page components load data, dialog components work with already-loaded data except TransactionDialog which needs fresh data on open.

## StorageService Bridge Pattern

- **Hybrid Role**: Acts as bridge between components and both localStorage and API services
- **Single Interface**: Components interact only with StorageService, not directly with API services
- **Observable Return**: API operations return Observable for async handling in components
- **BehaviorSubject Maintained**: Keep reactive streams pattern even for API-backed entities
- **Stream Updates**: After API calls complete, update BehaviorSubject to trigger reactive UI updates
- **Error Propagation**: Catch API errors, log to console, and propagate to calling component
- **Component Reload Responsibility**: StorageService does NOT automatically reload data after CRUD operations; components explicitly reload with their specific parameters (e.g., date range)

## Data Consistency Patterns for API-Backed Entities

- **Single Source of Truth**: BehaviorSubject holds current state, components subscribe to stream for reactive updates
- **Pessimistic Updates**: Only update BehaviorSubject after successful API response
- **Refresh Strategy**: Always call loadEntity() after create/update/delete to ensure frontend state matches backend
- **Synchronous Getters**: Provide synchronous getEntity() methods that return BehaviorSubject.value for immediate access
- **Stream-First Architecture**: Components primarily consume data through Observable subscriptions
- **State Initialization**: Start with empty arrays in BehaviorSubject, populate only after explicit load calls
- **Cross-Component Sync**: Reactive streams automatically propagate changes to all subscribed components
- **Error State Handling**: On load errors, set empty array to BehaviorSubject to provide consistent fallback state
- **No Local Caching**: API-backed entities do not cache in localStorage, backend is always source of truth

## API Error Handling Pattern

- **Subscribe Pattern**: Use subscribe with next and error callbacks for all API calls
- **Console Logging**: Always log errors to console with descriptive context
- **User Feedback**: Display user-friendly alert messages for failed operations
- **State Reset**: Reset isSubmitting flags on error to allow retry
- **Error Messages**: "Failed to [operation] [entity]. Please try again."
- **Graceful Degradation**: On load errors, set empty array to BehaviorSubject

## HTTP Client Configuration

- **Provider Location**: Add provideHttpClient in app.config.ts providers array
- **Fetch API**: Use withFetch() option for modern fetch-based implementation
- **Dependency Injection**: Inject HttpClient in API service constructors
- **Request Configuration**: Set Content-Type to application/json for all requests
- **Body Serialization**: Angular automatically serializes request objects to JSON

## Entity-Specific API Patterns

### Common CRUD Endpoints (All Entities)
- **GetAll**: POST with empty object body (or filter parameters)
- **GetById**: POST with id in request body
- **Create**: POST with entity fields (no id)
- **Update**: POST with id + updated fields
- **Delete**: POST with id in request body

### Account-Specific
- Balance updates: Frontend calculates new balance before sending update request
- Update includes both initialAmount and currentBalance

### Category-Specific
- Type field must be lowercase string 'income' or 'expense'
- Frontend converts CategoryType enum to lowercase string
- Use string literal types in request DTOs

### Reminder-Specific
- GetAll/GetActive accept optional fromDate and toDate for filtering
- API expects ISO 8601 date format
- ReminderApiService handles Date ↔ ISO string conversion
- Use direct string concatenation for date parameters to avoid timezone issues

## Entity Migration from localStorage to API

When migrating an entity from localStorage to backend API, follow these steps:

1. **Update Environment Configuration**: Verify correct API URL in environment files
2. **Create Request/Response Interfaces**: Add CreateEntityRequest and UpdateEntityRequest to model file
3. **Create API Service**: Build entity-api.service.ts with all CRUD endpoints
4. **Update StorageService**: Change BehaviorSubject initialization to empty array
5. **Add Load Method**: Create public loadEntity() method in StorageService
6. **Update Save Method**: Convert to return Observable, call appropriate API endpoint
7. **Update Delete Method**: Convert to return Observable, call API delete endpoint
8. **Update Components**: Add loadEntity() calls to all consuming components in ngOnInit
9. **Update Dialogs**: Change operations to subscribe to Observables with error handling
10. **Test**: Verify all CRUD operations work correctly

## API Integration Best Practices

- **Type Safety**: Always use strongly typed interfaces for request/response objects
- **Error Messages**: Provide clear, user-friendly error messages for all API failures
- **Loading State**: Manage isSubmitting flags in dialogs to prevent duplicate submissions
- **Data Refresh**: Components explicitly call load method with their parameters after successful CRUD operations
- **Observable Pattern**: Return Observables from StorageService, let components handle subscriptions
- **Enum Handling**: Use string literal types in DTOs and explicitly convert enum values before sending
- **ID Management**: Set ID to 0 for create operations, backend generates actual IDs
- **Empty Body Pattern**: Send empty object for GetAll endpoints that require no parameters
- **Component Initialization**: Load API data in ngOnInit, never in service constructor
- **Subscription Cleanup**: Always unsubscribe in component ngOnDestroy to prevent memory leaks
- **Centralized Configuration**: Use environment files for all API URLs, never hardcode endpoints
- **Server-Side Filtering**: Prefer server-side filtering over client-side filtering for scalability
- **Debouncing User Input**: Apply debounceTime (500ms) to form valueChanges for date range filters
- **Timezone-Safe Date Handling**: Use direct string concatenation for date parameters (e.g., `${dateString}T00:00:00.000Z`)
- **Avoid Duplicate Load Calls**: Rely on BehaviorSubject subscriptions for initial data load

## Common Pitfalls to Avoid

- **Missing Load Calls**: Components must call loadEntity() in ngOnInit
- **Unhandled Observables**: Always subscribe to returned Observables
- **Subscription Leaks**: Always unsubscribe in ngOnDestroy
- **Timezone Issues**: Use string concatenation for date parameters, not Date.toISOString()
- **Missing Debouncing**: Apply debounceTime to rapid user inputs
- **Duplicate Loads**: Don't call load explicitly when subscription already handles it

## Date and Timezone Handling

- **Timezone-Safe String Concatenation**: Use direct string concatenation instead of Date object conversion
- **Avoid toISOString() for Filters**: Do NOT use new Date(dateString).toISOString() as it converts local time to UTC causing date shifts
- **Correct Pattern**: Use template literal concatenation like `${fromDate}T00:00:00.000Z` to preserve the date
- **Start of Day**: For fromDate/start dates, append T00:00:00.000Z
- **End of Day**: For toDate/end dates, append T23:59:59.999Z
- **Why This Matters**: If user is in IST (UTC+5:30) and selects 2025-11-01, using new Date() would convert to 2025-10-31T18:30:00.000Z
- **API Date Fields**: For entity date fields (like reminder.date), use Date object with proper conversion in API service layer
- **Filter Date Fields**: For filter parameters, use string concatenation to avoid timezone issues
- **Date Input Type**: HTML date inputs return strings in YYYY-MM-DD format, perfect for direct concatenation
