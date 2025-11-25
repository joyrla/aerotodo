import { supabase } from './client';
import { UserPreferences, ReminderSettings } from '@/types';
import { ModuleConfig } from '@/types/modules';

export interface UserSettings {
  preferences: UserPreferences;
  module_configs: ModuleConfig[];
  reminder_settings: ReminderSettings;
  inbox_name: string;
}

// Fetch user settings from Supabase
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no settings exist yet, return null (will use defaults)
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user settings:', error);
    return null;
  }

  return {
    preferences: data.preferences || getDefaultPreferences(),
    module_configs: data.module_configs || [],
    reminder_settings: data.reminder_settings || { presets: [] },
    inbox_name: data.inbox_name || 'Inbox',
  };
}

// Save all user settings to Supabase
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error saving user settings:', error);
    return false;
  }

  return true;
}

// Update specific setting fields
export async function updateUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<boolean> {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      preferences,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating preferences:', error);
    return false;
  }

  return true;
}

export async function updateModuleConfigs(
  userId: string,
  moduleConfigs: ModuleConfig[]
): Promise<boolean> {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      module_configs: moduleConfigs,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating module configs:', error);
    return false;
  }

  return true;
}

export async function updateReminderSettings(
  userId: string,
  reminderSettings: ReminderSettings
): Promise<boolean> {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      reminder_settings: reminderSettings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating reminder settings:', error);
    return false;
  }

  return true;
}

export async function updateInboxName(
  userId: string,
  inboxName: string
): Promise<boolean> {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      inbox_name: inboxName,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating inbox name:', error);
    return false;
  }

  return true;
}

// Helper function for default preferences
function getDefaultPreferences(): UserPreferences {
  return {
    theme: 'system',
    weekStartsOn: 1,
    defaultView: 'week',
    language: 'en',
  };
}

