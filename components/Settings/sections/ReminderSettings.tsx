'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/utils/storage';
import { ReminderPreset, type ReminderSettings as ReminderSettingsType } from '@/types';
import { Bell, Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '../SettingsSection';
import { ReminderPresetEditor } from './ReminderPresetEditor';

export function ReminderSettings() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettingsType>({ presets: [] });
  const [editingPreset, setEditingPreset] = useState<string | null>(null);

  useEffect(() => {
    setReminderSettings(storage.getReminderSettings());
    setEditingPreset(null);
  }, []);

  return (
    <SettingsSection
      title="Reminders"
      description="Customize default reminder times that appear when setting reminders for tasks"
    >
      {/* Coming Soon Banner */}
      <div className="mb-4 px-3 py-2 bg-muted/50 border border-border rounded-lg">
        <p className="text-xs font-mono text-muted-foreground">
          <span className="font-medium text-foreground">Coming Soon:</span> Reminder notifications will be available in a future update.
        </p>
      </div>

      <div className="space-y-4 opacity-50 pointer-events-none">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-mono">
            Manage your reminder presets
          </p>
          <Button
            disabled
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs font-mono"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Preset
          </Button>
        </div>
        
        {reminderSettings.presets.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground font-mono border border-dashed border-border rounded-lg">
            No reminder presets. Click "Add Preset" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {reminderSettings.presets.map((preset) => (
              <ReminderPresetEditor
                key={preset.id}
                preset={preset}
                isEditing={false}
                onEdit={() => {}}
                onCancel={() => {}}
                onToggle={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
