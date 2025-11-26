'use client';

import { Task, GoogleCalendarEvent, GoogleCalendar, GoogleCalendarSettings, GoogleCalendarSyncResult } from '@/types';
import { supabase } from '@/lib/supabase/client';

const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Google Calendar API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

// Get client ID from environment
const getClientId = () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const getClientSecret = () => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '';

/**
 * Initiates Google OAuth flow for Calendar access
 */
export async function initiateGoogleCalendarAuth(): Promise<string> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('Google Client ID not configured');
  }

  const redirectUri = `${window.location.origin}/api/google/callback`;
  
  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('gcal_oauth_state', state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `${GOOGLE_OAUTH_BASE}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch('/api/google/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange code for tokens');
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('/api/google/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh token');
  }

  return response.json();
}

/**
 * Make authenticated request to Google Calendar API
 */
async function googleCalendarFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GOOGLE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.error?.message || error.message || 'Google Calendar API error');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * List user's calendars
 */
export async function listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const response = await googleCalendarFetch<{ items: GoogleCalendar[] }>(
    '/users/me/calendarList',
    accessToken
  );
  return response.items || [];
}

/**
 * Get a specific calendar
 */
export async function getCalendar(accessToken: string, calendarId: string): Promise<GoogleCalendar> {
  return googleCalendarFetch<GoogleCalendar>(
    `/calendars/${encodeURIComponent(calendarId)}`,
    accessToken
  );
}

/**
 * List events from a calendar
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
  } = {}
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams();
  if (options.timeMin) params.set('timeMin', options.timeMin);
  if (options.timeMax) params.set('timeMax', options.timeMax);
  if (options.maxResults) params.set('maxResults', options.maxResults.toString());
  if (options.singleEvents !== undefined) params.set('singleEvents', options.singleEvents.toString());

  const response = await googleCalendarFetch<{ items: GoogleCalendarEvent[] }>(
    `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    accessToken
  );
  return response.items || [];
}

/**
 * Create a calendar event
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  return googleCalendarFetch<GoogleCalendarEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(event),
    }
  );
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<GoogleCalendarEvent> {
  return googleCalendarFetch<GoogleCalendarEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(event),
    }
  );
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  await googleCalendarFetch<void>(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: 'DELETE' }
  );
}

/**
 * Convert a Task to a Google Calendar Event
 */
