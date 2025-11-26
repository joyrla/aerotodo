'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, GoogleCalendarSettings, GoogleCalendar, GoogleCalendarSyncResult } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  initiateGoogleCalendarAuth,
  listCalendars,
  syncTaskToGoogleCalendar,
  removeTaskFromGoogleCalendar,
  fullSync,
  refreshAccessToken,
} from '@/lib/google/calendar';
import { toast } from 'sonner';

const DEFAULT_GCAL_SETTINGS: GoogleCalendarSettings = {
  enabled: false,
  twoWaySync: false,
  syncAllTasks: false,
  syncTimeBlockedOnly: true,
  deleteFromGcal: true, // Default to deleting from GCal when task is deleted
  treatAsEvents: true, // Default: treat GCal imports as events (exclude from Overdue)
};

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GoogleCalendarSettings>(DEFAULT_GCAL_SETTINGS);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Save settings to Supabase (defined early for use in other effects)
  const saveSettingsToSupabase = useCallback(async (newSettings: GoogleCalendarSettings) => {
    if (!user || !supabase) return;

    try {
      const { data: currentData } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      const currentPrefs = currentData?.preferences || {};

      await supabase
        .from('user_settings')
        .update({
          preferences: {
            ...currentPrefs,
            googleCalendar: newSettings,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving Google Calendar settings:', error);
    }
  }, [user]);

  // Handle OAuth callback - check URL for tokens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    // Check for error
    const error = params.get('gcal_error');
    if (error) {
      toast.error(`Google Calendar error: ${error}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + '?section=integrations');
      return;
    }
    
    // Check for success with tokens in hash
    if (params.get('gcal_success') === 'true' && hash.includes('gcal_tokens=')) {
      try {
        const tokenStr = decodeURIComponent(hash.split('gcal_tokens=')[1]);
        const tokens = JSON.parse(tokenStr);
        
        if (tokens.accessToken && tokens.refreshToken) {
          // Save tokens to settings
          const newSettings: GoogleCalendarSettings = {
            ...settings,
            enabled: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: tokens.tokenExpiry,
          };
          
          setSettings(newSettings);
          setIsConnected(true);
          
          // Save to Supabase if user is logged in
          if (user) {
            saveSettingsToSupabase(newSettings);
          } else {
            // For guest mode, store in localStorage
            localStorage.setItem('gcal_settings', JSON.stringify(newSettings));
          }
          
          toast.success('Connected to Google Calendar!');
        }
      } catch (e) {
        console.error('Error parsing Google Calendar tokens:', e);
        toast.error('Failed to process Google Calendar connection');
      }
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + '?section=integrations');
    }
  }, [user, settings, saveSettingsToSupabase]);

  // Load settings from Supabase or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      // First check localStorage for guest mode
      const localSettings = localStorage.getItem('gcal_settings');
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings) as GoogleCalendarSettings;
          setSettings(parsed);
          setIsConnected(parsed.enabled && !!parsed.accessToken);
        } catch (e) {
          console.error('Error parsing local gcal settings:', e);
        }
      }
      
      // If user is logged in, load from Supabase (overrides local)
      if (user && supabase) {
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('preferences')
            .eq('user_id', user.id)
            .single();

          if (data?.preferences?.googleCalendar) {
            const gcalSettings = data.preferences.googleCalendar as GoogleCalendarSettings;
            setSettings(gcalSettings);
            setIsConnected(gcalSettings.enabled && !!gcalSettings.accessToken);
            
            // Sync to localStorage for backup
            localStorage.setItem('gcal_settings', JSON.stringify(gcalSettings));
          }
        } catch (error) {
          console.error('Error loading Google Calendar settings:', error);
        }
      }
    };

    loadSettings();
  }, [user]);

  // Get valid access token (refresh if needed)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!settings.accessToken || !settings.refreshToken) return null;

    // Check if token is expired
    if (settings.tokenExpiry) {
      const expiry = new Date(settings.tokenExpiry);
      const now = new Date();
      
      // Refresh if less than 5 minutes until expiry
      if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
        try {
          const { accessToken, expiresIn } = await refreshAccessToken(settings.refreshToken);
          const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
          
          // Update settings
          const newSettings = {
            ...settings,
            accessToken,
            tokenExpiry: newExpiry,
          };
          setSettings(newSettings);
          await saveSettings(newSettings);
          
          return accessToken;
        } catch (error) {
          console.error('Error refreshing token:', error);
          toast.error('Google Calendar session expired. Please reconnect.');
          return null;
        }
      }
    }

    return settings.accessToken;
  }, [settings]);

  // Save settings (wrapper that also updates localStorage)
  const saveSettings = useCallback(async (newSettings: GoogleCalendarSettings) => {
    // Always save to localStorage for backup/guest mode
    localStorage.setItem('gcal_settings', JSON.stringify(newSettings));
    
    // Save to Supabase if user is logged in
    await saveSettingsToSupabase(newSettings);
  }, [saveSettingsToSupabase]);

  // Connect to Google Calendar
  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      const authUrl = await initiateGoogleCalendarAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Google Calendar auth:', error);
      toast.error('Failed to connect to Google Calendar');
      setIsLoading(false);
    }
  }, []);

  // Disconnect from Google Calendar
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      const newSettings: GoogleCalendarSettings = {
        ...DEFAULT_GCAL_SETTINGS,
        enabled: false,
      };
      setSettings(newSettings);
      await saveSettings(newSettings);
      setIsConnected(false);
      setCalendars([]);
      toast.success('Disconnected from Google Calendar');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  }, [saveSettings]);

  // Load calendars
  const loadCalendars = useCallback(async () => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return;

    try {
      const cals = await listCalendars(accessToken);
      setCalendars(cals);
    } catch (error) {
      console.error('Error loading calendars:', error);
      toast.error('Failed to load calendars');
    }
  }, [getValidAccessToken]);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<GoogleCalendarSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Sync a single task
  const syncTask = useCallback(async (task: Task): Promise<string | null> => {
    const accessToken = await getValidAccessToken();
    if (!accessToken || !settings.defaultCalendarId) {
      toast.error('Google Calendar not configured');
      return null;
    }

    try {
      const eventId = await syncTaskToGoogleCalendar(task, accessToken, settings.defaultCalendarId);
      if (eventId) {
        toast.success('Task synced to Google Calendar');
      }
      return eventId;
    } catch (error) {
      console.error('Error syncing task:', error);
      toast.error('Failed to sync task');
      return null;
    }
  }, [getValidAccessToken, settings.defaultCalendarId]);

  // Remove a task from Google Calendar (manual unsync - always removes)
  const unsyncTask = useCallback(async (task: Task): Promise<boolean> => {
    const accessToken = await getValidAccessToken();
    if (!accessToken || !settings.defaultCalendarId) return false;

    try {
      const success = await removeTaskFromGoogleCalendar(task, accessToken, settings.defaultCalendarId);
      if (success) {
        toast.success('Task removed from Google Calendar');
      }
      return success;
    } catch (error) {
      console.error('Error removing task:', error);
      toast.error('Failed to remove task from calendar');
      return false;
    }
  }, [getValidAccessToken, settings.defaultCalendarId]);

  // Called when a task is deleted in AeroTodo - respects deleteFromGcal setting
  const onTaskDeleted = useCallback(async (task: Task): Promise<boolean> => {
    // Only delete from GCal if the setting is enabled
    if (!settings.deleteFromGcal) {
      return true; // Skip deletion, return success
    }
    
    // Only proceed if task was synced to GCal
    if (!task.googleCalendarEventId) {
      return true;
    }

    const accessToken = await getValidAccessToken();
    if (!accessToken || !settings.defaultCalendarId) return true;

    try {
      await removeTaskFromGoogleCalendar(task, accessToken, settings.defaultCalendarId);
      return true;
    } catch (error) {
      console.error('Error removing deleted task from GCal:', error);
      // Don't show error toast - task deletion should still proceed
      return true;
    }
  }, [getValidAccessToken, settings.defaultCalendarId, settings.deleteFromGcal]);

  // Full sync
  const performFullSync = useCallback(async (
    tasks: Task[],
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void,
    onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task
  ): Promise<GoogleCalendarSyncResult | null> => {
    const accessToken = await getValidAccessToken();
    if (!accessToken || !settings.defaultCalendarId) {
      toast.error('Google Calendar not configured');
      return null;
    }

    setIsSyncing(true);
    try {
      const result = await fullSync(
        tasks,
        accessToken,
        settings.defaultCalendarId,
        settings,
        onTaskUpdate,
        onTaskCreate
      );

      // Update last sync time
      await updateSettings({ lastSyncAt: new Date().toISOString() });

      if (result.errors.length > 0) {
        toast.warning(`Sync completed with ${result.errors.length} errors`);
      } else {
        toast.success(`Synced ${result.created + result.updated} tasks`);
      }

      return result;
    } catch (error) {
      console.error('Error during full sync:', error);
      toast.error('Sync failed');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [getValidAccessToken, settings, updateSettings]);

  // Load calendars when connected
  useEffect(() => {
    if (isConnected && settings.accessToken) {
      loadCalendars();
    }
  }, [isConnected, settings.accessToken, loadCalendars]);

  // Auto-sync: Set up polling for background sync (every 5 minutes when two-way sync is enabled)
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSyncRef = useRef<number>(0);

  const performBackgroundSync = useCallback(async (
    tasksGetter: () => Task[],
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void,
    onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task
  ) => {
    // Debounce - don't sync more than once per minute
    const now = Date.now();
    if (now - lastAutoSyncRef.current < 60000) {
      return;
    }
    lastAutoSyncRef.current = now;

    const accessToken = await getValidAccessToken();
    if (!accessToken || !settings.defaultCalendarId || !settings.twoWaySync) {
      return;
    }

    try {
      await fullSync(
        tasksGetter(),
        accessToken,
        settings.defaultCalendarId,
        settings,
        onTaskUpdate,
        onTaskCreate
      );
      
      // Update last sync time silently
      await saveSettings({ ...settings, lastSyncAt: new Date().toISOString() });
    } catch (error) {
      console.error('Background sync error:', error);
    }
  }, [getValidAccessToken, settings, saveSettings]);

  // Start/stop auto-sync based on settings
  const startAutoSync = useCallback((
    tasksGetter: () => Task[],
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void,
    onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task,
    intervalMs: number = 5 * 60 * 1000 // 5 minutes default
  ) => {
    // Clear existing interval
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
    }

    if (!isConnected || !settings.twoWaySync) {
      return;
    }

    // Initial sync on start
    performBackgroundSync(tasksGetter, onTaskUpdate, onTaskCreate);

    // Set up interval
    autoSyncRef.current = setInterval(() => {
      performBackgroundSync(tasksGetter, onTaskUpdate, onTaskCreate);
    }, intervalMs);
  }, [isConnected, settings.twoWaySync, performBackgroundSync]);

  const stopAutoSync = useCallback(() => {
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
      autoSyncRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSyncRef.current) {
        clearInterval(autoSyncRef.current);
      }
    };
  }, []);

  return {
    settings,
    calendars,
    isLoading,
    isSyncing,
    isConnected,
    connect,
    disconnect,
    loadCalendars,
    updateSettings,
    onTaskDeleted,
    syncTask,
    unsyncTask,
    performFullSync,
    getValidAccessToken,
    startAutoSync,
    stopAutoSync,
  };
}

