'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/utils/storage';
import { themes, applyTheme, getCurrentTheme, saveTheme, ThemeName } from '@/lib/utils/themes';
import { ReminderPreset, ReminderSettings } from '@/types';
import { Bell, Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [moveCompletedToBottom, setMoveCompletedToBottom] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('default');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({ presets: [] });
  const [editingPreset, setEditingPreset] = useState<string | null>(null);

  // Load settings from localStorage when modal opens
  useEffect(() => {
    if (open) {
      setMoveCompletedToBottom(storage.get('aerotodo_move_completed_to_bottom', false));
      setSelectedTheme(getCurrentTheme());
      setReminderSettings(storage.getReminderSettings());
      setEditingPreset(null);
    }
  }, [open]);

  // Save to localStorage when changed and trigger reload
  const handleToggleSetting = (checked: boolean) => {
    setMoveCompletedToBottom(checked);
    storage.set('aerotodo_move_completed_to_bottom', checked);
    // Trigger a page refresh to update all TaskLists
    window.location.reload();
  };

  // Handle theme change
  const handleThemeChange = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    saveTheme(themeName);
    
    // Apply the theme immediately
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(themeName, isDark ? 'dark' : 'light');
  };

  // Reminder settings handlers
  const handleReminderSettingsChange = (newSettings: ReminderSettings) => {
    setReminderSettings(newSettings);
    storage.saveReminderSettings(newSettings);
  };

  const handlePresetToggle = (presetId: string) => {
    const updatedPresets = reminderSettings.presets.map(preset =>
      preset.id === presetId ? { ...preset, enabled: !preset.enabled } : preset
    );
    handleReminderSettingsChange({ presets: updatedPresets });
  };

  const handlePresetUpdate = (presetId: string, updates: Partial<ReminderPreset>) => {
    const updatedPresets = reminderSettings.presets.map(preset =>
      preset.id === presetId ? { ...preset, ...updates } : preset
    );
    handleReminderSettingsChange({ presets: updatedPresets });
    setEditingPreset(null);
  };

  const handlePresetDelete = (presetId: string) => {
    const updatedPresets = reminderSettings.presets.filter(preset => preset.id !== presetId);
    handleReminderSettingsChange({ presets: updatedPresets });
  };

  const handleAddPreset = () => {
    const newPreset: ReminderPreset = {
      id: `preset-${Date.now()}`,
      label: 'New reminder',
      type: 'today',
      time: '09:00',
      enabled: true,
    };
    handleReminderSettingsChange({
      presets: [...reminderSettings.presets, newPreset],
    });
    setEditingPreset(newPreset.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <DialogHeader>
          <DialogTitle className="font-mono">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Task Management Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold font-mono">Task Management</h3>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="move-completed"
                checked={moveCompletedToBottom}
                onCheckedChange={(checked) => handleToggleSetting(checked as boolean)}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="move-completed"
                  className="text-sm font-mono cursor-pointer"
                >
                  Move completed tasks to bottom
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  Automatically move finished tasks to a separate "Finished" section
                </p>
              </div>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-mono flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Reminders
              </h3>
              <Button
                onClick={handleAddPreset}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs font-mono"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Preset
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono">
                Customize default reminder times that appear when setting reminders for tasks
              </p>
              
              {reminderSettings.presets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground font-mono border border-dashed border-border rounded">
                  No reminder presets. Click "Add Preset" to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {reminderSettings.presets.map((preset) => (
                    <ReminderPresetEditor
                      key={preset.id}
                      preset={preset}
                      isEditing={editingPreset === preset.id}
                      onEdit={() => setEditingPreset(preset.id)}
                      onCancel={() => setEditingPreset(null)}
                      onToggle={() => handlePresetToggle(preset.id)}
                      onUpdate={(updates) => handlePresetUpdate(preset.id, updates)}
                      onDelete={() => handlePresetDelete(preset.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* View Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold font-mono">Appearance</h3>
            
            <div className="space-y-2">
              <Label htmlFor="theme-select" className="text-sm font-mono">
                Color Theme
              </Label>
              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme-select" className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(themes).map((theme) => (
                    <SelectItem key={theme.name} value={theme.name} className="font-mono">
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-mono">
                Choose your preferred color scheme
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reminder Preset Editor Component
interface ReminderPresetEditorProps {
  preset: ReminderPreset;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onToggle: () => void;
  onUpdate: (updates: Partial<ReminderPreset>) => void;
  onDelete: () => void;
}

function ReminderPresetEditor({
  preset,
  isEditing,
  onEdit,
  onCancel,
  onToggle,
  onUpdate,
  onDelete,
}: ReminderPresetEditorProps) {
  const [label, setLabel] = useState(preset.label);
  const [type, setType] = useState(preset.type);
  const [time, setTime] = useState(preset.time);
  const [offsetDays, setOffsetDays] = useState(preset.offsetDays?.toString() || '1');
  const [offsetHours, setOffsetHours] = useState(preset.offsetHours?.toString() || '1');

  useEffect(() => {
    if (isEditing) {
      setLabel(preset.label);
      setType(preset.type);
      setTime(preset.time);
      setOffsetDays(preset.offsetDays?.toString() || '1');
      setOffsetHours(preset.offsetHours?.toString() || '1');
    }
  }, [isEditing, preset]);

  const handleSave = () => {
    const updates: Partial<ReminderPreset> = {
      label,
      type,
      time,
    };
    
    if (type === 'day-before' || type === 'tomorrow') {
      updates.offsetDays = parseInt(offsetDays) || 1;
    } else if (type === 'relative') {
      updates.offsetHours = parseInt(offsetHours) || 1;
    }
    
    onUpdate(updates);
  };

  if (isEditing) {
    return (
      <div className="border border-border rounded-lg p-3 space-y-3 bg-accent/20">
        <div className="space-y-2">
          <Label className="text-xs font-mono">Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="text-xs font-mono h-8"
            placeholder="e.g., The day before 10pm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-mono">Type</Label>
          <Select value={type} onValueChange={(value: ReminderPreset['type']) => setType(value)}>
            <SelectTrigger className="text-xs font-mono h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day-before" className="font-mono text-xs">Day Before Task</SelectItem>
              <SelectItem value="morning" className="font-mono text-xs">Morning of Task</SelectItem>
              <SelectItem value="today" className="font-mono text-xs">Today</SelectItem>
              <SelectItem value="tomorrow" className="font-mono text-xs">Tomorrow</SelectItem>
              <SelectItem value="relative" className="font-mono text-xs">Relative (e.g., In 1 hour)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(type === 'day-before' || type === 'morning' || type === 'today' || type === 'tomorrow') && (
          <div className="space-y-2">
            <Label className="text-xs font-mono flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Time
            </Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-xs font-mono h-8"
            />
          </div>
        )}

        {(type === 'day-before' || type === 'tomorrow') && (
          <div className="space-y-2">
            <Label className="text-xs font-mono">Days Offset</Label>
            <Input
              type="number"
              value={offsetDays}
              onChange={(e) => setOffsetDays(e.target.value)}
              className="text-xs font-mono h-8"
              min="1"
            />
          </div>
        )}

        {type === 'relative' && (
          <div className="space-y-2">
            <Label className="text-xs font-mono">Hours from now</Label>
            <Input
              type="number"
              value={offsetHours}
              onChange={(e) => setOffsetHours(e.target.value)}
              className="text-xs font-mono h-8"
              min="1"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="flex-1 h-7 text-xs font-mono"
          >
            Save
          </Button>
          <Button
            onClick={onCancel}
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs font-mono"
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="destructive"
            className="h-7 px-2 text-xs font-mono"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 border border-border rounded-lg transition-colors",
      !preset.enabled && "opacity-50"
    )}>
      <Checkbox
        checked={preset.enabled}
        onCheckedChange={onToggle}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{preset.label}</span>
          {preset.type !== 'relative' && preset.time && (
            <span className="text-xs text-muted-foreground font-mono">
              {preset.time}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono mt-0.5">
          {preset.type === 'day-before' && `Day before task at ${preset.time}`}
          {preset.type === 'morning' && `Morning of task at ${preset.time}`}
          {preset.type === 'today' && `Today at ${preset.time}`}
          {preset.type === 'tomorrow' && `Tomorrow at ${preset.time}`}
          {preset.type === 'relative' && `In ${preset.offsetHours || 1} hour(s)`}
        </div>
      </div>
      <Button
        onClick={onEdit}
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 flex-shrink-0"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

