'use client';

import { TaskColor } from '@/types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback, useEffect } from 'react';
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

// Premium magnetic color button with smooth spring physics
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
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0, scale: 1 });
  const currentRef = useRef({ x: 0, y: 0, scale: 1 });
  const velocityRef = useRef({ x: 0, y: 0, scale: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isHovered, setIsHovered] = useState(false);
  
  const isDefault = color === 'default';
  const colorValue = TASK_COLORS[color];
  const previewColor = isDefault ? 'transparent' : hexToRgba(colorValue, 0.5);

  // Spring physics animation loop
  useEffect(() => {
    const springStrength = 0.15; // How fast it catches up
    const damping = 0.75; // How quickly it settles (lower = more bouncy)
    
    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const velocity = velocityRef.current;
      
      // Calculate spring force
      const forceX = (target.x - current.x) * springStrength;
      const forceY = (target.y - current.y) * springStrength;
      const forceScale = (target.scale - current.scale) * springStrength;
      
      // Apply force to velocity
      velocity.x += forceX;
      velocity.y += forceY;
      velocity.scale += forceScale;
      
      // Apply damping
      velocity.x *= damping;
      velocity.y *= damping;
      velocity.scale *= damping;
      
      // Update position
      current.x += velocity.x;
      current.y += velocity.y;
      current.scale += velocity.scale;
      
      // Check if we should stop animating
      const isSettled = 
        Math.abs(velocity.x) < 0.001 && 
        Math.abs(velocity.y) < 0.001 && 
        Math.abs(velocity.scale) < 0.001 &&
        Math.abs(target.x - current.x) < 0.01 &&
        Math.abs(target.y - current.y) < 0.01 &&
        Math.abs(target.scale - current.scale) < 0.001;
      
      setTransform({ 
        x: current.x, 
        y: current.y, 
        scale: current.scale 
      });
      
      if (!isSettled) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Distance from cursor to center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic pull - follows cursor within bounds
    const magnetStrength = 0.4;
    const maxPull = 5;
    
    const pullX = Math.max(-maxPull, Math.min(maxPull, distanceX * magnetStrength));
    const pullY = Math.max(-maxPull, Math.min(maxPull, distanceY * magnetStrength));
    
    targetRef.current = { x: pullX, y: pullY, scale: 1.18 };
    setIsHovered(true);
    
    // Start animation if not running
    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(() => {
        animationRef.current = null;
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0, scale: 1 };
    setIsHovered(false);
    
    // Start animation if not running
    if (animationRef.current === null) {
      animationRef.current = requestAnimationFrame(() => {
        animationRef.current = null;
      });
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    // Quick scale down on press for tactile feedback
    targetRef.current = { ...targetRef.current, scale: 1.05 };
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isHovered) {
      targetRef.current = { ...targetRef.current, scale: 1.18 };
    }
  }, [isHovered]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={cn(
        'w-7 h-7 rounded-md relative will-change-transform',
        'focus:outline-none',
        isDefault && 'border border-dashed border-muted-foreground/40'
      )}
      style={{
        backgroundColor: previewColor,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        boxShadow: isHovered 
          ? `0 ${4 + transform.scale * 2}px ${8 + transform.scale * 4}px ${hexToRgba(colorValue, 0.35)}, 
             0 ${1 + transform.scale}px ${2 + transform.scale}px ${hexToRgba(colorValue, 0.2)},
             inset 0 1px 0 ${hexToRgba('#ffffff', 0.15)}`
          : `inset 0 1px 0 ${hexToRgba('#ffffff', 0.1)}`,
        transition: 'box-shadow 0.2s ease-out, background-color 0.15s',
      }}
    >
      {/* Subtle inner highlight */}
      {isHovered && !isDefault && (
        <div 
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba('#ffffff', 0.2)} 0%, transparent 50%)`,
          }}
        />
      )}
      
      {/* Checkmark for selected */}
      {isSelected && (
        <Check
          className={cn(
            'w-3.5 h-3.5 m-auto relative z-10',
            isDefault ? 'text-muted-foreground' : 'text-foreground'
          )}
          strokeWidth={3}
          style={{
            color: isDefault ? undefined : colorValue,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
            transform: `scale(${isHovered ? 1.1 : 1})`,
            transition: 'transform 0.15s ease-out',
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
