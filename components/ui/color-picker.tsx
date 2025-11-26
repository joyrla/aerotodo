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
 * Colors adjusted for clear differentiation, especially reds
 */
export const TASK_COLORS: Record<TaskColor, string> = {
  default: '#78909c',  // Bluish gray for clear state
  red: '#d50000',      // Tomato - pure red
  pink: '#ec407a',     // Flamingo - magenta pink (more distinct from red)
  orange: '#ff9100',   // Tangerine - amber orange (more yellow-orange)
  yellow: '#fdd835',   // Banana - bright yellow
  green: '#43a047',    // Sage - forest green
  teal: '#00897b',     // Peacock - teal green
  cyan: '#00acc1',     // Cyan/Pool - cyan blue
  blue: '#1e88e5',     // Blueberry - bright blue
  purple: '#8e24aa',   // Lavender - vivid purple
  brown: '#6d4c41',    // Cocoa - warm brown
  gray: '#757575',     // Graphite - neutral gray
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
            // Solid fill for clear differentiation - no borders
            const previewColor = isDefault ? 'transparent' : hexToRgba(colorValue, 0.45);

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
