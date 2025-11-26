'use client';

import { useState, useEffect, useCallback } from 'react';
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
};

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GoogleCalendarSettings>(DEFAULT_GCAL_SETTINGS);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load settings from Supabase
  useEffect(() => {
    if (!user || !supabase) return;

    const loadSettings = async () => {
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
        }
      } catch (error) {
        console.error('Error loading Google Calendar settings:', error);
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

  // Save settings to Supabase
  const saveSettings = useCallback(async (newSettings: GoogleCalendarSettings) => {
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

  // Remove a task from Google Calendar
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
    syncTask,
    unsyncTask,
    performFullSync,
    getValidAccessToken,
  };
}