export function taskToGoogleEvent(task: Task): Partial<GoogleCalendarEvent> {
  const event: Partial<GoogleCalendarEvent> = {
    summary: task.title,
    description: task.notes || '',
  };

  // Handle date/time
  if (task.date) {
    if (task.timeSlot?.start && task.timeSlot?.end) {
      // Timed event
      const startDateTime = `${task.date}T${task.timeSlot.start}:00`;
      const endDateTime = `${task.date}T${task.timeSlot.end}:00`;
      
      event.start = {
        dateTime: startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      event.end = {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } else {
      // All-day event
      event.start = { date: task.date };
      event.end = { date: task.endDate || task.date };
    }
  }

  // Handle recurrence
  if (task.repeatPattern) {
    const rruleMap: Record<string, string> = {
      daily: 'RRULE:FREQ=DAILY',
      weekly: 'RRULE:FREQ=WEEKLY',
      monthly: 'RRULE:FREQ=MONTHLY',
      yearly: 'RRULE:FREQ=YEARLY',
    };
    if (rruleMap[task.repeatPattern]) {
      event.recurrence = [rruleMap[task.repeatPattern]];
    }
  }

  // Map task color to Google Calendar color ID
  const colorMap: Record<string, string> = {
    blue: '1',
    green: '2',
    purple: '3',
    red: '4',
    yellow: '5',
    orange: '6',
    teal: '7',
    gray: '8',
    pink: '9',
  };
  if (task.color && colorMap[task.color]) {
    event.colorId = colorMap[task.color];
  }

  return event;
}

/**
 * Convert a Google Calendar Event to a Task
 */
export function googleEventToTask(event: GoogleCalendarEvent, profileId?: string): Partial<Task> {
  const task: Partial<Task> = {
    title: event.summary || 'Untitled Event',
    notes: event.description || '',
    googleCalendarEventId: event.id,
    completed: event.status === 'cancelled',
  };

  // Handle date/time
  if (event.start?.dateTime) {
    // Timed event
    const startDate = new Date(event.start.dateTime);
    const endDate = event.end?.dateTime ? new Date(event.end.dateTime) : startDate;
    
    task.date = startDate.toISOString().split('T')[0];
    task.timeSlot = {
      start: startDate.toTimeString().slice(0, 5),
      end: endDate.toTimeString().slice(0, 5),
    };
  } else if (event.start?.date) {
    // All-day event
    task.date = event.start.date;
    if (event.end?.date && event.end.date !== event.start.date) {
      task.endDate = event.end.date;
    }
  }

  // Map Google Calendar color ID to task color
  const colorMap: Record<string, string> = {
    '1': 'blue',
    '2': 'green',
    '3': 'purple',
    '4': 'red',
    '5': 'yellow',
    '6': 'orange',
    '7': 'teal',
    '8': 'gray',
    '9': 'pink',
  };
  if (event.colorId && colorMap[event.colorId]) {
    task.color = colorMap[event.colorId] as Task['color'];
  }

  // Handle recurrence (basic parsing)
  if (event.recurrence?.length) {
    const rrule = event.recurrence[0];
    if (rrule.includes('FREQ=DAILY')) task.repeatPattern = 'daily';
    else if (rrule.includes('FREQ=WEEKLY')) task.repeatPattern = 'weekly';
    else if (rrule.includes('FREQ=MONTHLY')) task.repeatPattern = 'monthly';
    else if (rrule.includes('FREQ=YEARLY')) task.repeatPattern = 'yearly';
  }

  // Assign to profile if specified
  if (profileId) {
    task.projectId = profileId;
  }

  return task;
}

/**
 * Sync a single task to Google Calendar
 */
export async function syncTaskToGoogleCalendar(
  task: Task,
  accessToken: string,
  calendarId: string
): Promise<string | null> {
  try {
    const event = taskToGoogleEvent(task);

    if (task.googleCalendarEventId) {
      // Update existing event
      const updated = await updateEvent(accessToken, calendarId, task.googleCalendarEventId, event);
      return updated.id;
    } else {
      // Create new event
      const created = await createEvent(accessToken, calendarId, event);
      return created.id;
    }
  } catch (error) {
    console.error('Error syncing task to Google Calendar:', error);
    return null;
  }
}

/**
 * Remove a task from Google Calendar
 */
export async function removeTaskFromGoogleCalendar(
  task: Task,
  accessToken: string,
  calendarId: string
): Promise<boolean> {
  if (!task.googleCalendarEventId) return true;

  try {
    await deleteEvent(accessToken, calendarId, task.googleCalendarEventId);
    return true;
  } catch (error) {
    console.error('Error removing task from Google Calendar:', error);
    return false;
  }
}

/**
 * Full sync: Push all tasks to Google Calendar and pull events back
 */
export async function fullSync(
  tasks: Task[],
  accessToken: string,
  calendarId: string,
  settings: GoogleCalendarSettings,
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void,
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task
): Promise<GoogleCalendarSyncResult> {
  const result: GoogleCalendarSyncResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  try {
    // Debug: Log all tasks and their profile status
    console.log('[GCal Sync] === SYNC DEBUG INFO ===');
    console.log('[GCal Sync] Target profile ID:', settings.profileId);
    console.log('[GCal Sync] Total tasks:', tasks.length);
    
    const tasksWithGcalId = tasks.filter(t => t.googleCalendarEventId);
    const tasksWithoutGcalId = tasks.filter(t => !t.googleCalendarEventId);
    const tasksWithCorrectProfile = tasks.filter(t => t.projectId === settings.profileId);
    const tasksWithWrongProfile = tasks.filter(t => t.googleCalendarEventId && t.projectId !== settings.profileId);
    
    console.log('[GCal Sync] Tasks with googleCalendarEventId:', tasksWithGcalId.length);
    console.log('[GCal Sync] Tasks WITHOUT googleCalendarEventId:', tasksWithoutGcalId.length);
    console.log('[GCal Sync] Tasks already with correct profile:', tasksWithCorrectProfile.length);
    console.log('[GCal Sync] Tasks needing profile update:', tasksWithWrongProfile.length);
    
    // Log details of tasks that need updating
    if (tasksWithWrongProfile.length > 0) {
      console.log('[GCal Sync] Tasks to update:', tasksWithWrongProfile.map(t => ({
        id: t.id,
        title: t.title,
        date: t.date,
        currentProjectId: t.projectId,
        googleCalendarEventId: t.googleCalendarEventId?.substring(0, 20) + '...'
      })));
    }
    
    // IMPORTANT: First, update ALL existing Google Calendar tasks to the selected profile
    // This ensures tasks imported before the profile was set get updated
    if (settings.profileId) {
      const gcalTasks = tasks.filter(t => t.googleCalendarEventId && t.projectId !== settings.profileId);
      console.log('[GCal Sync] Updating profile for', gcalTasks.length, 'GCal tasks...');
      
      for (const task of gcalTasks) {
        try {
          console.log('[GCal Sync] Updating task:', task.title, 'from projectId:', task.projectId, 'to:', settings.profileId);
          onTaskUpdate(task.id, { projectId: settings.profileId });
          result.updated++;
        } catch (error) {
          console.error('[GCal Sync] Failed to update task profile:', task.id, error);
        }
      }
      console.log('[GCal Sync] Profile update complete. Updated:', result.updated, 'tasks');
    }

    // Filter tasks to sync based on settings
    const tasksToSync = tasks.filter(task => {
      if (!task.date) return false; // Don't sync tasks without dates
      if (settings.syncTimeBlockedOnly && !task.timeSlot) return false;
      return true;
    });

    // Push tasks to Google Calendar
    for (const task of tasksToSync) {
      try {
        const eventId = await syncTaskToGoogleCalendar(task, accessToken, calendarId);
        if (eventId && eventId !== task.googleCalendarEventId) {
          onTaskUpdate(task.id, { googleCalendarEventId: eventId });
          if (task.googleCalendarEventId) {
            result.updated++;
          } else {
            result.created++;
          }
        }
      } catch (error) {
        result.errors.push(`Failed to sync task "${task.title}": ${error}`);
      }
    }

    // Two-way sync: Pull events from Google Calendar
    if (settings.twoWaySync) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const events = await listEvents(accessToken, calendarId, {
        timeMin: thirtyDaysAgo.toISOString(),
        timeMax: sixtyDaysAhead.toISOString(),
        singleEvents: true,
        maxResults: 250,
      });

      // Find events not in our tasks - check by googleCalendarEventId
      const existingEventIds = new Set(
        tasks.map(t => t.googleCalendarEventId).filter(Boolean)
      );
      
      // Also create a set of existing tasks by title+date to catch duplicates
      // that might have been created without the googleCalendarEventId
      const existingTaskKeys = new Set(
        tasks.map(t => `${t.title}|${t.date}|${t.timeSlot?.start || ''}`).filter(Boolean)
      );

      for (const event of events) {
        if (event.status === 'cancelled') continue;
        
        // Skip if we already have this event by ID (profile was already updated above)
        if (existingEventIds.has(event.id)) {
          continue;
        }

        // Parse the event to check for duplicate by content
        const taskData = googleEventToTask(event, settings.profileId);
        const taskKey = `${taskData.title || 'Untitled'}|${taskData.date || ''}|${taskData.timeSlot?.start || ''}`;
        
        // Skip if we already have a task with same title, date, and time
        if (existingTaskKeys.has(taskKey)) {
          // Update the existing task with the googleCalendarEventId if missing
          const existingTask = tasks.find(t => 
            t.title === (taskData.title || 'Untitled') && 
            t.date === taskData.date &&
            t.timeSlot?.start === taskData.timeSlot?.start &&
            !t.googleCalendarEventId
          );
          if (existingTask) {
            onTaskUpdate(existingTask.id, { googleCalendarEventId: event.id });
            result.updated++;
          }
          continue;
        }

        // Create new task from Google event
        try {
          console.log('[GCal Sync] Creating new task from event:', {
            eventId: event.id,
            title: taskData.title,
            assignedProfileId: settings.profileId
          });
          
          onTaskCreate({
            title: taskData.title || 'Untitled',
            color: taskData.color || 'default',
            completed: false,
            date: taskData.date || null,
            endDate: taskData.endDate,
            notes: taskData.notes,
            timeSlot: taskData.timeSlot,
            googleCalendarEventId: event.id,
            repeatPattern: taskData.repeatPattern,
            projectId: settings.profileId,
          });
          
          // Add to existing keys to prevent duplicates within the same sync
          existingTaskKeys.add(taskKey);
          existingEventIds.add(event.id);
          
          result.created++;
        } catch (error) {
          result.errors.push(`Failed to import event "${event.summary}": ${error}`);
        }
      }
    }
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`);
  }

  return result;
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  // Clear tokens from user settings
  if (!supabase) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_settings')
    .update({
      preferences: supabase.rpc('jsonb_set_nested', {
        target: 'preferences',
        path: '{googleCalendar}',
        value: JSON.stringify({
          enabled: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          defaultCalendarId: null,
        }),
      }),
    })
    .eq('user_id', user.id);
}

