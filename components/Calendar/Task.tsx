'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task as TaskType, TaskColor } from '@/types';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { TaskDetailModal } from './TaskDetailModal';
import { Trash2, Palette, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


// Modern, minimal color palette - 5 essential colors with pastel versions
const colorOptions: Array<{ color: TaskColor; value: string; pastelValue: string; label: string }> = [
  { color: 'blue', value: '#3b82f6', pastelValue: 'rgba(59, 130, 246, 0.12)', label: 'Blue' },
  { color: 'green', value: '#10b981', pastelValue: 'rgba(16, 185, 129, 0.12)', label: 'Green' },
  { color: 'yellow', value: '#f59e0b', pastelValue: 'rgba(245, 158, 11, 0.12)', label: 'Yellow' },
  { color: 'red', value: '#ef4444', pastelValue: 'rgba(239, 68, 68, 0.12)', label: 'Red' },
];

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
    // Store task data for undo
    const deletedTask = { ...task };
    const taskName = task.title?.trim() || 'Untitled task';

    // Delete the task
    deleteTask(task.id);

    // Show toast with undo
    toast(`"${taskName}" deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the task with same ID
          addTask(deletedTask);
        }
      }
    });
  }, [task, deleteTask, addTask]);
  
  // Use optimistic state if available, otherwise use task.completed
  const displayCompleted = optimisticCompleted !== null ? optimisticCompleted : task.completed;
  
  // Sync optimistic state with actual task state
  useEffect(() => {
    if (optimisticCompleted !== null && optimisticCompleted === task.completed) {
      setOptimisticCompleted(null);
    }
  }, [task.completed, optimisticCompleted]);

  const handleEdit = (e: React.MouseEvent) => {
    // Delay click to detect if it's part of a double-click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      // Only open modal if not clicking on interactive elements and not editing
      const target = e.target as HTMLElement;
      if (
        !isEditing &&
        !target.closest('button') &&
        !target.closest('input') &&
        !target.closest('[data-delete-button]')
      ) {
        setShowDetailModal(true);
      }
    }, 0); // Instant - no delay
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Cancel the single-click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    // Start inline editing on double-click
    if (
      !(e.target as HTMLElement).closest('button') &&
      !(e.target as HTMLElement).closest('input')
    ) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
      setEditedTitle(task.title);
    }
  };

  const handleSaveEdit = () => {
    // Use setTimeout to ensure blur completes properly
    setTimeout(() => {
      // Always save if there's text
      if (editedTitle.trim()) {
        if (editedTitle.trim() !== task.title) {
          updateTask(task.id, { title: editedTitle.trim() });
        }
      } else {
        // Reset to original if empty
        setEditedTitle(task.title);
      }
      setIsEditing(false);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleColorChange = (color: TaskType['color']) => {
    setShowColorPicker(false);
    updateTask(task.id, { color });
  };

  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  // Get color value for highlighting
  const getColorValue = (color: TaskType['color']): string => {
    const colorMap: Record<TaskType['color'], string> = {
      default: 'transparent',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      orange: '#f97316',
      red: '#ef4444',
      pink: '#ec4899',
      purple: '#a855f7',
      teal: '#14b8a6',
      gray: '#6b7280',
    };
    return colorMap[color];
  };

  // Convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Gmail-style swipe handlers
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
    
    // Lock direction after 10px movement
    if (!directionLocked.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      directionLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }
    
    // Only swipe left (negative deltaX)
    if (directionLocked.current === 'horizontal' && deltaX < 0) {
      isDraggingSwipe.current = true;
      currentXRef.current = touch.clientX;
      // Direct manipulation - no state update during drag for smoothness
      const swipeAmount = Math.min(Math.abs(deltaX), 200);
      setTranslateX(-swipeAmount);
    }
  };

  const onTouchEnd = () => {
    if (isDragging || isDeleting) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    const swipeDistance = Math.abs(deltaX);
    
    // If swiped more than 100px, delete
    if (directionLocked.current === 'horizontal' && deltaX < -100) {
      setIsDeleting(true);
      setTranslateX(-500); // Slide off screen
      setTimeout(() => {
        handleDelete();
      }, 120);
    } else {
      // Snap back
      setTranslateX(0);
    }
    
    isDraggingSwipe.current = false;
    directionLocked.current = null;
  };

  const showSwipeAction = translateX < -20;

  return (
    <>
      {/* Swipe Container */}
      <div 
        className="relative overflow-hidden rounded-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Delete Action Background - revealed on swipe (Mobile only) */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-end pr-5 md:hidden",
            "bg-red-500/50",
            "transition-opacity duration-200",
            showSwipeAction ? "opacity-100" : "opacity-0"
          )}
        >
          <Trash2 className={cn(
            "w-5 h-5 text-white transition-transform duration-150",
            translateX < -100 && "scale-110"
          )} />
        </div>

        {/* Task Card */}
      <div
        {...dragHandleProps}
        data-narrow-drag={isDragging && narrowOnDrag ? 'true' : undefined}
        className={cn(
             'group/task relative cursor-pointer min-h-[44px] md:min-h-[36px] select-none',
             'py-2.5 md:py-2 px-3 rounded-lg',
             'bg-card/50 backdrop-blur-sm',
             'md:overflow-hidden',
             'md:active:scale-100',
             !showSwipeAction && 'active:scale-[0.98]',
             !isDragging && !showSwipeAction && 'hover:bg-accent/40 hover:shadow-sm',
             isDragging
               ? 'shadow-xl ring-1 ring-border/50 bg-background z-50 scale-[1.02]'
               : '',
             displayCompleted && !isDragging && 'opacity-50',
             isDragging && narrowOnDrag && 'task-narrow-drag'
        )}
           style={{
             ...(isDragging && narrowOnDrag ? { width: '160px', maxWidth: '160px', minWidth: '160px' } : {}),
             transform: `translateX(${translateX}px)`,
             transition: isDraggingSwipe.current 
               ? 'none' 
               : isDeleting 
                 ? 'transform 150ms ease-out' 
                 : 'transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
           }}
        onClick={handleEdit}
        onDoubleClick={handleDoubleClick}
      >
         {/* Color Highlight - Full background filling the card */}
         {task.color !== 'default' && (
           <div
             className="absolute inset-0"
             style={{
               backgroundColor: hexToRgba(getColorValue(task.color), 0.12),
               animation: 'scaleHighlight 0.1s cubic-bezier(0.2, 0, 0, 1) forwards',
             }}
           />
         )}

        <div className={cn(
          'flex items-center gap-3 h-full relative z-10',
          isDragging && narrowOnDrag && 'w-full'
        )}>

          {/* Checkbox - Always visible on left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOptimisticCompleted(!displayCompleted);
              toggleTaskComplete(task.id);
            }}
            className={cn(
              'group/checkbox flex-shrink-0 flex items-center justify-center',
              'p-3 -m-3 md:p-2 md:-m-2',
              'transition-all duration-200 ease-out'
            )}
          >
            <div className={cn(
              'w-5 h-5 md:w-4 md:h-4 rounded-full border flex items-center justify-center',
              'transition-all duration-200 ease-out',
              'group-hover/checkbox:scale-110 group-active/checkbox:scale-90',
                displayCompleted
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/40 group-hover/checkbox:border-primary/60 bg-transparent'
            )}>
              {displayCompleted && <Check className="w-3 h-3 md:w-2.5 md:h-2.5" strokeWidth={3} />}
            </div>
            </button>

          {/* Task Title */}
          <div 
            className={cn(
              'flex-1 min-w-0 transition-colors',
              isDragging && narrowOnDrag && 'flex-none'
            )}
            style={{
              ...(isDragging && narrowOnDrag ? { maxWidth: '110px', width: '110px' } : {})
            }}
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
                className={cn(
                    'text-sm font-mono w-full leading-relaxed',
                    displayCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
                title="Double-click to edit"
                  style={{
                    wordBreak: 'break-word'
                  }}
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

          {/* Right Content (e.g. Overdue Badge) */}
          {rightContent && (
            <div className={cn(
              "flex-shrink-0 transition-opacity duration-200",
              "md:group-hover/task:opacity-0",
              showColorPicker && "md:opacity-0",
              showSwipeAction && "opacity-0"
            )}>
              {rightContent}
        </div>
          )}

        {/* Desktop only: Hover actions (hidden on mobile) */}
        {!(isDragging && narrowOnDrag) && (
        <div
          ref={colorPickerRef}
          className={cn(
                 'absolute right-1 top-2 bottom-2 left-[50%] flex items-center justify-end pointer-events-none',
                 'hidden md:flex' // Hide on mobile
          )}
        >
          <div className={cn(
                 'relative flex items-center transition-all duration-[250ms] ease-out pointer-events-auto',
                 'opacity-0 translate-x-2 group-hover/task:opacity-100 group-hover/task:translate-x-0',
                 'rounded-md bg-background shadow-sm py-0.5',
                 showColorPicker ? 'gap-1 pl-1.5 pr-1.5' : 'gap-1 pr-1.5'
          )}>
                 {/* Color Options - Extension to the left */}
            <div
              className={cn(
                     'flex items-center gap-1.5 transition-all duration-100 ease-out overflow-hidden',
                showColorPicker 
                       ? 'opacity-100 max-w-[200px] pointer-events-auto translate-x-0 pl-0.5 pr-2'
                       : 'opacity-0 max-w-0 pointer-events-none -translate-x-2'
              )}
            >
                {colorOptions.map(({ color, pastelValue, label }) => {
                  const isSelected = task.color === color;
                    const isTransparent = color === 'default';
                  return (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorChange(color);
                      }}
                      className={cn(
                          'w-5 h-5 rounded transition-all duration-150 ease-out flex items-center justify-center',
                          'hover:scale-125',
                        isSelected && 'scale-110',
                          isTransparent && 'border border-border/60'
                      )}
                      style={{
                        backgroundColor: pastelValue,
                      }}
                      title={label}
                    >
                        {isSelected && !isTransparent && (
                        <Check 
                          className="w-3 h-3 drop-shadow-sm" 
                          strokeWidth={2.5}
                          style={{ color: getColorValue(color) }}
                        />
                      )}
                    </button>
                  );
                })}
                  {/* Clear Color Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange('default');
                  }}
                  className={cn(
                      'w-5 h-5 rounded transition-all duration-150 ease-out flex items-center justify-center',
                      'hover:scale-125',
                      task.color === 'default' && 'scale-110'
                  )}
                    title="No Color"
                >
                    <X className="w-3 h-3 text-muted-foreground" />
                </button>
            </div>

            {/* Color Picker Button */}
                 <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className={cn(
                       'w-6 h-6 flex items-center justify-center rounded transition-all duration-200',
                'text-muted-foreground hover:text-foreground',
                       'hover:bg-accent hover:scale-110',
                task.color !== 'default' && 'text-foreground/80',
                       showColorPicker && 'bg-accent'
              )}
              style={{
                color: task.color !== 'default' ? getColorValue(task.color) : undefined,
              }}
              title="Change color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete Button */}
                 <div className="flex items-center justify-center">
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
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          </div>
        </div>
        )}
        </div>
        </div>
      </div>

      <TaskDetailModal
        task={task}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </>
  );
}
