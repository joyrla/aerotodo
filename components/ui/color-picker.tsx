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

// Modern, minimal color palette - 5 essential colors
const colorOptions: Array<{ color: TaskColor; value: string; label: string }> = [
  { color: 'default', value: 'transparent', label: 'None' },
  { color: 'blue', value: '#3b82f6', label: 'Blue' },
  { color: 'green', value: '#10b981', label: 'Green' },
  { color: 'yellow', value: '#f59e0b', label: 'Yellow' },
  { color: 'red', value: '#ef4444', label: 'Red' },
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
      
      {/* Horizontal Color Menu */}
      <div
        className={cn(
          'absolute right-full top-1/2 -translate-y-1/2 mr-2 flex items-center',
          'bg-background/95 backdrop-blur-sm border border-border rounded shadow-sm',
          'px-1.5 py-0.5 gap-1',
          'transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 translate-x-4 pointer-events-none'
        )}
      >
        {colorOptions.map(({ color, value, label }) => {
          const isSelected = selectedColor === color;
          return (
            <button
              key={color}
              className={cn(
                'w-5 h-5 rounded border transition-all duration-150 flex items-center justify-center',
                'hover:scale-110 hover:ring-1 hover:ring-offset-1 hover:ring-foreground/20',
                isSelected
                  ? 'ring-1 ring-offset-1 ring-foreground/30 scale-110'
                  : 'border-border/50 hover:border-foreground/40'
              )}
              style={{
                backgroundColor: value === 'transparent' ? 'transparent' : value,
                borderColor: isSelected && value !== 'transparent' ? value : undefined,
              }}
              onClick={() => handleColorSelect(color)}
              title={label}
            >
              {isSelected && value !== 'transparent' && (
                <Check className="w-2.5 h-2.5 text-white drop-shadow-md" strokeWidth={3} />
              )}
              {value === 'transparent' && isSelected && (
                <div className="w-2 h-2 rounded-full border border-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

