# Entity Migration Checklist: localStorage to Backend API

This comprehensive checklist guides you through migrating an entity from localStorage to backend REST API. Following this process ensures consistent implementation and avoids common pitfalls.

## Pre-Migration Phase

### 1. Identify Scope and Dependencies

- [ ] List all components that consume this entity
- [ ] Identify components that create/update/delete this entity
- [ ] Check which dialogs work with this entity
- [ ] Document current localStorage key being used
- [ ] Review existing entity model interface
- [ ] Identify if entity has date/datetime fields requiring special handling
- [ ] Check if entity requires filtering capabilities (date range, search, etc.)

### 2. API Endpoint Documentation

- [ ] Verify API base URL in environment files
- [ ] Document all required API endpoints (GetAll, GetById, Create, Update, Delete)
- [ ] Identify any special endpoints (GetActive, filtering endpoints, etc.)
- [ ] Note the HTTP method for each endpoint (typically all POST)
- [ ] Document request/response payload structures
- [ ] Identify any enum fields that need string literal conversion

## Implementation Phase

### 3. Create Request/Response Interfaces

- [ ] Open the entity model file (e.g., entity-name.model.ts)
- [ ] Create CreateEntityRequest interface with:
  - All required fields for creation (exclude id)
  - Use string literal types for enums (e.g., 'income' | 'expense')
  - Use string for Date fields (ISO 8601 format)
- [ ] Create UpdateEntityRequest interface with:
  - id field (number type)
  - All updatable fields
  - Same type rules as CreateEntityRequest
- [ ] Create GetEntityRequest interface if filtering is needed:
  - Optional filter parameters (fromDate, toDate, searchTerm, etc.)
  - Use string type for date parameters

### 4. Create API Service

- [ ] Create new file: src/app/services/entity-name-api.service.ts
- [ ] Add @Injectable({ providedIn: 'root' })
- [ ] Inject HttpClient in constructor
- [ ] Set private readonly apiUrl using environment.apiUrl
- [ ] Implement getAll() method - POST with optional filter parameters
- [ ] Implement getById() method - POST with id in body
- [ ] Implement create() method - POST with CreateEntityRequest
- [ ] Implement update() method - POST with UpdateEntityRequest
- [ ] Implement delete() method - POST with id in body
- [ ] Add JSDoc comments for each method
- [ ] Import all required types from models

### 5. Update StorageService

- [ ] Inject the new EntityApiService in constructor
- [ ] Comment out localStorage key for this entity (keep for reference)
- [ ] Change BehaviorSubject initialization from getEntity() to empty array []
- [ ] Create public loadEntity() method:
  - Accept optional filter request parameter
  - Call API service getAll() or equivalent
  - Subscribe with next and error handlers
  - Update BehaviorSubject on success
  - Set empty array on error with console log
- [ ] Update saveEntity() method:
  - Change return type to Observable<Entity>
  - Add isUpdate boolean parameter
  - Wrap in new Observable
  - Build appropriate request object (Create or Update)
  - Convert enum values to lowercase strings if needed
  - Convert Date objects to ISO strings using toISOString()
  - Call appropriate API method (create or update)
  - Do NOT reload automatically
  - Return the result via observer
  - Add error handling
- [ ] Update deleteEntity() method:
  - Change return type to Observable<void>
  - Wrap in new Observable
  - Call API service delete method
  - Do NOT reload automatically
  - Add error handling
- [ ] Keep getEntity() method for synchronous access:
  - Return this.entitySubject.value

### 6. Update All Consuming Components

For each component identified in step 1:

- [ ] Add loadEntity() call in ngOnInit
- [ ] Pass filter parameters if component uses filtering
- [ ] For date-filtered components:
  - Add private loadEntityWithDateRange() method
  - Call it from ngOnInit and on date range changes
  - Apply debounceTime(500) to date range valueChanges
  - Use string concatenation for date parameters

### 7. Update Dialog Components

- [ ] For edit mode dialogs:
  - Inject EntityApiService
  - Change loadEntity() to call getById() API
  - Handle error by closing dialog with alert
- [ ] Update onSubmit() method:
  - Change to subscribe to Observable from saveEntity()
  - Handle both create and update paths
  - Add next handler to close dialog on success
  - Add error handler with user-friendly alert
  - Set isSubmitting = false on error for retry
- [ ] For datetime-local inputs:
  - Create formatDateTimeForAPI() helper method
  - Use Date.UTC() to construct Date object
  - This prevents timezone conversion issues
- [ ] For date inputs (filter dates):
  - Use string concatenation pattern
  - Append T00:00:00.000Z for start dates
  - Append T23:59:59.999Z for end dates

### 8. Update Parent Components (Dialog Callers)

- [ ] Update openAddDialog() method:
  - Subscribe to dialogRef.closed
  - Check for success flag in result
  - Call reload method with current filters on success
- [ ] Update editEntity() method:
  - Subscribe to dialogRef.closed
  - Check for success flag in result
  - Call reload method with current filters on success
- [ ] Update deleteEntity() method:
  - Confirm deletion with user
  - Subscribe to StorageService.deleteEntity()
  - Call reload method on success
  - Show error alert on failure

## Testing Phase

