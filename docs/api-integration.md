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
- **Important**: Verify API URL matches your backend server configuration before testing. Update environment.ts if backend runs on different port or protocol

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
- **DashboardComponent**: Calls loadAccounts(), loadCategories(), loadReminders(), and loadTransactions()
- **TransactionsComponent**: Calls loadAccounts(), loadCategories(), and loadTransactions()
- **BudgetComponent**: Calls loadBudgets(), loadCategories(), and loadTransactions()
- **TransactionDialogComponent**: Calls loadAccounts() and loadCategories() when dialog opens, uses getById() for edit mode
- **Dialog Components**: AccountDialog, CategoryDialog, ReminderDialog, BudgetDialog work with parent's loaded data or fetch their own

**Pattern**: Page components load data dependencies in ngOnInit. Dialog components load their own dependencies independently. Edit mode dialogs fetch individual entities via GetById API for latest data.

**Critical**: BudgetComponent MUST call loadTransactions with date range parameters, never without filters. All components loading transactions must include fromDate and toDate for server-side filtering.

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

## Dialog Component Reload Pattern

- **Dialog Independence**: Dialogs load their own data dependencies when opened, reducing coupling with parent components
- **Parent Reload After Success**: When dialog closes with success, parent component explicitly reloads data from API
- **Reload With Filters**: Components reload using their current filter parameters (date range, search terms, etc.)
- **GetById for Edit Mode**: Edit dialogs fetch individual entity via GetById API to ensure displaying latest data
- **No Automatic Reload**: StorageService does NOT automatically reload after CRUD; components control reload timing
- **Error Handling in Dialogs**: Show user-friendly alerts on API failures, keep isSubmitting flag for retry capability
- **Close on Success**: Dialogs close only after successful API response to trigger parent reload flow

**Reload Flow:**
1. User opens dialog
2. Dialog loads dependencies independently
3. User submits form
4. API operation succeeds
5. Dialog closes with success flag
6. Parent component detects success
7. Parent reloads data with current filters
8. BehaviorSubject emits new data
9. All subscribed components update automatically

## Transaction-Specific API Patterns

### Date Range Filtering
- **GetTransactionsRequest Interface**: Supports optional fromDate and toDate parameters
- **ISO String Format**: Dates passed as ISO 8601 strings (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Timezone-Safe Concatenation**: Use direct string concatenation for date range parameters
- **Start/End Times**: fromDate uses T00:00:00.000Z, toDate uses T23:59:59.999Z for inclusive filtering
- **Debouncing Required**: Apply 500ms debounceTime to date range form valueChanges to prevent excessive API calls
- **Mandatory Parameters**: NEVER call loadTransactions without date range parameters - all three components (Dashboard, Transactions, Budget) MUST include fromDate and toDate
- **Performance Critical**: Server-side filtering reduces data transfer and improves response times significantly

### Multiple Component Dependencies
- **Dashboard Pattern**: Loads accounts, categories, reminders, and transactions
- **Transaction Page Pattern**: Loads accounts, categories, and transactions
- **Budget Page Pattern**: Loads categories and transactions for calculation
- **Use combineLatest**: Wait for all dependent streams before rendering to avoid partial data states

### GetById Pattern for Edit Mode
- **Always Fetch Fresh**: Call GetById API when opening edit dialog to ensure latest data
- **Universal Pattern**: All entities support GetById - Account, Category, Reminder, Transaction, Budget
- **Error Handling**: Close dialog with error message if GetById fails
- **Form Population**: Populate form only after successful API response
- **Prevents Stale Edits**: Avoids conflicts from editing cached data that may have changed
- **Loading State Required**: Show loading spinner with isLoading flag while fetching data
- **TypeScript Safety**: Use local constants inside if blocks when accessing optional entity properties

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
- **GetById**: POST with id in request body - ALL entities support this endpoint
- **Create**: POST with entity fields (no id)
- **Update**: POST with id + updated fields
- **Delete**: POST with id in request body

### StorageService Method Completeness
All five entities have complete method coverage in StorageService:
- **Load Methods**: loadAccounts, loadCategories, loadReminders, loadTransactions, loadBudgets
- **GetById Methods**: getReminderById, getBudgetById (Accounts, Categories, Transactions use getById via API directly)
- **Save Methods**: saveAccount, saveCategory, saveReminder, saveTransaction (create/update combined)
- **Dedicated Create/Update**: createBudget, updateBudget (budget uses separate create/update)
- **Delete Methods**: deleteAccount, deleteCategory, deleteReminder, deleteTransaction, deleteBudget
- **Sync Getters**: getAccounts, getCategories, getReminders, getTransactions, getBudgets

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

### Budget-Specific
- GetAll/GetActive accept optional fromDate and toDate for filtering
- Budget model supports multi-category tracking (categories array field)
- Period field uses string literal type for monthly, weekly, yearly, or custom
- Start and end dates define flexible budget periods beyond simple monthly tracking
- Active/inactive status allows temporary budget disabling without deletion
- Create request includes name, amount, period, categories array, and date range
- Update request includes all fields plus isActive boolean for status toggling
- Frontend calculates spending across all assigned categories within date range

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
- **Transaction Loading Without Filters**: NEVER call loadTransactions without fromDate and toDate - this is mandatory for performance
- **Skipping GetById in Edit Mode**: Always fetch fresh data via GetById when opening edit dialogs
- **Missing Loading States**: Edit dialogs must show loading spinner while fetching data from GetById API
- **TypeScript Strict Mode Issues**: Use local constants inside if blocks for optional properties instead of type assertions

## Date and Timezone Handling

### Filter Date Parameters (Date Inputs)

- **Timezone-Safe String Concatenation**: Use direct string concatenation instead of Date object conversion
- **Avoid toISOString() for Filters**: Do NOT use new Date(dateString).toISOString() as it converts local time to UTC causing date shifts
- **Correct Pattern**: Use template literal concatenation like `${fromDate}T00:00:00.000Z` to preserve the date
- **Start of Day**: For fromDate/start dates, append T00:00:00.000Z
- **End of Day**: For toDate/end dates, append T23:59:59.999Z
- **Why This Matters**: If user is in IST (UTC+5:30) and selects 2025-11-01, using new Date() would convert to 2025-10-31T18:30:00.000Z
- **Date Input Type**: HTML date inputs return strings in YYYY-MM-DD format, perfect for direct concatenation

### Form DateTime Inputs (datetime-local)

- **Critical Issue**: datetime-local inputs return local time strings (YYYY-MM-DDTHH:mm) without timezone info
- **Wrong Pattern**: new Date(formValue.date) + toISOString() causes timezone conversion
- **Example Problem**: User selects 20:20, API receives 14:50 (5.5 hour shift for IST users)
- **Correct Pattern**: Use Date.UTC() to construct Date object that preserves user's selected time
- **Implementation**: Parse datetime string components, create Date with Date.UTC(year, month-1, day, hours, minutes, 0, 0)
- **Why This Works**: Date.UTC() creates Date representing UTC time, so toISOString() outputs exact user selection
- **Display Pattern**: Use local timezone methods (getFullYear, getMonth, getDate, getHours, getMinutes) when showing dates in forms
- **Two Patterns Summary**: Filter dates use string concatenation, form datetime uses Date.UTC()

### API Date Fields

- **For Entity Fields**: Use Date object with proper conversion in API service layer
- **For Filter Parameters**: Use string concatenation to avoid timezone issues
