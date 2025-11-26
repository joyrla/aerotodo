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
 * Google Calendar color palette (all 11 colors + default/clear)
 * Arranged in 4x3 grid to match Google Calendar's picker
 */
export const TASK_COLORS: Record<TaskColor, string> = {
  default: '#78909c',  // Bluish gray for clear state
  red: '#d50000',      // Tomato
  pink: '#e67c73',     // Flamingo  
  orange: '#f4511e',   // Tangerine
  yellow: '#f6bf26',   // Banana
  green: '#33b679',    // Sage
  teal: '#039be5',     // Peacock
  cyan: '#00acc1',     // Cyan/Pool
  blue: '#4285f4',     // Blueberry
  purple: '#7986cb',   // Lavender
  brown: '#8d6e63',    // Cocoa
  gray: '#616161',     // Graphite
};

/** Get the hex color value for a TaskColor */
export function getTaskColor(color: TaskColor | string): string {
  return TASK_COLORS[color as TaskColor] || TASK_COLORS.default;
}

/** Convert hex to rgba - matches task highlight opacity */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 4x3 grid layout matching Google Calendar (11 colors + clear = 12)
const colorGrid: TaskColor[] = [
  'red', 'pink', 'orange', 'yellow',
  'green', 'teal', 'cyan', 'blue',
  'purple', 'brown', 'gray', 'default',
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
        className={cn(
          'w-auto p-2 rounded-xl border-border/30 bg-popover/95 backdrop-blur-md',
          'shadow-lg shadow-black/10',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
        sideOffset={8}
      >
        {/* 4x3 grid with staggered animation */}
        <div className="grid grid-cols-4 gap-1.5">
          {colorGrid.map((color, index) => {
            const isSelected = selectedColor === color;
            const isDefault = color === 'default';
            const colorValue = TASK_COLORS[color];
            // Use same opacity as task highlight (12%) for preview
            const previewColor = isDefault ? 'transparent' : hexToRgba(colorValue, 0.35);
            const borderColor = isDefault ? 'transparent' : hexToRgba(colorValue, 0.6);

            return (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  'w-7 h-7 rounded-full relative',
                  'transition-all duration-200 ease-out',
                  'hover:scale-110 hover:-translate-y-0.5',
                  'active:scale-95 active:translate-y-0',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  isDefault && 'border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50'
                )}
                style={{
                  backgroundColor: previewColor,
                  borderColor: isDefault ? undefined : borderColor,
                  borderWidth: isDefault ? undefined : '2px',
                  borderStyle: isDefault ? undefined : 'solid',
                  animationDelay: `${index * 20}ms`,
                }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <span 
                    className="absolute inset-[-4px] rounded-full border-2 animate-in zoom-in-50 duration-150"
                    style={{ 
                      borderColor: isDefault ? 'hsl(var(--muted-foreground))' : colorValue,
                    }}
                  />
                )}
                {/* Checkmark */}
                {isSelected && (
                  <Check
                    className={cn(
                      'w-3.5 h-3.5 m-auto relative z-10',
                      'animate-in zoom-in-50 duration-150',
                      isDefault ? 'text-muted-foreground' : 'text-foreground'
                    )}
                    strokeWidth={2.5}
                    style={{
                      color: isDefault ? undefined : colorValue,
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
