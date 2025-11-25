import { Task } from '@/types';

/**
 * Google Calendar Integration Utilities
 * 
 * Note: This is a placeholder implementation. In a production app, you would:
 * 1. Set up Google OAuth 2.0 authentication
 * 2. Store access tokens securely
 * 3. Use the Google Calendar API to create/update/delete events
 * 4. Handle token refresh
 */

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Check if Google Calendar is connected
 */
export function isGoogleCalendarConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('aerotodo_google_calendar_connected') === 'true';
}

/**
 * Get Google Calendar access token
 */
export function getGoogleCalendarToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('aerotodo_google_calendar_token');
}

/**
 * Set Google Calendar connection status
 */
export function setGoogleCalendarConnected(connected: boolean, token?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aerotodo_google_calendar_connected', connected.toString());
  if (token) {
    localStorage.setItem('aerotodo_google_calendar_token', token);
  }
}

/**
 * Disconnect Google Calendar
 */
export function disconnectGoogleCalendar(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('aerotodo_google_calendar_connected');
  localStorage.removeItem('aerotodo_google_calendar_token');
}

/**
 * Sync a task to Google Calendar
 * Creates or updates a Google Calendar event
 */
export async function syncTaskToGoogleCalendar(task: Task): Promise<string> {
  const token = getGoogleCalendarToken();
  if (!token) {
    throw new Error('Google Calendar not connected');
  }

  // Build event data
  const eventData = buildCalendarEventFromTask(task);

  let eventId = task.googleCalendarEventId;

  if (eventId) {
    // Update existing event
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Google Calendar event');
    }

    return eventId;
  } else {
    // Create new event
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create Google Calendar event');
    }

    const event = await response.json();
    return event.id;
  }
}

/**
 * Unsync a task from Google Calendar
 * Deletes the Google Calendar event
 */
export async function unsyncTaskFromGoogleCalendar(eventId: string): Promise<void> {
  const token = getGoogleCalendarToken();
  if (!token) {
    throw new Error('Google Calendar not connected');
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete Google Calendar event');
  }
}

/**
 * Build a Google Calendar event from a task
 */
function buildCalendarEventFromTask(task: Task): any {
  const startDate = task.date ? new Date(task.date) : new Date();
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

  const event: any = {
    summary: task.title,
    description: task.notes || '',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  // Add reminder if task has one
  if (task.reminderDate) {
    const reminderDate = new Date(task.reminderDate);
    const minutesBefore = Math.floor((reminderDate.getTime() - startDate.getTime()) / (1000 * 60));
    
    if (minutesBefore > 0) {
      event.reminders = {
        useDefault: false,
        overrides: [
          {
            method: 'popup',
            minutes: minutesBefore,
          },
        ],
      };
    }
  }

  // Add recurrence if task repeats
  if (task.repeatPattern) {
    const recurrenceRule = getRecurrenceRule(task.repeatPattern);
    if (recurrenceRule) {
      event.recurrence = [recurrenceRule];
    }
  }

  return event;
}

/**
 * Get Google Calendar recurrence rule from repeat pattern
 */
function getRecurrenceRule(pattern: string): string | null {
  switch (pattern) {
    case 'daily':
      return 'RRULE:FREQ=DAILY';
    case 'weekly':
      return 'RRULE:FREQ=WEEKLY';
    case 'monthly':
      return 'RRULE:FREQ=MONTHLY';
    case 'yearly':
      return 'RRULE:FREQ=YEARLY';
    default:
      return null;
  }
}

/**
 * Initialize Google Calendar OAuth flow
 * In production, this would redirect to Google OAuth
 */
export function initiateGoogleCalendarAuth(): void {
  // In a real implementation, this would:
  // 1. Redirect to Google OAuth consent screen
  // 2. Handle the callback with authorization code
  // 3. Exchange code for access token
  // 4. Store token securely
  
  // For now, show a placeholder message
  window.alert(
    'Google Calendar integration requires OAuth setup.\n\n' +
    'To implement:\n' +
    '1. Create a Google Cloud project\n' +
    '2. Enable Google Calendar API\n' +
    '3. Set up OAuth 2.0 credentials\n' +
    '4. Implement OAuth flow\n' +
    '5. Store access tokens securely'
  );
}

