'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Task as TaskType } from '@/types';
import { format, isSameDay } from 'date-fns';
import { TaskDetailModal } from './TaskDetailModal';
import { toast } from 'sonner';
import { ProductivitySection } from './ProductivitySection';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;
const MOBILE_HOUR_HEIGHT = 52;
const LONG_PRESS_DELAY = 400; // ms to trigger long press

interface DragSelection {
  dateStr: string;
  startHour: number;
  endHour: number;
  isActive: boolean;
}

export function TimeGridWeekView() {
  const { state, filteredTasks: tasks, moveTask, updateTask, addTask, currentProfileId } = useCalendar();
  const { preferences } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; hour: number; dateStr: string } | null>(null);
  const weekDays = dateHelpers.getWeekDays(state.currentDate, preferences.weekStartsOn as 0 | 1);
  const allDays = weekDays;
  
  const hourHeight = isMobile ? MOBILE_HOUR_HEIGHT : HOUR_HEIGHT;

  useEffect(() => {
    setIsMounted(true);
    
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Scroll to 8 AM roughly on mount
    if (scrollContainerRef.current) {
      const h = window.innerWidth < 768 ? MOBILE_HOUR_HEIGHT : HOUR_HEIGHT;
      scrollContainerRef.current.scrollTop = 8 * h - 20;
    }

    // Update current time every minute
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle scroll shadow effect
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 10);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  // Single tap handler - creates 1-hour task and opens detail immediately
  const handleSingleTap = useCallback((dateStr: string, hour: number) => {
    // Create new 1-hour task
    const newTaskData = {
      title: '',
      color: 'default' as const,
      completed: false,
      date: dateStr,
      projectId: currentProfileId,
      timeSlot: {
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`
      }
    };
    
    const createdTask = addTask(newTaskData);
    // Immediately open detail modal
    setSelectedTask(createdTask);
    setShowTaskDetail(true);
  }, [addTask]);

  // Long press start - initiates drag selection
  const handleLongPressStart = useCallback((dateStr: string, hour: number, clientY: number) => {
    setIsLongPressing(true);
    setDragSelection({
      dateStr,
      startHour: hour,
      endHour: hour,
      isActive: true
    });
    // Haptic feedback on mobile if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // Touch/Mouse handlers
  const handleTouchStart = useCallback((dateStr: string, hour: number, e: ReactTouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, hour, dateStr };
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      handleLongPressStart(dateStr, hour, touch.clientY);
    }, LONG_PRESS_DELAY);
  }, [handleLongPressStart]);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0];
    
    // If not long pressing yet, check if moved too much (cancel long press)
    if (!isLongPressing && touchStartRef.current) {
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      if (dx > 10 || dy > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        return;
      }
    }
    
    // If long pressing, update selection based on Y position
    if (isLongPressing && dragSelection && scrollContainerRef.current) {
      e.preventDefault(); // Prevent scroll while dragging
      
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const scrollTop = scrollContainerRef.current.scrollTop;
      const relativeY = touch.clientY - containerRect.top + scrollTop;
      const newHour = Math.max(0, Math.min(23, Math.floor(relativeY / hourHeight)));
      
      if (newHour !== dragSelection.endHour) {
        setDragSelection(prev => prev ? { ...prev, endHour: newHour } : null);
      }
    }
  }, [isLongPressing, dragSelection, hourHeight]);

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If was long pressing, create task with selection
    if (isLongPressing && dragSelection) {
      const startHour = Math.min(dragSelection.startHour, dragSelection.endHour);
      const endHour = Math.max(dragSelection.startHour, dragSelection.endHour) + 1;
      
      const newTaskData = {
        title: '',
        color: 'default' as const,
        completed: false,
        date: dragSelection.dateStr,
        projectId: currentProfileId,
        timeSlot: {
          start: `${startHour.toString().padStart(2, '0')}:00`,
          end: `${endHour.toString().padStart(2, '0')}:00`
        }
      };
      
      const createdTask = addTask(newTaskData);
      setSelectedTask(createdTask);
      setShowTaskDetail(true);
      
      setDragSelection(null);
      setIsLongPressing(false);
    } else if (touchStartRef.current && !isLongPressing) {
      // Single tap
      handleSingleTap(touchStartRef.current.dateStr, touchStartRef.current.hour);
    }
    
    touchStartRef.current = null;
  }, [isLongPressing, dragSelection, addTask, handleSingleTap]);

  // Desktop mouse handlers
  const handleMouseDown = useCallback((dateStr: string, hour: number, e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    touchStartRef.current = { x: e.clientX, y: e.clientY, hour, dateStr };
    
    // Start long press timer for desktop too
    longPressTimerRef.current = setTimeout(() => {
      handleLongPressStart(dateStr, hour, e.clientY);
    }, LONG_PRESS_DELAY);
  }, [handleLongPressStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isLongPressing || !dragSelection || !scrollContainerRef.current) return;
    
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const scrollTop = scrollContainerRef.current.scrollTop;
    const relativeY = e.clientY - containerRect.top + scrollTop;
    const newHour = Math.max(0, Math.min(23, Math.floor(relativeY / hourHeight)));
    
    if (newHour !== dragSelection.endHour) {
      setDragSelection(prev => prev ? { ...prev, endHour: newHour } : null);
    }
  }, [isLongPressing, dragSelection, hourHeight]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (isLongPressing && dragSelection) {
      const startHour = Math.min(dragSelection.startHour, dragSelection.endHour);
      const endHour = Math.max(dragSelection.startHour, dragSelection.endHour) + 1;
      
      const newTaskData = {
        title: '',
        color: 'default' as const,
        completed: false,
        date: dragSelection.dateStr,
        projectId: currentProfileId,
        timeSlot: {
          start: `${startHour.toString().padStart(2, '0')}:00`,
          end: `${endHour.toString().padStart(2, '0')}:00`
        }
      };
      
      const createdTask = addTask(newTaskData);
      setSelectedTask(createdTask);
      setShowTaskDetail(true);
      
      setDragSelection(null);
      setIsLongPressing(false);
    } else if (touchStartRef.current && !isLongPressing) {
      handleSingleTap(touchStartRef.current.dateStr, touchStartRef.current.hour);
    }
    
    touchStartRef.current = null;
  }, [isLongPressing, dragSelection, addTask, handleSingleTap]);

  // Global mouse event listeners for drag
  useEffect(() => {
    if (isLongPressing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isLongPressing, handleMouseMove, handleMouseUp]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    // Handle drops to Productivity Section modules (e.g. inbox, someday)
    if (!destination.droppableId.startsWith('timegrid-')) {
      if (destination.droppableId === 'someday' || destination.droppableId === 'inbox') {
        moveTask(draggableId, null);
        toast.success('Moved to Inbox');
        return;
      }
      // Add other module handlers if necessary
      return;
    }

    // Parse droppableId: "timegrid-{date}-{hour}"
    const [_, dateStr, hourStr] = destination.droppableId.split('-');
    const hour = parseInt(hourStr);
    
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Calculate duration to preserve it
    let duration = 1;
    if (task.timeSlot) {
      const start = parseInt(task.timeSlot.start.split(':')[0]);
      const end = parseInt(task.timeSlot.end.split(':')[0]);
      duration = Math.max(1, end - start);
    }

    // Update task with new date and time
    updateTask(draggableId, {
      date: dateStr,
      timeSlot: {
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${((hour + duration) % 24).toString().padStart(2, '0')}:00`
      }
    });
    
    toast.success(`Rescheduled to ${format(new Date(dateStr), 'MMM d')} at ${hour}:00`);
  };

  // Check if a time slot is occupied by any task (for rendering)
  const getTasksForTimeSlot = useCallback((dateStr: string, hour: number) => {
    return tasks.filter(task => {
      if (task.date !== dateStr || !task.timeSlot) return false;
      const startHour = parseInt(task.timeSlot.start.split(':')[0]);
      return startHour === hour;
    });
  }, [tasks]);

  // Check if a time slot is occupied (including multi-hour tasks)
  const isSlotOccupied = useCallback((dateStr: string, hour: number) => {
    return tasks.some(task => {
      if (task.date !== dateStr || !task.timeSlot) return false;
      const startHour = parseInt(task.timeSlot.start.split(':')[0]);
      const endHour = parseInt(task.timeSlot.end.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
  }, [tasks]);

  const getTaskHeight = useCallback((task: TaskType) => {
    if (!task.timeSlot) return hourHeight - 8;
    const startHour = parseInt(task.timeSlot.start.split(':')[0]);
    const endHour = parseInt(task.timeSlot.end.split(':')[0]);
    const duration = endHour - startHour;
    return (duration * hourHeight) - 8;
  }, [hourHeight]);

  const getColorValue = useCallback((color: string): string => {
    const colorMap: Record<string, string> = {
      default: 'hsl(var(--muted-foreground))',
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
    return colorMap[color] || colorMap.default;
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading schedule...</div>
      </div>
    );
  }

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeTop = currentHour * hourHeight + (currentMinute / 60) * hourHeight;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-background/50 select-none relative">
        {/* Header with days - Sticky */}
        <div className={cn(
          "flex border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-xl z-30 transition-all duration-200",
          isScrolled && "shadow-sm border-border/60"
        )}>
          <div className="w-10 md:w-14 flex-shrink-0 border-r border-border/30 bg-muted/5" />
          
          {allDays.map((day) => {
            const isToday = dateHelpers.isToday(day);
            const dateStr = dateHelpers.toISOString(day);
            
            return (
              <div
                key={dateStr}
                className={cn(
                  'flex-1 py-2 md:py-3 px-1 md:px-2 border-r border-border/30 min-w-[44px] md:min-w-[100px]',
                  isToday ? 'bg-primary/5' : 'bg-transparent'
                )}
              >
                <div className="flex flex-col items-center gap-0.5 md:gap-1">
                  <span className={cn(
                    'text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-wider',
                    isToday ? 'text-primary' : 'text-muted-foreground/70'
                  )}>
                    {isMobile ? format(day, 'EEEEE') : format(day, 'EEE')}
                  </span>
                  <div className={cn(
                    'flex items-center justify-center rounded-full font-mono font-medium transition-all duration-300',
                    'w-6 h-6 text-sm md:w-8 md:h-8 md:text-lg',
                    isToday 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative"
        >
          <div className="flex flex-col">
            {/* Time Grid Section */}
            <div className="flex relative">
              {/* Time Labels */}
              <div className="sticky left-0 z-20 w-10 md:w-14 flex-shrink-0 bg-background border-r border-border/30 flex flex-col">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="relative flex-shrink-0 border-b border-transparent"
                    style={{ height: `${hourHeight}px` }}
                  >
                    <span className="absolute -top-2 right-1 md:right-2 text-[9px] md:text-[10px] font-mono text-muted-foreground/60 bg-background px-0.5">
                      {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                    </span>
                    <div className="absolute right-0 top-0 w-1.5 h-[1px] bg-border/30" />
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex flex-1 relative">
                {/* Current Time Indicator */}
                {allDays.some(day => isSameDay(day, currentTime)) && (
                   <div 
                     className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                     style={{ top: `${currentTimeTop}px` }}
                   >
                     <div className="w-full h-[2px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]" />
                     <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500 shadow-sm ring-2 ring-background" />
                   </div>
                )}

                {allDays.map((day) => {
                  const dateStr = dateHelpers.toISOString(day);
                  const isToday = dateHelpers.isToday(day);
                  const isSelectionForDay = dragSelection && dragSelection.dateStr === dateStr;
                  const selectionStartHour = isSelectionForDay
                    ? Math.min(dragSelection.startHour, dragSelection.endHour)
                    : null;
                  const selectionEndHour = isSelectionForDay
                    ? Math.max(dragSelection.startHour, dragSelection.endHour) + 1
                    : null;
                  const selectionHeight = selectionStartHour !== null && selectionEndHour !== null
                      ? (selectionEndHour - selectionStartHour) * hourHeight - 4
                      : 0;

                  return (
                    <div 
                      key={dateStr} 
                      className={cn(
                        'flex-1 border-r border-border/30 relative min-w-0',
                        isToday ? 'bg-primary/[0.02]' : 'bg-transparent'
                      )}
                    >
                      {/* Selection Indicator */}
                      {isSelectionForDay && dragSelection && selectionStartHour !== null && (
                        <div
                          className="absolute inset-x-0.5 md:inset-x-1 rounded-md pointer-events-none z-20 border border-primary/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                          style={{
                            top: selectionStartHour * hourHeight + 2,
                            height: `${Math.max(selectionHeight, hourHeight - 4)}px`,
                            backgroundColor: 'hsla(var(--primary) / 0.1)',
                            backdropFilter: 'blur(2px)',
                          }}
                        >
                          <div className="h-full w-1 bg-primary absolute left-0 top-0" />
                          <div className="px-1.5 md:px-3 py-1 text-[10px] md:text-xs font-medium text-primary truncate">New</div>
                          <div className="px-1.5 md:px-3 text-[9px] md:text-[10px] font-mono text-primary/70 hidden md:block">
                            {`${selectionStartHour}:00 - ${selectionEndHour}:00`}
                          </div>
                        </div>
                      )}

                      {/* Hour Slots */}
                      {HOURS.map((hour) => {
                        const tasksInSlot = getTasksForTimeSlot(dateStr, hour);
                        const slotOccupied = isSlotOccupied(dateStr, hour);
                        const droppableId = `timegrid-${dateStr}-${hour}`;
                        const isInSelection = dragSelection && dragSelection.dateStr === dateStr && hour >= Math.min(dragSelection.startHour, dragSelection.endHour) && hour <= Math.max(dragSelection.startHour, dragSelection.endHour);

                        return (
                          <Droppable key={droppableId} droppableId={droppableId}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  'relative select-none group transition-colors duration-200',
                                  'border-b border-dashed border-border/20',
                                  hour % 4 === 0 && 'border-b-solid border-border/30',
                                  slotOccupied ? 'cursor-default' : 'cursor-pointer',
                                  !isInSelection && !slotOccupied && 'hover:bg-primary/5',
                                  snapshot.isDraggingOver && 'bg-accent/30',
                                )}
                                style={{ height: `${hourHeight}px` }}
                                onMouseDown={(e) => {
                                  if (slotOccupied) return;
                                  if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-droppable-placeholder]')) {
                                    handleMouseDown(dateStr, hour, e);
                                  }
                                }}
                                onTouchStart={(e) => {
                                  if (slotOccupied) return;
                                  handleTouchStart(dateStr, hour, e);
                                }}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                              >
                                {tasksInSlot.map((task, index) => (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTask(task);
                                          setShowTaskDetail(true);
                                        }}
                                        className={cn(
                                          'absolute inset-x-0.5 md:inset-x-1 top-0.5 rounded px-1 md:px-2 py-1 md:py-1.5 text-[10px] md:text-xs',
                                          'shadow-sm transition-all duration-200',
                                          'hover:shadow-md hover:brightness-95 hover:z-10',
                                          'active:scale-[0.98]',
                                          snapshot.isDragging && 'shadow-xl scale-105 z-50 opacity-90',
                                          task.completed && 'opacity-60 grayscale'
                                        )}
                                        style={{
                                          backgroundColor: task.color !== 'default'
                                            ? `${getColorValue(task.color)}`
                                            : 'hsl(var(--card))',
                                          color: task.color !== 'default' ? '#fff' : 'hsl(var(--foreground))',
                                          border: task.color === 'default' ? '1px solid hsl(var(--border))' : 'none',
                                          height: `${getTaskHeight(task)}px`,
                                          ...provided.draggableProps.style,
                                        }}
                                      >
                                        <div
                                          {...provided.dragHandleProps}
                                          className="h-full flex flex-col gap-0.5 overflow-hidden"
                                        >
                                          <div className="font-medium truncate leading-tight flex items-center gap-1">
                                             {task.completed && <span className="opacity-70 text-[8px]">✓</span>}
                                             <span className={cn("truncate", task.completed && "line-through decoration-current/50")}>
                                               {task.title?.trim() || 'Untitled'}
                                             </span>
                                          </div>
                                          {getTaskHeight(task) > 35 && (
                                            <div className="text-[8px] md:text-[10px] opacity-80 font-mono mt-auto hidden md:block">
                                              {task.timeSlot?.start} - {task.timeSlot?.end}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Productivity Section at bottom of scroll */}
            <div className="px-2 md:px-4 pb-16 pt-6 md:pt-8 bg-background/50 border-t border-border/20">
              <div className="mb-3 md:mb-4 text-[10px] md:text-xs font-mono text-muted-foreground uppercase tracking-widest pl-10 md:pl-14">
                Modules
              </div>
              <ProductivitySection enableDragDrop={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={showTaskDetail}
          onOpenChange={setShowTaskDetail}
        />
      )}
    </DragDropContext>
  );
}
