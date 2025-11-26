'use client';

import { TaskColor } from '@/types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';
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

// Magnetic color button with Apple-style cursor attraction
function MagneticColorButton({
  color,
  isSelected,
  onClick,
}: {
  color: TaskColor;
  isSelected: boolean;
  onClick: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  
  const isDefault = color === 'default';
  const colorValue = TASK_COLORS[color];
  const previewColor = isDefault ? 'transparent' : hexToRgba(colorValue, 0.5);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic pull strength - pulls toward cursor
    const magnetStrength = 0.35;
    const maxPull = 4;
    
    const pullX = Math.max(-maxPull, Math.min(maxPull, distanceX * magnetStrength));
    const pullY = Math.max(-maxPull, Math.min(maxPull, distanceY * magnetStrength));
    
    setTransform({ x: pullX, y: pullY, scale: 1.15 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'w-7 h-7 rounded-md relative',
        'transition-[background-color,box-shadow] duration-150',
        'focus:outline-none',
        isDefault && 'border border-dashed border-muted-foreground/40'
      )}
      style={{
        backgroundColor: previewColor,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transition: transform.scale === 1 
          ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s, box-shadow 0.15s' 
          : 'transform 0.1s ease-out, background-color 0.15s, box-shadow 0.15s',
        boxShadow: transform.scale > 1 
          ? `0 4px 12px ${hexToRgba(colorValue, 0.3)}, 0 0 0 1px ${hexToRgba(colorValue, 0.1)}`
          : undefined,
      }}
    >
      {/* Checkmark for selected */}
      {isSelected && (
        <Check
          className={cn(
            'w-3.5 h-3.5 m-auto relative z-10',
            'animate-in zoom-in-50 duration-150',
            isDefault ? 'text-muted-foreground' : 'text-foreground'
          )}
          strokeWidth={3}
          style={{
            color: isDefault ? undefined : colorValue,
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))',
          }}
        />
      )}
    </button>
  );
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
          'w-auto p-1.5 rounded-lg border-border/20 bg-popover/98 backdrop-blur-xl',
          'shadow-xl shadow-black/15',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        sideOffset={8}
      >
        {/* 4x3 grid with magnetic buttons - compact */}
        <div className="grid grid-cols-4 gap-0.5">
          {colorGrid.map((color) => (
            <MagneticColorButton
              key={color}
              color={color}
              isSelected={selectedColor === color}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
