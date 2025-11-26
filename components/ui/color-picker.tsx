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
 * Task highlight colors - vibrant, saturated colors that look good as highlights
 * These are the actual colors used for task backgrounds (at ~12% opacity)
 */
export const TASK_COLORS: Record<TaskColor, string> = {
  default: '#9ca3af',  // Gray placeholder
  red: '#dc2626',      // Vibrant red
  orange: '#ea580c',   // Warm orange
  yellow: '#eab308',   // Golden yellow
  green: '#16a34a',    // Fresh green
  teal: '#0891b2',     // Cyan teal
  blue: '#2563eb',     // Strong blue
  purple: '#7c3aed',   // Rich purple
  pink: '#db2777',     // Hot pink
  gray: '#6b7280',     // Neutral gray
};

/** Get the hex color value for a TaskColor */
export function getTaskColor(color: TaskColor | string): string {
  return TASK_COLORS[color as TaskColor] || TASK_COLORS.default;
}

// Color grid layout for the picker
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
  align = 'end',
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
        className="w-auto p-2.5 shadow-lg border-border/50 rounded-xl"
        sideOffset={4}
      >
        {/* Compact 3x4 grid */}
        <div className="grid grid-cols-3 gap-2">
          {colorGrid.map(({ color, label }) => {
            const isSelected = selectedColor === color;
            const isDefault = color === 'default';
            const colorValue = TASK_COLORS[color];

            return (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all duration-150',
                  'hover:scale-110 active:scale-95',
                  'focus:outline-none',
                  isSelected && 'ring-2 ring-offset-2 ring-offset-popover',
                  isDefault && 'border-2 border-dashed border-muted-foreground/30'
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
                      'w-4 h-4 m-auto drop-shadow-sm',
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
