'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  value: { start: string; end: string } | null;
  onChange: (timeSlot: { start: string; end: string } | null) => void;
  className?: string;
  hideLabel?: boolean;
}

const QUICK_DURATIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
];

export function TimeSlotPicker({ value, onChange, className, hideLabel = false }: TimeSlotPickerProps) {
  const [startTime, setStartTime] = useState(value?.start || '09:00');
  const [endTime, setEndTime] = useState(value?.end || '10:00');

  const handleStartChange = (time: string) => {
    setStartTime(time);
    onChange({ start: time, end: endTime });
  };

  const handleEndChange = (time: string) => {
    setEndTime(time);
    onChange({ start: startTime, end: time });
  };

  const handleQuickDuration = (minutes: number) => {
    const [hours, mins] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, mins, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + minutes);
    
    const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    setEndTime(endTimeStr);
    onChange({ start: startTime, end: endTimeStr });
  };

  const handleRemove = () => {
    setStartTime('09:00');
    setEndTime('10:00');
    onChange(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className={cn("flex items-center", hideLabel ? "justify-end" : "justify-between")}>
        {!hideLabel && (
          <Label className="text-xs font-mono flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Time Block
          </Label>
        )}
        <Button
          onClick={handleRemove}
          disabled={!value}
          size="sm"
          variant="destructive"
          className={cn(
            "h-6 text-xs font-mono px-2 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive/20 transition-all",
            value ? "opacity-100" : "opacity-50 cursor-not-allowed hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          Remove
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="time"
            value={startTime}
            onChange={(e) => handleStartChange(e.target.value)}
            className={cn(
              "text-xs font-mono h-8 [&::-webkit-calendar-picker-indicator]:hidden bg-background transition-opacity",
              !value && "opacity-40"
            )}
          />
        </div>
        <span className={cn("text-xs text-muted-foreground transition-opacity", !value && "opacity-40")}>to</span>
        <div className="flex-1">
          <Input
            type="time"
            value={endTime}
            onChange={(e) => handleEndChange(e.target.value)}
            className={cn(
              "text-xs font-mono h-8 [&::-webkit-calendar-picker-indicator]:hidden bg-background transition-opacity",
              !value && "opacity-40"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={cn("text-[10px] text-muted-foreground font-mono transition-opacity", !value && "opacity-40")}>Quick:</span>
        {QUICK_DURATIONS.map((duration) => (
          <Button
            key={duration.label}
            onClick={() => handleQuickDuration(duration.minutes)}
            size="sm"
            variant="outline"
            className={cn(
              "h-6 text-[10px] font-mono px-2 hover:bg-accent hover:text-accent-foreground transition-opacity",
              !value && "opacity-40"
            )}
          >
            {duration.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
