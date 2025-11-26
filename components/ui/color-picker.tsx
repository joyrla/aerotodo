'use client';

import { TaskColor } from '@/types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Color palette mapped 1-to-1 with Google Calendar colors
 * Google Calendar IDs → Our color names:
 * 1 (Lavender) → blue, 2 (Sage) → green, 3 (Grape) → purple,
 * 4 (Flamingo) → pink, 5 (Banana) → yellow, 6 (Tangerine) → orange,
 * 7 (Peacock) → teal, 8 (Graphite) → gray, 11 (Tomato) → red
 */
export const TASK_COLORS: Record<TaskColor, string> = {
  default: '#9ca3af',
  red: '#d93025',
  orange: '#f4511e',
  yellow: '#f6bf26',
  green: '#0d9488',
  teal: '#039be5',
  blue: '#4285f4',
  purple: '#7c3aed',
  pink: '#e91e63',
  gray: '#5f6368',
};

/** Get the hex color value for a TaskColor */
export function getTaskColor(color: TaskColor | string): string {
  return TASK_COLORS[color as TaskColor] || TASK_COLORS.default;
}

// Color grid layout - organized for visual appeal
// Row 1: No color, Red, Yellow
// Row 2: Orange, Green, Teal
// Row 3: Blue, Purple, Pink
// + Gray at bottom
const colorGrid: Array<{ color: TaskColor; label: string }> = [
  { color: 'default', label: 'No color' },
  { color: 'red', label: 'Red' },
  { color: 'yellow', label: 'Yellow' },
  { color: 'orange', label: 'Orange' },
  { color: 'green', label: 'Green' },
  { color: 'teal', label: 'Teal' },
  { color: 'blue', label: 'Blue' },
  { color: 'purple', label: 'Purple' },
  { color: 'pink', label: 'Pink' },
  { color: 'gray', label: 'Gray' },
];

interface ColorPickerProps {
  selectedColor: TaskColor;
  onColorChange: (color: TaskColor) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function ColorPicker({
  selectedColor,
  onColorChange,
  open,
  onOpenChange,
  children,
  side = 'bottom',
  align = 'start',
}: ColorPickerProps) {
  const handleColorSelect = (color: TaskColor) => {
    onColorChange(color);
    onOpenChange?.(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-auto p-3 shadow-xl border-border/50 bg-popover/95 backdrop-blur-xl rounded-2xl"
        sideOffset={8}
      >
        {/* 3x4 grid of color circles - 10 colors, 2 empty slots hidden */}
        <div className="grid grid-cols-3 gap-3">
          {colorGrid.map(({ color, label }) => {
            const isSelected = selectedColor === color;
            const isDefault = color === 'default';
            const colorValue = TASK_COLORS[color];

            return (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  'relative w-9 h-9 rounded-full transition-all duration-150',
                  'hover:scale-110 active:scale-95',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isSelected && 'ring-2 ring-offset-2 ring-offset-popover',
                  isDefault && 'border-2 border-dashed border-muted-foreground/40'
                )}
                style={{
                  backgroundColor: isDefault ? 'transparent' : colorValue,
                  ['--tw-ring-color' as string]: isDefault ? 'hsl(var(--muted-foreground))' : colorValue,
                }}
                title={label}
                aria-label={label}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'absolute inset-0 m-auto w-4 h-4 drop-shadow-sm',
                      isDefault ? 'text-muted-foreground' : 'text-white'
                    )}
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
