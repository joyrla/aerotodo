'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserPreferences, ReminderSettings } from '@/types';
import { ModuleConfig } from '@/types/modules';
import { storage } from '@/lib/utils/storage';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  fetchUserSettings, 
  updateUserPreferences, 
  updateModuleConfigs, 
  updateReminderSettings,
  updateInboxName 
} from '@/lib/supabase/settingsSync';

interface SettingsContextType {
  preferences: UserPreferences;
  moduleConfigs: ModuleConfig[];
  reminderSettings: ReminderSettings;
  inboxName: string;
  isLoading: boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setModuleConfigs: (configs: ModuleConfig[]) => void;
  setReminderSettings: (settings: ReminderSettings) => void;
  setInboxName: (name: string) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  weekStartsOn: 1,
  defaultView: 'week',
  language: 'en',
};

const defaultModuleConfigs: ModuleConfig[] = [
  { id: 'overdue', enabled: true, order: 0 },
  { id: 'inbox', enabled: true, order: 1 },
  { id: 'upcoming', enabled: true, order: 2 },
  { id: 'recent-activity', enabled: true, order: 3 },
  { id: 'habit-streak', enabled: false, order: 4 },
  { id: 'pomodoro', enabled: false, order: 5 },
  { id: 'projects', enabled: false, order: 6 },
];

const defaultReminderSettings: ReminderSettings = {
  presets: [],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences);
  const [moduleConfigs, setModuleConfigsState] = useState<ModuleConfig[]>(defaultModuleConfigs);
  const [reminderSettings, setReminderSettingsState] = useState<ReminderSettings>(defaultReminderSettings);
  const [inboxName, setInboxNameState] = useState<string>('Inbox');

  // Load settings from Supabase or localStorage
  useEffect(() => {
    if (authLoading) return;

    const loadSettings = async () => {
      setIsLoading(true);

      if (user) {
        // Load from Supabase
        const settings = await fetchUserSettings(user.id);
        
        if (settings) {
          // Use Supabase settings
          setPreferencesState(settings.preferences || defaultPreferences);
          setModuleConfigsState(settings.module_configs?.length ? settings.module_configs : defaultModuleConfigs);
          setReminderSettingsState(settings.reminder_settings || defaultReminderSettings);
          setInboxNameState(settings.inbox_name || 'Inbox');
          
          // Also update localStorage as cache
          storage.savePreferences(settings.preferences || defaultPreferences);
          storage.saveModuleConfigs(settings.module_configs?.length ? settings.module_configs : defaultModuleConfigs);
          storage.saveReminderSettings(settings.reminder_settings || defaultReminderSettings);
          storage.setInboxName(settings.inbox_name || 'Inbox');
        } else {
          // No settings in Supabase yet, use localStorage and sync to Supabase
          const localPrefs = storage.getPreferences();
          const localModules = storage.getModuleConfigs();
          const localReminders = storage.getReminderSettings();
          const localInbox = storage.getInboxName();
          
          setPreferencesState(localPrefs);
          setModuleConfigsState(localModules);
          setReminderSettingsState(localReminders);
          setInboxNameState(localInbox);
          
          // Sync local settings to Supabase for new users
          await updateUserPreferences(user.id, localPrefs);
          await updateModuleConfigs(user.id, localModules);
          await updateReminderSettings(user.id, localReminders);
          await updateInboxName(user.id, localInbox);
        }
      } else {
        // Guest mode - use localStorage only
        setPreferencesState(storage.getPreferences());
        setModuleConfigsState(storage.getModuleConfigs());
        setReminderSettingsState(storage.getReminderSettings());
        setInboxNameState(storage.getInboxName());
      }

      setIsLoading(false);
    };

    loadSettings();
  }, [user, authLoading]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferencesState(prev => {
      const newPrefs = { ...prev, ...updates };
      
      // Save to localStorage
      storage.savePreferences(newPrefs);
      
      // Sync to Supabase if logged in
      if (user) {
        updateUserPreferences(user.id, newPrefs);
      }
      
      return newPrefs;
    });
  }, [user]);

  // Set module configs
  const setModuleConfigs = useCallback((configs: ModuleConfig[]) => {
    setModuleConfigsState(configs);
    
    // Save to localStorage
    storage.saveModuleConfigs(configs);
    
    // Sync to Supabase if logged in
    if (user) {
      updateModuleConfigs(user.id, configs);
    }
  }, [user]);

  // Set reminder settings
  const setReminderSettings = useCallback((settings: ReminderSettings) => {
    setReminderSettingsState(settings);
    
    // Save to localStorage
    storage.saveReminderSettings(settings);
    
    // Sync to Supabase if logged in
    if (user) {
      updateReminderSettings(user.id, settings);
    }
  }, [user]);

  // Set inbox name
  const setInboxName = useCallback((name: string) => {
    setInboxNameState(name);
    
    // Save to localStorage
    storage.setInboxName(name);
    
    // Sync to Supabase if logged in
    if (user) {
      updateInboxName(user.id, name);
    }
  }, [user]);

  const value: SettingsContextType = {
    preferences,
    moduleConfigs,
    reminderSettings,
    inboxName,
    isLoading,
    updatePreferences,
    setModuleConfigs,
    setReminderSettings,
    setInboxName,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

