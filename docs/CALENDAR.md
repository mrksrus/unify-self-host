# Calendar - Technical Documentation

## Overview

UniHub implements a calendar system for scheduling events with support for recurring events, all-day events, locations, and color coding.

## Architecture

### Components

- **Database**: MySQL `calendar_events` table
- **Frontend**: React calendar component with date-fns
- **Date Handling**: UTC timestamps, 24-hour format, DD/MM/YYYY display

## Database Schema

### `calendar_events` Table

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- title: VARCHAR(255) NOT NULL
- description: TEXT NULL
- start_time: DATETIME NOT NULL
- end_time: DATETIME NOT NULL
- all_day: BOOLEAN DEFAULT FALSE
- location: VARCHAR(500) NULL
- color: VARCHAR(20) DEFAULT '#22c55e'
- recurrence: VARCHAR(100) NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Indexes**:
- `idx_events_user`: For user-specific queries
- `idx_events_date`: For date range queries

## Date/Time Handling

### Storage Format
- **Database**: `DATETIME` column type
- **Format**: `YYYY-MM-DD HH:MM:SS` (UTC)
- **Timezone**: All times stored in UTC
- **Conversion**: Frontend converts to local time for display

### Display Format
- **Date**: DD/MM/YYYY (European format)
- **Time**: 24-hour format (HH:MM)
- **Week Start**: Monday (European standard)

### Date Conversion

**Backend (server.js)**:
- Receives `datetime-local` input format from frontend
- Converts to UTC: `YYYY-MM-DD HH:MM:SS`
- Stores in database

**Frontend (CalendarPage.tsx)**:
- Uses `date-fns` for formatting
- Converts UTC to local time for display
- Formats dates: `format(date, 'dd/MM/yyyy')`
- Formats times: `format(date, 'HH:mm')`

## Event Management

### Creating Events

**Process**:
1. User fills form (title, start, end, location, color)
2. Frontend sends to `POST /api/calendar/events`
3. Backend validates and converts dates to UTC
4. Event inserted into database
5. Frontend refreshes calendar view

**Validation**:
- Title required
- Start time must be before end time
- Dates must be valid

### Updating Events

- Same process as create
- Validates event ownership (user_id check)
- Updates existing record

### Deleting Events

- Validates ownership
- Deletes from database
- Frontend refreshes view

## Calendar Display

### Month View
- Shows current month
- Displays events on their start date
- Color-coded by event color
- Click to view/edit event

### Event Cards
- Shows title, time, location
- Color indicator
- Hover to see details
- Click to edit/delete

### Navigation
- Previous/Next month buttons
- Today button (jump to current month)
- Month/year selector

## Features

### All-Day Events
- `all_day` flag set to true
- Start/end times set to 00:00:00
- Displayed differently (no time shown)
- Spans full day in calendar

### Location Support
- Stored as text string
- Displayed in event details
- Clickable link (opens maps app on mobile)
- Format: `geo:` or `maps:` URL scheme

### Color Coding
- User-selectable colors
- Predefined palette (green, blue, purple, orange, red, cyan)
- Stored as hex color code
- Visual distinction in calendar

### Recurrence
- Field exists in database
- Not yet implemented in UI
- Future feature for repeating events

## API Endpoints

### `GET /api/calendar/events`
- Returns all events for authenticated user
- Ordered by start_time ASC
- Filtered by user_id

### `POST /api/calendar/events`
- Creates new event
- Validates dates and required fields
- Returns created event

### `PUT /api/calendar/events/:id`
- Updates existing event
- Validates ownership
- Returns updated event

### `DELETE /api/calendar/events/:id`
- Deletes event
- Validates ownership
- Returns success message

### `GET /api/stats`
- Returns upcoming events count
- Used for dashboard display
- Filters: `start_time >= UTC_TIMESTAMP()`

## Dashboard Integration

### Upcoming Events
- Shows count of upcoming events
- Queries events with `start_time >= UTC_TIMESTAMP()`
- Displays on dashboard card
- Links to calendar page

### Date Formatting
- Uses `date-fns` for consistent formatting
- Displays in DD/MM/YYYY format
- 24-hour time format

## Frontend Components

### CalendarPage.tsx
- Main calendar component
- Month view with event display
- Event creation/edit dialogs
- Date navigation

### Event Dialog
- Form for creating/editing events
- Date/time pickers (datetime-local input)
- Color selector
- Location input
- All-day toggle

## Limitations

1. **No Recurrence UI**: Recurrence field exists but not implemented
2. **No Timezone Support**: All times in UTC (no timezone selection)
3. **No Event Reminders**: No notification/alarm system
4. **No Event Sharing**: Events are user-specific only
5. **No Calendar Views**: Only month view (no week/day view)
6. **No Event Search**: No search/filter functionality

## Future Improvements

- Recurring events (daily, weekly, monthly, yearly)
- Timezone support
- Event reminders/notifications
- Week and day views
- Event search and filtering
- Event sharing between users
- Calendar import/export (iCal format)
- Integration with external calendars
- Event attachments
- Event categories/tags
