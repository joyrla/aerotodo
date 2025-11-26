# AeroTodo

A clean, fast, open-source task planner.

Plan your day, week, or month with a minimal interface that stays out of your way. No clutter, no distractions—just your tasks.

## Features

**UI**
- Modern, minimal design
- Fast and responsive
- Smooth animations

**Views**
- Day, Week, and Month views
- Time grid schedule view
- Configurable week start (Monday/Sunday)

**Tasks**
- Inline quick-add with natural language date parsing
- Drag and drop reordering and rescheduling
- Color-coded tasks (blue, green, yellow, red)
- Subtasks with checkboxes
- Notes per task
- Recurring tasks (daily, weekly, monthly, yearly)
- Time blocking with time slot picker

**Organization**
- Task modules (Overdue, Inbox, Upcoming, Recent Activity)
- Multiple profiles (Personal, Work, School, custom)
- Renamable inbox

**Navigation**
- Command palette (⌘K)
- Keyboard shortcuts
- Go to today
- Previous/next navigation

**Settings**
- Color themes (Default, Mint)
- Data export/import (JSON backup)
- Guest mode (no sign-up required)

**Integrations**
- Google Calendar sync (two-way)
- Sync individual tasks or all tasks
- Assign imported events to a profile

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Calendar Integration (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Setting up Google Calendar Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://your-domain.com/api/google/callback`
4. Add the Client ID and Secret to your environment variables
5. Enable the Google Calendar API in your Google Cloud project
