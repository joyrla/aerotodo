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
 * Google Calendar color palette (exact match)
 * Row 1: Tomato, Flamingo, Banana
 * Row 2: Tangerine, Sage, Peacock  
 * Row 3: Blueberry, Lavender, Grape
 * Row 4: Graphite + Clear
 */
export const TASK_COLORS: Record<TaskColor, string> = {
  default: '#78909c',  // Bluish gray for clear state
  red: '#d50000',      // Tomato
  pink: '#e67c73',     // Flamingo
  yellow: '#f4bf00',   // Banana
  orange: '#f4511e',   // Tangerine
  green: '#33b679',    // Sage
  teal: '#039be5',     // Peacock
  blue: '#4285f4',     // Blueberry (default Google blue)
  purple: '#7986cb',   // Lavender
  gray: '#616161',     // Graphite
};

/** Get the hex color value for a TaskColor */
export function getTaskColor(color: TaskColor | string): string {
  return TASK_COLORS[color as TaskColor] || TASK_COLORS.default;
}

// 4x3 grid layout matching Google Calendar order + clear option
// Row 1: Red (Tomato), Pink (Flamingo), Yellow (Banana), Clear
// Row 2: Orange (Tangerine), Green (Sage), Teal (Peacock), -
// Row 3: Blue (Blueberry), Purple (Lavender), Gray (Graphite), -
const colorGrid: TaskColor[] = [
  'red', 'pink', 'yellow', 'default',
  'orange', 'green', 'teal',
  'blue', 'purple', 'gray',
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
        className="w-auto p-1.5 rounded-lg shadow-md border-border/40 bg-popover/98 backdrop-blur-sm"
        sideOffset={6}
      >
        {/* Compact 4-column grid */}
        <div className="grid grid-cols-4 gap-1">
          {colorGrid.map((color) => {
            const isSelected = selectedColor === color;
            const isDefault = color === 'default';
            const colorValue = TASK_COLORS[color];

            return (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  'w-6 h-6 rounded-full transition-transform duration-100',
                  'hover:scale-115 active:scale-95',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  isDefault && 'border border-dashed border-muted-foreground/40'
                )}
                style={{
                  backgroundColor: isDefault ? 'transparent' : colorValue,
                  boxShadow: isSelected 
                    ? `0 0 0 2px var(--popover), 0 0 0 4px ${isDefault ? 'hsl(var(--muted-foreground))' : colorValue}`
                    : undefined,
                }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'w-3 h-3 m-auto',
                      isDefault ? 'text-muted-foreground' : 'text-white'
                    )}
                    strokeWidth={2.5}
                    style={{
                      filter: isDefault ? 'none' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
                    }}
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
