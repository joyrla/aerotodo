'use client';

import { useState, useRef, useEffect } from 'react';
import { TaskColor } from '@/types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selectedColor: TaskColor;
  onColorChange: (color: TaskColor) => void;
  children?: React.ReactNode;
}

/**
 * Color palette mapped 1-to-1 with Google Calendar colors
 * Google Calendar IDs → Our color names:
 * 1 (Lavender) → blue, 2 (Sage) → green, 3 (Grape) → purple,
 * 4 (Flamingo) → pink, 5 (Banana) → yellow, 6 (Tangerine) → orange,
 * 7 (Peacock) → teal, 8 (Graphite) → gray, 11 (Tomato) → red
 */
export const TASK_COLORS: Record<TaskColor, string> = {
  default: '#9ca3af',  // Muted gray for default
  red: '#d93025',      // Google Tomato - Vibrant red
  orange: '#f4511e',   // Google Tangerine - Warm orange  
  yellow: '#f6bf26',   // Google Banana - Bright yellow
  green: '#0d9488',    // Teal-green - Fresh
  teal: '#039be5',     // Google Peacock - Cyan blue
  blue: '#4285f4',     // Google Blue - Primary blue
  purple: '#7c3aed',   // Google Grape - Rich purple
  pink: '#e91e63',     // Google Flamingo - Vibrant pink
  gray: '#5f6368',     // Google Graphite - Neutral gray
};

/** Get the hex color value for a TaskColor */
export function getTaskColor(color: TaskColor | string): string {
  return TASK_COLORS[color as TaskColor] || TASK_COLORS.default;
}

// Color options organized in a 2-column grid for better UX
const colorOptions: Array<{ color: TaskColor; value: string; label: string }> = [
  { color: 'red', value: TASK_COLORS.red, label: 'Red' },
  { color: 'pink', value: TASK_COLORS.pink, label: 'Pink' },
  { color: 'orange', value: TASK_COLORS.orange, label: 'Orange' },
  { color: 'yellow', value: TASK_COLORS.yellow, label: 'Yellow' },
  { color: 'green', value: TASK_COLORS.green, label: 'Green' },
  { color: 'teal', value: TASK_COLORS.teal, label: 'Teal' },
  { color: 'blue', value: TASK_COLORS.blue, label: 'Blue' },
  { color: 'purple', value: TASK_COLORS.purple, label: 'Purple' },
  { color: 'gray', value: TASK_COLORS.gray, label: 'Gray' },
  { color: 'default', value: 'transparent', label: 'None' },
];

export function ColorPicker({ selectedColor, onColorChange, children }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleColorSelect = (color: TaskColor) => {
    onColorChange(color);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {children || <button className="w-full h-full" />}
      </div>
      
      {/* Color Grid Menu */}
      <div
        className={cn(
          'absolute right-full top-1/2 -translate-y-1/2 mr-3',
          'bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-xl',
          'p-3',
          'transition-all duration-200 ease-out origin-right',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <div className="grid grid-cols-5 gap-2">
          {colorOptions.map(({ color, value, label }) => {
            const isSelected = selectedColor === color;
            const isTransparent = value === 'transparent';
            return (
              <button
                key={color}
                className={cn(
                  'w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center',
                  'hover:scale-110 hover:shadow-md',
                  isSelected && 'ring-2 ring-offset-2 ring-offset-background shadow-sm',
                  isTransparent && 'border-2 border-dashed border-muted-foreground/30'
                )}
                style={{
                  backgroundColor: isTransparent ? 'transparent' : value,
                  ['--tw-ring-color' as string]: isTransparent ? 'hsl(var(--muted-foreground))' : value,
                }}
                onClick={() => handleColorSelect(color)}
                title={label}
              >
                {isSelected && !isTransparent && (
                  <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                )}
                {isTransparent && isSelected && (
                  <Check className="w-4 h-4 text-muted-foreground" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

