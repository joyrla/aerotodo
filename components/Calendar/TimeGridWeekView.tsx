'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
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

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours
const HOUR_HEIGHT = 64; // Increased height for better readability

interface DragSelection {
  dateStr: string;
  startHour: number;
  endHour: number;
  isActive: boolean;
}

export function TimeGridWeekView() {
  const { state, tasks, moveTask, updateTask, addTask } = useCalendar();
  const { preferences } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekDays = dateHelpers.getWeekDays(state.currentDate, preferences.weekStartsOn as 0 | 1);
  const allDays = weekDays;

  useEffect(() => {
    setIsMounted(true);
    // Scroll to 8 AM roughly on mount
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT - 20;
    }

    // Update current time every minute
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
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

  // Handle mouse events for creating tasks (optimized with useCallback)
  const handleMouseDown = useCallback((dateStr: string, hour: number, e?: ReactMouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDragSelection({
      dateStr,
      startHour: hour,
      endHour: hour,
      isActive: true
    });
    setIsCreatingTask(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    // Store selection data before clearing it
    const currentSelection = dragSelection;
    
    // Clear selection first
    setDragSelection(null);
    setIsCreatingTask(false);
    
    // Then create task outside of state setter
    if (currentSelection && isCreatingTask) {
      const startHour = Math.min(currentSelection.startHour, currentSelection.endHour);
      const endHour = Math.max(currentSelection.startHour, currentSelection.endHour) + 1;
      
      // Create new task with placeholder title
      const newTaskData = {
        title: '',
        color: 'default' as const,
        completed: false,
        date: currentSelection.dateStr,
        timeSlot: {
          start: `${startHour.toString().padStart(2, '0')}:00`,
          end: `${endHour.toString().padStart(2, '0')}:00`
        }
      };
      
      const createdTask = addTask(newTaskData);
      setSelectedTask(createdTask);
      setShowTaskDetail(true);
    }
  }, [isCreatingTask, dragSelection, addTask]);

  useEffect(() => {
    if (isCreatingTask) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isCreatingTask, dragSelection, handleMouseUp]);

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

  const handleMouseEnter = useCallback((dateStr: string, hour: number) => {
    setDragSelection(prev => {
      if (!prev || prev.dateStr !== dateStr) return prev;
      
      const direction = hour > prev.startHour ? 1 : -1;
      const start = Math.min(prev.startHour, hour);
      const end = Math.max(prev.startHour, hour);
      
      for (let h = start; h <= end; h++) {
        if (tasks.some(task => {
          if (task.date !== dateStr || !task.timeSlot) return false;
          const startHour = parseInt(task.timeSlot.start.split(':')[0]);
          const endHour = parseInt(task.timeSlot.end.split(':')[0]);
          return h >= startHour && h < endHour;
        })) {
          if (direction > 0) {
            return { ...prev, endHour: h - 1 };
          } else {
            return { ...prev, endHour: h + 1 };
          }
        }
      }
      
      return { ...prev, endHour: hour };
    });
  }, [tasks]);

  const getTaskHeight = useCallback((task: TaskType) => {
    if (!task.timeSlot) return HOUR_HEIGHT - 8;
    const startHour = parseInt(task.timeSlot.start.split(':')[0]);
    const endHour = parseInt(task.timeSlot.end.split(':')[0]);
    const duration = endHour - startHour;
    return (duration * HOUR_HEIGHT) - 8;
  }, []);

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
  const currentTimeTop = currentHour * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-background/50 select-none relative">
        {/* Header with days - Sticky */}
        <div className={cn(
          "flex border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-xl z-30 transition-all duration-200",
          isScrolled && "shadow-sm border-border/60"
        )}>
          <div className="w-16 flex-shrink-0 border-r border-border/30 bg-muted/5" />
          
          {allDays.map((day) => {
            const isToday = dateHelpers.isToday(day);
            const dateStr = dateHelpers.toISOString(day);
            
            return (
              <div
                key={dateStr}
                className={cn(
                  'flex-1 py-3 px-2 border-r border-border/30 min-w-[120px]',
                  isToday ? 'bg-primary/5' : 'bg-transparent'
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={cn(
                    'text-[10px] font-mono font-bold uppercase tracking-widest',
                    isToday ? 'text-primary' : 'text-muted-foreground/70'
                  )}>
                    {format(day, 'EEE')}
                  </span>
                  <div className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-full text-lg font-mono font-medium transition-all duration-300',
                    isToday 
                      ? 'bg-primary text-primary-foreground shadow-md scale-110' 
                      : 'text-foreground hover:bg-accent'
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
          className="flex-1 overflow-y-auto overflow-x-auto scrollbar-hide relative"
        >
          <div className="flex flex-col min-w-max lg:min-w-full">
            {/* Time Grid Section */}
            <div className="flex relative">
              {/* Time Labels */}
              <div className="sticky left-0 z-20 w-16 flex-shrink-0 bg-background border-r border-border/30 flex flex-col">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="relative flex-shrink-0 border-b border-transparent"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    <span className="absolute -top-2.5 right-3 text-[10px] font-mono text-muted-foreground/60 bg-background px-1">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </span>
                    <div className="absolute right-0 top-0 w-2 h-[1px] bg-border/30" />
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
                     <div className="absolute -left-[6px] w-3 h-3 rounded-full bg-red-500 shadow-sm ring-2 ring-background" />
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
                      ? (selectionEndHour - selectionStartHour) * HOUR_HEIGHT - 4
                      : 0;

                  return (
                    <div 
                      key={dateStr} 
                      className={cn(
                        'flex-1 border-r border-border/30 relative min-w-[120px]',
                        isToday ? 'bg-primary/[0.02]' : 'bg-transparent'
                      )}
                    >
                      {/* Selection Indicator */}
                      {isSelectionForDay && dragSelection && selectionStartHour !== null && (
                        <div
                          className="absolute inset-x-1 rounded-md pointer-events-none z-20 border border-primary/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                          style={{
                            top: selectionStartHour * HOUR_HEIGHT + 2,
                            height: `${Math.max(selectionHeight, HOUR_HEIGHT - 4)}px`,
                            backgroundColor: 'hsla(var(--primary) / 0.1)',
                            backdropFilter: 'blur(2px)',
                          }}
                        >
                          <div className="h-full w-1 bg-primary absolute left-0 top-0" />
                          <div className="px-3 py-1.5 text-xs font-medium text-primary">New Task</div>
                          <div className="px-3 text-[10px] font-mono text-primary/70">
                            {`${selectionStartHour}:00 - ${selectionEndHour}:00`}
                          </div>
                        </div>
                      )}

                      {/* Hour Slots */}
                      {HOURS.map((hour) => {
                        const tasksInSlot = getTasksForTimeSlot(dateStr, hour);
                        const slotOccupied = isSlotOccupied(dateStr, hour);
                        const droppableId = `timegrid-${dateStr}-${hour}`;
                        const isSelectionStart = dragSelection && dragSelection.dateStr === dateStr && hour === Math.min(dragSelection.startHour, dragSelection.endHour);
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
                                style={{ height: `${HOUR_HEIGHT}px` }}
                                onMouseDown={(e) => {
                                  if (slotOccupied) return;
                                  if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-droppable-placeholder]')) {
                                    handleMouseDown(dateStr, hour, e);
                                  }
                                }}
                                onMouseEnter={() => {
                                  if (slotOccupied && isCreatingTask) return;
                                  handleMouseEnter(dateStr, hour);
                                }}
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
                                          'absolute inset-x-1 top-0.5 rounded-md px-2.5 py-2 text-xs',
                                          'shadow-sm transition-all duration-200',
                                          'hover:shadow-md hover:brightness-95 hover:z-10',
                                          snapshot.isDragging && 'shadow-xl scale-105 z-50 opacity-90 rotate-1',
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
                                          <div className="font-medium truncate leading-tight flex items-center gap-1.5">
                                             {task.completed && <span className="opacity-70">✓</span>}
                                             <span className={cn(task.completed && "line-through decoration-current/50")}>
                                               {task.title?.trim() || 'Untitled'}
                                             </span>
                                          </div>
                                          {getTaskHeight(task) > 30 && (
                                            <div className="text-[10px] opacity-80 font-mono mt-auto">
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
            <div className="px-4 pb-16 pt-8 bg-background/50 border-t border-border/20">
              <div className="mb-4 text-xs font-mono text-muted-foreground uppercase tracking-widest pl-16">
                Productivity Modules
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
