'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task as TaskType, TaskColor } from '@/types';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { TaskDetailModal } from './TaskDetailModal';
import { Trash2, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TASK_COLORS, getTaskColor, hexToRgba } from '@/components/ui/color-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Magnetic color button with Apple-style cursor attraction
function MagneticColorButton({
  color,
  colorValue,
  previewColor,
  isSelected,
  isDefault,
  onClick,
}: {
  color: TaskColor;
  colorValue: string;
  previewColor: string;
  isSelected: boolean;
  isDefault: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Magnetic pull strength
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

interface TaskProps {
  task: TaskType;
  isDragging?: boolean;
  dragHandleProps?: any;
  narrowOnDrag?: boolean;
  rightContent?: React.ReactNode;
}

export function Task({ task, isDragging, dragHandleProps, narrowOnDrag, rightContent }: TaskProps) {
  const { updateTask, deleteTask, toggleTaskComplete, addTask } = useCalendar();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe state for mobile
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingSwipe = useRef(false);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);

  const handleDelete = useCallback(() => {
    const deletedTask = { ...task };
    const taskName = task.title?.trim() || 'Untitled task';
    deleteTask(task.id);
    toast(`"${taskName}" deleted`, {
      action: {
        label: 'Undo',
        onClick: () => addTask(deletedTask),
      },
    });
  }, [task, deleteTask, addTask]);

  const displayCompleted = optimisticCompleted !== null ? optimisticCompleted : task.completed;

  useEffect(() => {
    if (optimisticCompleted !== null && optimisticCompleted === task.completed) {
      setOptimisticCompleted(null);
    }
  }, [task.completed, optimisticCompleted]);

  const handleClick = (e: React.MouseEvent) => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      const target = e.target as HTMLElement;
      if (!isEditing && !target.closest('button') && !target.closest('input')) {
        setShowDetailModal(true);
      }
    }, 0);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input')) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
      setEditedTitle(task.title);
    }
  };

  const handleSaveEdit = () => {
    setTimeout(() => {
      if (editedTitle.trim()) {
        if (editedTitle.trim() !== task.title) {
          updateTask(task.id, { title: editedTitle.trim() });
        }
      } else {
        setEditedTitle(task.title);
      }
      setIsEditing(false);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const handleColorChange = (color: TaskColor) => {
    setShowColorPicker(false);
    updateTask(task.id, { color });
  };

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Mobile swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (isDragging || isDeleting) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    isDraggingSwipe.current = false;
    directionLocked.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging || isDeleting) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    if (!directionLocked.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      directionLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (directionLocked.current === 'horizontal' && deltaX < 0) {
      isDraggingSwipe.current = true;
      currentXRef.current = touch.clientX;
      const swipeAmount = Math.min(Math.abs(deltaX), 200);
      setTranslateX(-swipeAmount);
    }
  };

  const onTouchEnd = () => {
    if (isDragging || isDeleting) return;
    const deltaX = currentXRef.current - startXRef.current;

    if (directionLocked.current === 'horizontal' && deltaX < -100) {
      setIsDeleting(true);
      setTranslateX(-500);
      setTimeout(handleDelete, 120);
    } else {
      setTranslateX(0);
    }

    isDraggingSwipe.current = false;
    directionLocked.current = null;
  };

  const showSwipeAction = translateX < -20;
  const hasColor = task.color && task.color !== 'default';
  const colorValue = getTaskColor(task.color);

  // Color grid for popover - 4x3 layout matching Google Calendar (11 colors + clear)
  const colorGrid: TaskColor[] = [
    'red', 'pink', 'orange', 'yellow',
    'green', 'teal', 'cyan', 'blue',
    'purple', 'brown', 'gray', 'default',
  ];

  return (
    <>
      {/* Swipe Container */}
      <div
        className="relative overflow-hidden rounded-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Delete Action Background (Mobile) */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-end pr-5 md:hidden',
            'bg-red-500/50 transition-opacity duration-200',
            showSwipeAction ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Trash2 className={cn('w-5 h-5 text-white transition-transform duration-150', translateX < -100 && 'scale-110')} />
        </div>

        {/* Task Card */}
        <div
          {...dragHandleProps}
          data-narrow-drag={isDragging && narrowOnDrag ? 'true' : undefined}
          className={cn(
            'group/task relative cursor-pointer min-h-[44px] md:min-h-[36px] select-none touch-manipulation',
            'py-2.5 md:py-2 px-3 rounded-lg',
            'bg-foreground/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
            'md:active:scale-100',
            !showSwipeAction && !isDragging && 'active:scale-[0.98]',
            !isDragging && !showSwipeAction && 'hover:bg-foreground/[0.06] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)]',
            isDragging && 'task-dragging',
            displayCompleted && !isDragging && 'opacity-50',
            isDragging && narrowOnDrag && 'task-narrow-drag'
          )}
          style={{
            ...(isDragging && narrowOnDrag ? { width: '160px', maxWidth: '160px', minWidth: '160px' } : {}),
            ...(!isDragging && translateX !== 0 ? { transform: `translateX(${translateX}px)` } : {}),
            transition: isDragging ? 'none' : isDraggingSwipe.current ? 'none' : isDeleting ? 'transform 150ms ease-out' : 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Color Highlight Background */}
          {hasColor && (
            <div
              className="absolute inset-0 rounded-lg"
              style={{ backgroundColor: hexToRgba(colorValue, 0.12) }}
            />
          )}

          <div className={cn('flex items-center gap-3 h-full relative z-10', isDragging && narrowOnDrag && 'w-full')}>
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOptimisticCompleted(!displayCompleted);
                toggleTaskComplete(task.id);
              }}
              className={cn('group/checkbox flex-shrink-0 flex items-center justify-center', 'p-3 -m-3 md:p-2 md:-m-2', 'transition-all duration-200 ease-out')}
            >
              <div
                className={cn(
                  'w-5 h-5 md:w-4 md:h-4 rounded-full border flex items-center justify-center',
                  'transition-all duration-200 ease-out',
                  'group-hover/checkbox:scale-110 group-active/checkbox:scale-90',
                  displayCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 group-hover/checkbox:border-primary/60 bg-transparent'
                )}
              >
                {displayCompleted && <Check className="w-3 h-3 md:w-2.5 md:h-2.5" strokeWidth={3} />}
              </div>
            </button>

            {/* Task Title */}
            <div
              className={cn('flex-1 min-w-0 transition-colors', isDragging && narrowOnDrag && 'flex-none')}
              style={{ ...(isDragging && narrowOnDrag ? { maxWidth: '110px', width: '110px' } : {}) }}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className={cn(
                    'w-full bg-transparent border-0 outline-none text-sm font-mono px-0 py-0',
                    'focus:ring-0 placeholder:text-muted-foreground',
                    displayCompleted && 'line-through text-muted-foreground'
                  )}
                  style={{ lineHeight: '1.5' }}
                />
              ) : (
                <div className="flex flex-col w-full">
                  <div
                    className={cn('text-sm font-mono w-full leading-relaxed', displayCompleted ? 'line-through text-muted-foreground' : 'text-foreground')}
                    title="Double-click to edit"
                    style={{ wordBreak: 'break-word' }}
                  >
                    {task.title}
                  </div>
                  {task.timeSlot && task.timeSlot.start && task.timeSlot.end && (
                    <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 leading-tight">
                      {task.timeSlot.start} - {task.timeSlot.end}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Content (e.g., Overdue Badge) */}
            {rightContent && (
              <div className={cn(
                'flex-shrink-0 transition-opacity duration-200',
                'md:group-hover/task:opacity-0',
                showColorPicker && 'md:opacity-0',
                showSwipeAction && 'opacity-0'
              )}>
                {rightContent}
              </div>
            )}

            {/* Desktop: Hover Actions - Sliding pill with Palette + Trash */}
            {!(isDragging && narrowOnDrag) && (
              <div
                className={cn(
                  'absolute right-1 top-1/2 -translate-y-1/2 flex items-center pointer-events-none',
                  'hidden md:flex'
                )}
              >
                <div className={cn(
                  'relative flex items-center transition-all duration-[250ms] ease-out pointer-events-auto',
                  'opacity-0 translate-x-2 group-hover/task:opacity-100 group-hover/task:translate-x-0',
                  'rounded-lg bg-background shadow-sm p-1 gap-1',
                  // Keep visible when color picker is open
                  showColorPicker && 'opacity-100 translate-x-0'
                )}>
                  {/* Highlight Button with Popover */}
                  <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                    <PopoverTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColorPicker(true);
                        }}
                        className={cn(
                          'w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200',
                          'text-muted-foreground hover:text-foreground',
                          'hover:bg-accent hover:scale-110',
                          showColorPicker && !hasColor && 'bg-accent'
                        )}
                        style={{
                          backgroundColor: hasColor ? hexToRgba(colorValue, 0.15) : undefined,
                          color: hasColor ? colorValue : undefined,
                        }}
                        title="Highlight"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="end"
                      className={cn(
                        'w-auto p-1.5 rounded-lg border-border/20 bg-popover/98 backdrop-blur-xl',
                        'shadow-xl shadow-black/15',
                        'animate-in fade-in-0 zoom-in-95 duration-200'
                      )}
                      sideOffset={8}
                    >
                      {/* 4x3 grid - compact magnetic buttons */}
                      <div className="grid grid-cols-4 gap-0.5">
                        {colorGrid.map((color) => {
                          const isSelected = (task.color || 'default') === color;
                          const isDefault = color === 'default';
                          const value = TASK_COLORS[color];
                          const previewColor = isDefault ? 'transparent' : hexToRgba(value, 0.5);

                          return (
                            <MagneticColorButton
                              key={color}
                              color={color}
                              colorValue={value}
                              previewColor={previewColor}
                              isSelected={isSelected}
                              isDefault={isDefault}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColorChange(color);
                              }}
                            />
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className={cn(
                      'w-6 h-6 flex items-center justify-center rounded transition-all duration-200',
                      'text-muted-foreground hover:text-destructive',
                      'hover:bg-accent hover:scale-110'
                    )}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskDetailModal task={task} open={showDetailModal} onOpenChange={setShowDetailModal} />
    </>
  );
}
