import { Task, UserPreferences, ViewMode, ReminderSettings, ReminderPreset, Profile } from '@/types';
import { ModuleConfig } from '@/types/modules';

const STORAGE_KEYS = {
  TASKS: 'aerotodo_tasks',
  PREFERENCES: 'aerotodo_preferences',
  CURRENT_DATE: 'aerotodo_current_date',
  VIEW_MODE: 'aerotodo_view_mode',
  REMINDER_SETTINGS: 'aerotodo_reminder_settings',
  INBOX_NAME: 'aerotodo_inbox_name',
  MODULE_CONFIGS: 'aerotodo_module_configs',
  PROFILES: 'aerotodo_profiles',
  CURRENT_PROFILE: 'aerotodo_current_profile',
} as const;

export const storage = {
  // Generic get/set methods
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
    }
  },

  // Tasks
  getTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    try {
      const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  saveTasks: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  // Preferences
  getPreferences: (): UserPreferences => {
    if (typeof window === 'undefined') {
      return {
        theme: 'system',
        weekStartsOn: 1,
        defaultView: 'week',
        language: 'en',
      };
    }
    try {
      const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        theme: 'system',
        weekStartsOn: 1,
        defaultView: 'week',
        language: 'en',
      };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return {
        theme: 'system',
        weekStartsOn: 1,
        defaultView: 'week',
        language: 'en',
      };
    }
  },

  savePreferences: (preferences: UserPreferences): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  },

  // View Mode
  getViewMode: (): ViewMode => {
    if (typeof window === 'undefined') return 'week';
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      return (mode as ViewMode) || 'week';
    } catch (error) {
      console.error('Error loading view mode:', error);
      return 'week';
    }
  },

  saveViewMode: (mode: ViewMode): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  },

  // Current Date
  getCurrentDate: (): Date => {
    if (typeof window === 'undefined') return new Date();
    try {
      const date = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
      return date ? new Date(date) : new Date();
    } catch (error) {
      console.error('Error loading current date:', error);
      return new Date();
    }
  },

  saveCurrentDate: (date: Date): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, date.toISOString());
    } catch (error) {
      console.error('Error saving current date:', error);
    }
  },

  // Reminder Settings
  getReminderSettings: (): ReminderSettings => {
    if (typeof window === 'undefined') {
      return { presets: getDefaultReminderPresets() };
    }
    try {
      const settings = localStorage.getItem(STORAGE_KEYS.REMINDER_SETTINGS);
      if (settings) {
        return JSON.parse(settings);
      }
      return { presets: getDefaultReminderPresets() };
    } catch (error) {
      console.error('Error loading reminder settings:', error);
      return { presets: getDefaultReminderPresets() };
    }
  },

  saveReminderSettings: (settings: ReminderSettings): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  },

  // Clear all data
  // Inbox name
  getInboxName: (): string => {
    return storage.get<string>(STORAGE_KEYS.INBOX_NAME, 'Inbox');
  },

  setInboxName: (name: string): void => {
    storage.set(STORAGE_KEYS.INBOX_NAME, name);
  },

  // Module Configs
  getModuleConfigs: (): ModuleConfig[] => {
    return storage.get<ModuleConfig[]>(STORAGE_KEYS.MODULE_CONFIGS, getDefaultModuleConfigs());
  },

  saveModuleConfigs: (configs: ModuleConfig[]): void => {
    storage.set(STORAGE_KEYS.MODULE_CONFIGS, configs);
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Default reminder presets
function getDefaultReminderPresets(): ReminderPreset[] {
  return [
    {
      id: 'day-before-10pm',
      label: 'The day before 10pm',
      type: 'day-before',
      time: '22:00',
      offsetDays: 1,
      enabled: true,
    },
    {
      id: 'morning-8am',
      label: 'The morning 8am',
      type: 'morning',
      time: '08:00',
      enabled: true,
    },
    {
      id: 'today-6pm',
      label: 'Today 6pm',
      type: 'today',
      time: '18:00',
      enabled: true,
    },
    {
      id: 'tomorrow-9am',
      label: 'Tomorrow 9am',
      type: 'tomorrow',
      time: '09:00',
      offsetDays: 1,
      enabled: true,
    },
    {
      id: 'in-1-hour',
      label: 'In 1 hour',
      type: 'relative',
      time: '',
      offsetHours: 1,
      enabled: true,
    },
  ];
}

// Default module configurations
function getDefaultModuleConfigs(): ModuleConfig[] {
  return [
    { id: 'overdue', enabled: true, order: 0 },
    { id: 'inbox', enabled: true, order: 1 },
    { id: 'upcoming', enabled: true, order: 2 },
    { id: 'recent-activity', enabled: true, order: 3 },
    // Coming soon modules
    { id: 'habit-streak', enabled: false, order: 4 },
    { id: 'pomodoro', enabled: false, order: 5 },
    { id: 'projects', enabled: false, order: 6 },
  ];
}

// Profile management
export const profileStorage = {
  getProfiles: (): Profile[] => {
    return storage.get<Profile[]>(STORAGE_KEYS.PROFILES, getDefaultProfiles());
  },

  setProfiles: (profiles: Profile[]): void => {
    storage.set(STORAGE_KEYS.PROFILES, profiles);
  },

  getCurrentProfile: (): string => {
    const profiles = profileStorage.getProfiles();
    const currentId = storage.get<string>(STORAGE_KEYS.CURRENT_PROFILE, profiles[0]?.id || 'personal');
    // Verify the profile exists
    const exists = profiles.find(p => p.id === currentId);
    return exists ? currentId : profiles[0]?.id || 'personal';
  },

  setCurrentProfile: (profileId: string): void => {
    storage.set(STORAGE_KEYS.CURRENT_PROFILE, profileId);
  },

  addProfile: (profile: Profile): void => {
    const profiles = profileStorage.getProfiles();
    profileStorage.setProfiles([...profiles, profile]);
  },

  updateProfile: (profileId: string, updates: Partial<Profile>): void => {
    const profiles = profileStorage.getProfiles();
    profileStorage.setProfiles(
      profiles.map(p => p.id === profileId ? { ...p, ...updates } : p)
    );
  },

  deleteProfile: (profileId: string): void => {
    const profiles = profileStorage.getProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    profileStorage.setProfiles(filtered);
    
    // If deleting current profile, switch to first available
    if (profileStorage.getCurrentProfile() === profileId) {
      profileStorage.setCurrentProfile(filtered[0]?.id || 'personal');
    }
  },
};

// Default profiles
function getDefaultProfiles(): Profile[] {
  return [
    {
      id: 'personal',
      name: 'Personal',
      icon: '◯',
      color: 'blue',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'work',
      name: 'Work',
      icon: '◻',
      color: 'purple',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'school',
      name: 'School',
      icon: '△',
      color: 'green',
      createdAt: new Date().toISOString(),
    },
  ];
}

