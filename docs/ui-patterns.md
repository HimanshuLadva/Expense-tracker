# UI Enhancement and Styling Patterns

This document contains UI/UX patterns, styling standards, and design conventions used throughout the application.

## Currency Display Standards

- **Full Amount Display**: Use standard currency formatting with Indian Rupee (INR) locale
- **Format Pattern**: Intl.NumberFormat with 'en-IN' locale and INR currency
- **Data Table Currency**: All currency columns in data tables display full amounts (₹12,345.00)
- **Stat Cards**: Summary statistics display full formatted currency values
- **No Compact Notation**: Avoid K/M/B notation to ensure clarity and precision in financial data
- **Consistent Application**: Applied uniformly across all pages (Dashboard, Accounts, Transactions, Budget)

## Table Layout and Alignment

- **Header-Data Alignment**: Matching padding values between headers and data
- **Column Spacing**: Balanced spacing with minimum width constraints
- **Text Truncation**: Ellipsis handling for overflow content
- **Responsive Behavior**: Horizontal scrolling with touch support

## Dialog System Standardization

- **Unified Structure**: Consistent header + content + form layout
- **Scrollable Forms**: Fixed action buttons with scrollable content area
- **Mobile Adaptation**: Responsive sizing and touch-friendly interactions
- **Component Completeness**: All CRUD operations have corresponding dialogs

## Mobile-First Design Approach

- **Touch Targets**: Minimum 32px height for interactive elements
- **Horizontal Navigation**: Scrollable tabs and filter options
- **Compact Spacing**: Optimized padding and margins for mobile
- **Progressive Enhancement**: Desktop features enhance mobile base experience

## Data Table First Column Optimization

- **Text Content Support**: First column optimized for text content (titles, names) not just icons
- **Consistent Typography**: First column uses inherit font-size to match other text columns
- **Proper Alignment**: Left-aligned text with proper text overflow handling (ellipsis)
- **Responsive Width**: 120px min-width desktop, 80px mobile with appropriate padding
- **Universal Pattern**: Applied across all table implementations for consistency

## Page Header Component Pattern

- **Content Projection**: Supports ng-content for flexible header actions (filters, buttons, controls)
- **Actions Container**: header-actions wrapper with flexbox layout for right-aligned content
- **Responsive Behavior**: Stacks header actions vertically on mobile (below 768px)
- **Flexible Integration**: Can host date pickers, buttons, or custom controls alongside page title

## Date Range Filter Implementation

- **Form Integration**: ReactiveFormsModule with FormBuilder for date range controls
- **Default Date Range**: Initialize with current month (first to last day) using formatDateForInput helper
- **Real-time Filtering**: Subscribe to valueChanges for automatic data refresh
- **Inclusive Date Logic**: Set end date to end of day (23:59:59.999) for proper date comparisons
- **Comprehensive Filtering**: Apply date filters to all dashboard components (stats, charts, category breakdown)
- **Filter Propagation**: Pass date range to all data calculation methods for consistent filtering
- **Applicable Pages**: Dashboard, Transactions, Reminders (NOT Accounts or Categories)

## Date Range Picker Styling

- **Compact Design**: "Fr:" and "To:" labels (2-character abbreviations for space efficiency)
- **Inline Label Positioning**: Absolute positioning inside input with Verdana font, 0.875rem, 500 weight
- **Input Dimensions**: 170px width, 2.7rem left padding for label space
- **Gap Spacing**: 0.5rem gap between date field wrappers
- **Label Offset**: 0.625rem from left edge of input
- **Consistent Application**: Same styling across date-filtered pages (Dashboard, Transactions, Reminders)

## Global Date Range Synchronization Pattern

- **DateRangeService**: Centralized service managing shared date range state across application
- **Service Architecture**: BehaviorSubject-based with Observable stream (dateRange$)
- **Initial State**: Current month (first to last day) set on service initialization
- **Bidirectional Sync**: Pages update service on local changes AND listen for external changes
- **Update Pattern**: `dateRangeService.updateDateRange(value)` on form valueChanges
- **Listen Pattern**: Subscribe to `dateRangeService.dateRange$` and patchValue with `{ emitEvent: false }`
- **Loop Prevention**: Use `{ emitEvent: false }` when patching form from service to prevent infinite loops
- **Cross-Page Behavior**: Date range changes persist when navigating between pages
- **Data Filtering**: Each page filters its data based on the synchronized date range
- **Constant Entity Pattern**: Accounts and Categories pages do NOT use date filtering - these are constant entities that persist across all time periods

## Dialog Form Scrolling Pattern

- **Form Structure**: Use flexbox layout with form-fields and form-actions sections
- **Scrollable Content**: Apply `max-height: calc(90vh - 200px)` to form-fields container
- **Fixed Actions**: Keep action buttons always visible at bottom without `margin-top: auto`
- **Scroll Container**: form-fields div has `overflow-y: auto` with custom scrollbar styling
- **Custom Scrollbar**: 6px width, rounded thumb, hover effects for better UX
- **Button Visibility**: Ensures Cancel/Submit buttons remain visible when form content expands
- **Consistent Pattern**: Applied across all dialog components (Category, Transaction, Reminder)

## Dashboard Reminder Display Pattern

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

## Responsive Design Standards

- **Breakpoints**: Progressive design (1024px, 768px, 480px)
- **Mobile First**: Touch-friendly interactions and scroll behavior
- **Flexible Layouts**: CSS Grid and Flexbox for adaptive layouts
- **Typography Scaling**: Responsive font sizes across breakpoints

## Form Input Label Standards

- **Inline Labels**: Position labels absolutely inside input boxes for compact design
- **Label Styling**: Verdana font family, 0.875rem size, 500 weight, dark color (#1a1a1a)
- **Typography Consistency**: Ensure consistent font sizing across similar UI elements using inheritance patterns

## Sidebar Navigation Patterns

- **Menu Organization**: Main features first, admin/user features second, profile and logout at bottom
- **Logout Button Positioning**: Always last item in navigation menu with `margin-top: auto` to push to bottom
- **Profile Link Placement**: Positioned above logout button for easy access to user settings
- **Sidebar Visibility Control**: Hide sidebar on authentication pages by checking URL path without query parameters
- **URL Path Extraction**: Use string split on query parameter delimiter to handle URLs with returnUrl or other query strings
- **Mobile Sidebar Adaptation**: Logout button gets left border instead of top border in horizontal mobile layout

## User Profile Page Pattern

- **Route Path**: Use simple `/profile` path for user profile access
- **Display Fields**: Username, email, password (masked), role badge, member since date
- **Password Display**: Show masked dots with security note, never display actual password
- **Role Badge Styling**: Distinct colors for Administrator (yellow) and User (blue) roles
- **Avatar Design**: Large circular gradient avatar at top of profile card
- **Future Actions**: Include disabled placeholder buttons for future features (Edit Profile, Change Password)
- **Reactive Data**: Subscribe to AuthService currentUser$ observable for real-time user data
- **Date Formatting**: Support both Date and string types in date formatting methods for type flexibility

## Design Guidelines

- **Component Standards**: Ensure all CRUD operations have corresponding dialog components
- **Mobile Priority**: Implement touch support and horizontal scrolling for overflow scenarios
- **Table First Column**: Always configure first column for text content with left alignment and inherit font-size
- **Consistent Application**: Apply styling patterns uniformly across all pages
- **Progressive Enhancement**: Desktop features enhance mobile base experience