### 9. Functionality Testing

- [ ] Test Create operation:
  - Open add dialog
  - Fill all required fields
  - Submit form
  - Verify API POST request sent
  - Verify dialog closes
  - Verify data reloads and new item appears
  - Verify backend-generated ID is used
- [ ] Test Update operation:
  - Click edit on existing item
  - Verify GetById API called
  - Verify form populated with current data
  - Modify fields
  - Submit form
  - Verify update API called
  - Verify changes reflected in UI
- [ ] Test Delete operation:
  - Click delete on item
  - Confirm deletion
  - Verify delete API called
  - Verify item removed from UI
- [ ] Test date range filtering (if applicable):
  - Change date range
  - Verify debouncing works (wait 500ms)
  - Verify GetAll called with date parameters
  - Verify data updates correctly
- [ ] Test cross-page date sync (if applicable):
  - Change date range on one page
  - Navigate to another date-filtered page
  - Verify same date range applied

### 10. Error Scenario Testing

- [ ] Test with backend unavailable:
  - Stop backend server
  - Try to load data - verify empty state shown
  - Try to create - verify error alert shown
  - Try to update - verify error alert shown
  - Try to delete - verify error alert shown
- [ ] Test with invalid data:
  - Submit form with missing required fields
  - Verify validation prevents submission
- [ ] Test edit with deleted item:
  - Delete item from another session/tab
  - Try to edit same item
  - Verify graceful error handling

### 11. Performance Validation

- [ ] Verify debouncing on date inputs (500ms delay)
- [ ] Check Network tab for duplicate API calls
- [ ] Verify data loads only when needed (lazy loading)
- [ ] Check that navigation between pages doesn't reload unnecessarily
- [ ] Verify subscription cleanup in ngOnDestroy

### 12. Timezone Testing (if entity has dates)

- [ ] For filter dates:
  - Select date in different timezone
  - Verify API receives correct date without shift
- [ ] For datetime form inputs:
  - Select specific time
  - Submit form
  - Verify API receives exact time selected (no timezone shift)
- [ ] Test with users in different timezones:
  - IST (UTC+5:30)
  - EST (UTC-5)
  - PST (UTC-8)

## Post-Migration Phase

### 13. Code Cleanup

- [ ] Remove old localStorage access patterns
- [ ] Remove commented localStorage keys
- [ ] Verify no direct API service calls from components (all via StorageService)
- [ ] Check all TODOs added during migration
- [ ] Update comments to reflect new API pattern

### 14. Documentation Updates

- [ ] Update CLAUDE.md Data Persistence section
- [ ] Update docs/api-integration.md Component-Entity Dependencies
- [ ] Update docs/data-flow.md Data Persistence Strategy
- [ ] Add any new patterns discovered to docs/lessons-learned.md
- [ ] Document any entity-specific quirks or gotchas

### 15. Team Communication

- [ ] Document any breaking changes
- [ ] Update API endpoint documentation
- [ ] Inform team of completed migration
- [ ] Share any new patterns or learnings

## Common Pitfalls Checklist

Avoid these common mistakes during migration:

- [ ] NOT using string literal types for enum fields in API requests
- [ ] NOT using Date.UTC() for datetime-local form inputs
- [ ] NOT using string concatenation for date filter parameters
- [ ] NOT reloading data after successful dialog operations
- [ ] NOT applying debouncing to rapid user inputs
- [ ] NOT injecting API service in dialogs for GetById
- [ ] Loading data in service constructor instead of component ngOnInit
- [ ] Auto-reloading in service after CRUD operations
- [ ] NOT handling errors in dialog submissions
- [ ] NOT cleaning up subscriptions in ngOnDestroy
- [ ] Using cached data for edit mode instead of GetById
- [ ] Forgetting to identify all consuming components
- [ ] NOT testing timezone scenarios for date/datetime fields

## Entity-Specific Considerations

### For Entities with Date Range Filtering

- [ ] Create GetEntityRequest interface with fromDate and toDate
- [ ] Implement date range filtering in component
- [ ] Add DateRangeService integration if needed
- [ ] Apply debounceTime(500) to date form valueChanges
- [ ] Use string concatenation for date parameters

### For Entities with Relationships

- [ ] Identify which related entities need to be loaded
- [ ] Use combineLatest for multiple dependent streams
- [ ] Load dependencies in correct order
- [ ] Handle missing relationships gracefully

### For Entities with Complex Validation

- [ ] Implement dynamic form validation
- [ ] Update validators based on form state changes
- [ ] Call updateValueAndValidity() after validator changes
- [ ] Show specific error messages for each validation rule

## Quick Reference: Migration Duration

Typical timeline for migrating a single entity:

- Small entity (no filtering, simple CRUD): 2-3 hours
- Medium entity (with filtering, date handling): 4-6 hours
- Large entity (complex relationships, multiple components): 6-8 hours

This includes implementation, testing, and documentation updates.

## Next Steps After This Migration

After successfully completing this migration:

1. Apply lessons learned to next entity migration
2. Update this checklist with any new discoveries
3. Consider automating repetitive steps with code generation
4. Share knowledge with team members
5. Plan next entity migration (recommended: Budget → API)
