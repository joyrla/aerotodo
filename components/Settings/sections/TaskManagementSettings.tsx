'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/utils/storage';
import { SettingsSection } from '../SettingsSection';

export function TaskManagementSettings() {
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
      </div>
    </SettingsSection>
  );
}

