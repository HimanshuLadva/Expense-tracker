# Implementation Lessons & Best Practices

This document contains key lessons learned and proven patterns from implementation experience.

## API Migration Lessons

### General Patterns
- **Multi-Component Impact**: Always identify ALL consuming components before starting migration
- **String Literal Types**: Provide better type safety than enum types for API contracts
- **Lazy Loading**: Initialize BehaviorSubject with empty array, load on-demand
- **Component Load Pattern**: Every component using entity data needs explicit loadEntity() call in ngOnInit
- **Centralized API Configuration**: Environment file changes apply to all API services

### Date and Timezone Handling
- **Date Type Handling**: Keep Date types in frontend models; handle conversion only in API service layer
- **Timezone Pitfall**: Using new Date(dateString).toISOString() creates timezone conversion issues
- **String Concatenation Solution**: Direct template literal concatenation preserves selected date
- **HTML Date Input Format**: Date inputs return YYYY-MM-DD strings perfect for concatenation

### Server-Side Filtering
- **Performance**: Moving filtering to backend significantly improves performance vs client-side
- **Debouncing Critical**: Use debounceTime(500ms) to prevent excessive API calls
- **Component Reload Ownership**: Components reload with their specific filter parameters
- **Duplicate Load Detection**: BehaviorSubject subscriptions emit immediately; avoid redundant calls

## Proven Patterns

### What Works Well
- **BehaviorSubject Pattern**: Excellent reactive state management
- **Lazy Loading**: Reduces initial load time and unnecessary API calls
- **String Literal Types**: Better than enums for API contracts
- **Debouncing**: Essential for performance with rapid user input
- **Hybrid Data Strategy**: Allows gradual migration without breaking features
- **Environment Configuration**: Easy dev/prod API URL switching

### Common Pitfalls to Avoid
- **Service Constructor Loading**: Causes unnecessary duplicate API calls
- **Enum Serialization**: TypeScript enums don't serialize consistently for APIs
- **Date Object Conversion**: toISOString() causes timezone issues for filter parameters
- **Client-Side Filtering**: Poor performance with large datasets
- **No Debouncing**: Creates excessive API calls during user input

## Architectural Decisions

- **Hybrid Storage**: Allows gradual backend migration without rewriting entire app
- **Number IDs**: Better database compatibility and performance than strings
- **Component Lazy Loading**: Reduces initial bundle size and unnecessary data loads
- **DateRangeService**: Improves UX by persisting date selection across pages
