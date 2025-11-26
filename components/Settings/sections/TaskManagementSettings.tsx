'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/utils/storage';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { SettingsSection } from '../SettingsSection';
import { Trash2, Plus } from 'lucide-react';
import { TimePreset } from '@/types';

export function TaskManagementSettings() {
  const { timePresets, updateTimePresets } = useCalendar();
  const [moveCompletedToBottom, setMoveCompletedToBottom] = useState(false);
  const [autoTrashCompleted, setAutoTrashCompleted] = useState(false);

  useEffect(() => {
    setMoveCompletedToBottom(storage.get('aerotodo_move_completed_to_bottom', false));
    setAutoTrashCompleted(storage.get('aerotodo_auto_trash_completed', false));
  }, []);

  const handleToggle = (key: string, value: boolean) => {
    storage.set(key, value);
    if (key === 'aerotodo_move_completed_to_bottom') {
      window.location.reload();
    }
  };

  const handleUpdatePreset = (index: number, field: keyof TimePreset, value: string | number) => {
    const newPresets = [...timePresets];
    newPresets[index] = { ...newPresets[index], [field]: value };
    updateTimePresets(newPresets);
  };

  const handleAddPreset = () => {
    const newPreset: TimePreset = {
      id: `preset-${Date.now()}`,
      label: '45m',
      minutes: 45
    };
    updateTimePresets([...timePresets, newPreset]);
  };

  const handleRemovePreset = (index: number) => {
    const newPresets = timePresets.filter((_, i) => i !== index);
    updateTimePresets(newPresets);
  };

  return (
    <SettingsSection
      title="Task Management"
      description="Configure task behavior and organization"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="move-completed"
            checked={moveCompletedToBottom}
            onCheckedChange={(checked) => {
              setMoveCompletedToBottom(checked as boolean);
              handleToggle('aerotodo_move_completed_to_bottom', checked as boolean);
            }}
            className="mt-1"
          />
          <div className="space-y-1 flex-1">
            <Label htmlFor="move-completed" className="text-sm font-mono cursor-pointer">
              Move completed tasks to bottom
            </Label>
            <p className="text-xs text-muted-foreground font-mono">
              Automatically move finished tasks to a separate "Finished" section
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="auto-trash"
            checked={autoTrashCompleted}
            onCheckedChange={(checked) => {
              setAutoTrashCompleted(checked as boolean);
              handleToggle('aerotodo_auto_trash_completed', checked as boolean);
            }}
            className="mt-1"
          />
          <div className="space-y-1 flex-1">
            <Label htmlFor="auto-trash" className="text-sm font-mono cursor-pointer">
              Auto-trash completed tasks
            </Label>
            <p className="text-xs text-muted-foreground font-mono">
              Automatically delete tasks 3 seconds after they are completed
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-mono">Time Blocking Presets</Label>
              <p className="text-xs text-muted-foreground font-mono">
                Customize the quick-add duration buttons
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddPreset} className="h-7 px-2 text-xs font-mono">
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {timePresets.map((preset, index) => (
              <div key={preset.id} className="flex gap-2 items-center">
                <Input
                  value={preset.label}
                  onChange={(e) => handleUpdatePreset(index, 'label', e.target.value)}
                  className="w-20 h-8 text-xs font-mono"
                  placeholder="Label"
                />
                <Input
                  type="number"
                  value={preset.minutes}
                  onChange={(e) => handleUpdatePreset(index, 'minutes', parseInt(e.target.value) || 0)}
                  className="w-20 h-8 text-xs font-mono"
                  placeholder="Mins"
                />
                <span className="text-xs text-muted-foreground font-mono">min</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePreset(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

