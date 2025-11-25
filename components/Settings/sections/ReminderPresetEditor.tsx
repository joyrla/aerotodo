'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReminderPreset } from '@/types';
import { Clock, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderPresetEditorProps {
  preset: ReminderPreset;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onToggle: () => void;
  onUpdate: (updates: Partial<ReminderPreset>) => void;
  onDelete: () => void;
}

export function ReminderPresetEditor({
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

