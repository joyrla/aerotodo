'use client';

import { useState, useEffect, useRef } from 'react';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { taskHelpers } from '@/lib/utils/taskHelpers';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskList } from './TaskList';
import { TaskDetailModal } from './TaskDetailModal';
import { Plus, Minus, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function MonthView() {
  const { state, tasks, addTask, deleteTask } = useCalendar();
  const { preferences } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingTaskIdRef = useRef<string | null>(null);
  const savingRef = useRef<boolean>(false);
  const isComposingRef = useRef(false);
  const tasksRef = useRef(tasks);
  const calendarDays = dateHelpers.getCalendarDays(state.currentDate, preferences.weekStartsOn as 0 | 1);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  
  // Group days by week
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Calculate max tasks per week for dynamic sizing
  const weekTaskCounts = weeks.map(week => {
    return Math.max(...week.map(day => {
      const dateStr = dateHelpers.toISOString(day);
      return taskHelpers.filterTasksByDate(tasks, dateStr).length;
    }), 0);
  });

  const maxTasksInAnyWeek = Math.max(...weekTaskCounts, 1);

  // Focus input when editing starts
  useEffect(() => {
    if (editingDate && inputRefs.current[editingDate]) {
      inputRefs.current[editingDate]?.focus();
    }
  }, [editingDate]);

  // Save task when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (editingDate && !savingRef.current) {
        const input = inputRefs.current[editingDate];
        if (input && !input.contains(e.target as Node)) {
          // Clicked outside - save if there's text (like TaskList behavior)
          if (newTaskTitle.trim()) {
            savingRef.current = true;
            addTask({
              title: newTaskTitle.trim(),
              color: 'default',
              completed: false,
              date: editingDate,
            });
          }
          setNewTaskTitle('');
          setEditingDate(null);
          setTimeout(() => {
            savingRef.current = false;
          }, 100);
        }
      }
    };

    if (editingDate) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleDocumentClick);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [editingDate, newTaskTitle, addTask]);

  const handleDayClick = (date: Date, dayTasks: typeof tasks, e: React.MouseEvent) => {
    // Don't trigger if clicking on a task, the input, or the detail button
    if ((e.target as HTMLElement).closest('.task-indicator') || 
        (e.target as HTMLElement).closest('.task-input') ||
        (e.target as HTMLElement).closest('.detail-button') ||
        (e.target as HTMLElement).closest('input')) {
      return;
    }

    const dateStr = dateHelpers.toISOString(date);
    
    // Don't start editing if already editing this date
    if (editingDate === dateStr) {
      return;
    }
    
    // Start inline editing when clicking on empty areas of the day cell
    setEditingDate(dateStr);
    setNewTaskTitle('');
  };

  const handleAddTaskButtonClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = dateHelpers.toISOString(date);
    const timestamp = Date.now();
    
    // Store timestamp to identify the newly created task
    pendingTaskIdRef.current = timestamp.toString();
    
    // Create a new task with empty title
    addTask({
      title: '',
      color: 'default',
      completed: false,
      date: dateStr,
    });
  };
  
  // Watch for the newly created task and open the detail modal
  useEffect(() => {
    if (pendingTaskIdRef.current) {
      const timestamp = parseInt(pendingTaskIdRef.current);
      // Find the task created around this time with empty title
      const newTask = tasks.find(t => 
        !t.title && 
        t.createdAt && 
        Math.abs(new Date(t.createdAt).getTime() - timestamp) < 1000
      );
      if (newTask) {
        setSelectedTask(newTask.id);
        pendingTaskIdRef.current = null;
      }
    }
  }, [tasks]);

  const handleKeyDown = (e: React.KeyboardEvent, dateStr: string) => {
    // Ignore Enter key during IME composition (Korean, Japanese, Chinese, etc.)
    if (e.key === 'Enter' && !isComposingRef.current) {
      // Create task on Enter if there's text
      if (newTaskTitle.trim()) {
        addTask({
          title: newTaskTitle.trim(),
          color: 'default',
          completed: false,
          date: dateStr,
        });
        setNewTaskTitle('');
        setEditingDate(null);
      } else {
        // If empty, just close
        setNewTaskTitle('');
        setEditingDate(null);
      }
    } else if (e.key === 'Escape') {
      // Save task on Escape if there's text
      if (newTaskTitle.trim()) {
        addTask({
          title: newTaskTitle.trim(),
          color: 'default',
          completed: false,
          date: dateStr,
        });
      }
      setNewTaskTitle('');
      setEditingDate(null);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleBlur = (dateStr: string) => {
    // Small delay to allow click handlers to run first
    setTimeout(() => {
      // Only proceed if we're still editing this date
      if (editingDate !== dateStr) {
        return;
      }
      
      // Only save if we haven't already saved via click handler
      if (!savingRef.current && newTaskTitle.trim()) {
        addTask({
          title: newTaskTitle.trim(),
          color: 'default',
          completed: false,
          date: dateStr,
        });
      }
      setNewTaskTitle('');
      setEditingDate(null);
      savingRef.current = false;
    }, 150);
  };

  const dayNames = preferences.weekStartsOn === 0 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full pb-4 px-4 min-h-0">
      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-0 mb-0 flex-shrink-0 border-b border-border">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-xs uppercase tracking-wider font-mono text-muted-foreground font-semibold py-3"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col gap-0 min-h-0 border-l border-r border-b border-border">
        {weeks.map((week, weekIndex) => {
          return (
          <div 
            key={weekIndex} 
            className="grid grid-cols-7 gap-0 min-h-0 border-t border-border"
            style={{ 
              flex: '1 1 0%'
            }}
          >
            {week.map((day) => {
              const dateStr = dateHelpers.toISOString(day);
              const dayTasks = taskHelpers.filterTasksByDate(tasks, dateStr);
              
              // Include multi-day tasks that span through this date
              const multiDayTasks = tasks.filter(task => {
                if (!task.date || !task.endDate) return false;
                const taskStart = new Date(task.date);
                const taskEnd = new Date(task.endDate);
                const currentDay = new Date(dateStr);
                return currentDay >= taskStart && currentDay <= taskEnd;
              });
              
              // Combine single-day and multi-day tasks, avoiding duplicates
              const allDayTasks = [...dayTasks];
              multiDayTasks.forEach(multiTask => {
                if (!allDayTasks.find(t => t.id === multiTask.id)) {
                  allDayTasks.push(multiTask);
                }
              });
              
              const isToday = dateHelpers.isToday(day);
              const isCurrentMonth = dateHelpers.isSameMonth(day, state.currentDate);
              const isPast = dateHelpers.isPast(day);

              const isEditing = editingDate === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={(e) => handleDayClick(day, dayTasks, e)}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={cn(
                    'group relative flex flex-col p-2 border-r border-border transition-all min-h-[100px] cursor-pointer',
                    'hover:bg-accent/30',
                    isToday && 'bg-primary/5',
                    !isCurrentMonth && 'bg-muted/30',
                    isPast && !isToday && 'opacity-60'
                  )}
                >
                  {/* Date Number and Quick Add Input */}
                  <div className="flex items-start justify-between gap-2 mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={cn(
                          'flex items-center justify-center min-w-[26px] h-[26px] rounded-full text-sm font-semibold font-mono flex-shrink-0',
                          isToday && 'bg-primary text-primary-foreground',
                          !isToday && isCurrentMonth && 'text-foreground',
                          !isCurrentMonth && 'text-muted-foreground/50'
                        )}
                      >
                        {dateHelpers.formatDate(day, 'd')}
                      </div>
                      
                      {/* Quick Add Input - visible on hover or when editing */}
                      {(hoveredDate === dateStr || isEditing) && (
                      <div 
                        className={cn(
                          'task-input flex-1 h-[26px] flex items-center gap-1 px-1.5 rounded-md',
                          'transition-all duration-100 ease-out',
                          'animate-in fade-in slide-in-from-right-1 duration-100',
                          isEditing ? 'bg-accent/30 border border-primary/50' : 'bg-transparent border border-transparent',
                          !isEditing && 'group-hover:bg-accent/20 group-hover:border-border/50'
                        )}
                      >
                        <Plus className={cn(
                          'w-3 h-3 flex-shrink-0 transition-colors',
                          isEditing ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                        )} />
                        <input
                          ref={(el) => {
                            inputRefs.current[dateStr] = el;
                          }}
                          type="text"
                          value={isEditing ? newTaskTitle : ''}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, dateStr)}
                          onCompositionStart={handleCompositionStart}
                          onCompositionEnd={handleCompositionEnd}
                          onBlur={() => handleBlur(dateStr)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isEditing) {
                              setEditingDate(dateStr);
                              setNewTaskTitle('');
                            }
                          }}
                          placeholder="Quick Add..."
                          className={cn(
                            'flex-1 text-[11px] font-mono bg-transparent border-none outline-none focus:ring-0',
                            'placeholder:text-muted-foreground/40',
                            isEditing && 'placeholder:text-muted-foreground/60'
                          )}
                        />
                      </div>
                      )}
                    </div>
                    
                    <div
                      onClick={(e) => handleAddTaskButtonClick(day, e)}
                      className={cn(
                        'detail-button group/add-btn relative flex items-center justify-center w-5 h-5 rounded transition-all duration-200 ease-out cursor-pointer flex-shrink-0',
                        'opacity-0 group-hover:opacity-60 hover:opacity-100',
                        'hover:bg-primary/5 active:scale-95',
                        'text-muted-foreground/60 hover:text-primary'
                      )}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleAddTaskButtonClick(day, e as any);
                        }
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </div>
                  </div>
                  
                  {/* Task indicators */}
                  <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
                    {(allDayTasks.length > 5 ? allDayTasks.slice(0, 4) : allDayTasks).map((task) => {
                      // Get color value for task
                      const getColorValue = (color: string): string => {
                        const colorMap: Record<string, string> = {
                          default: '#6b7280',
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
                      };

                      return (
                        <div
                          key={task.id}
                          onMouseEnter={() => setHoveredTask(task.id)}
                          onMouseLeave={() => setHoveredTask(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task.id);
                          }}
                          className={cn(
                            'task-indicator text-xs truncate px-2 py-1 rounded-md font-mono cursor-pointer group/task relative',
                            'transition-all hover:shadow-sm active:scale-[0.98]',
                            'flex items-center gap-1.5',
                            'animate-in fade-in slide-in-from-top-1 duration-100',
                            task.completed && 'opacity-50'
                          )}
                          style={{
                            backgroundColor: task.color === 'default' 
                              ? 'rgba(107, 114, 128, 0.1)' 
                              : `${getColorValue(task.color)}15`,
                            borderLeft: `3px solid ${getColorValue(task.color)}`,
                          }}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getColorValue(task.color) }}
                          />
                          <span className={cn(
                            'truncate flex-1',
                            task.completed && 'line-through'
                          )}>
                            {task.title}
                          </span>
                          {task.endDate && (
                            <span className="text-[10px] text-muted-foreground font-mono px-1 bg-muted/50 rounded">
                              {format(new Date(task.date!), 'd')}~{format(new Date(task.endDate), 'd')}
                            </span>
                          )}
                          
                          {/* Delete Button - appears on hover */}
                          {hoveredTask === task.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const taskName = task.title?.trim() || 'Untitled task';
                                const deletedTask = { ...task };
                                deleteTask(task.id);
                                toast(`"${taskName}" deleted`, {
                                  action: {
                                    label: 'Undo',
                                    onClick: () => {
                                      addTask(deletedTask);
                                    }
                                  }
                                });
                              }}
                              className={cn(
                                'absolute right-1 top-1/2 -translate-y-1/2',
                                'w-5 h-5 flex items-center justify-center rounded',
                                'bg-background shadow-md border border-border/50',
                                'text-muted-foreground hover:text-destructive',
                                'hover:bg-destructive/10 hover:border-destructive/50',
                                'transition-all duration-200 hover:scale-110',
                                'animate-in fade-in zoom-in-50 duration-100'
                              )}
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {allDayTasks.length > 5 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                        }}
                        className={cn(
                          'text-xs text-muted-foreground font-mono font-medium cursor-pointer',
                          'px-2 py-1 rounded-md hover:bg-accent/50 transition-colors text-left',
                          'hover:text-foreground'
                        )}
                      >
                        +{allDayTasks.length - 4} more
                      </button>
                    )}
                    
                    {/* Inline task input - removed since we have top input now */}
                    
                    {/* Quick add button - removed since we have top input now */}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* Day Tasks Modal */}
      {selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <DialogTitle className="font-mono text-lg font-semibold">
                {dateHelpers.formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {taskHelpers.filterTasksByDate(tasks, dateHelpers.toISOString(selectedDate)).length} {
                  taskHelpers.filterTasksByDate(tasks, dateHelpers.toISOString(selectedDate)).length === 1 ? 'task' : 'tasks'
                }
              </p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
              <TaskList
                date={dateHelpers.toISOString(selectedDate)}
                tasks={taskHelpers.filterTasksByDate(tasks, dateHelpers.toISOString(selectedDate))}
                droppableId={dateHelpers.toISOString(selectedDate)}
                enableDragDrop={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (() => {
        const task = tasks.find(t => t.id === selectedTask);
        if (!task) return null;
        return (
          <TaskDetailModal
            task={task}
            open={!!selectedTask}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedTask(null);
                // Delay cleanup to allow TaskDetailModal to persist edits first
                setTimeout(() => {
                  const latestTask = tasksRef.current.find(t => t.id === selectedTask);
                  if (latestTask) {
                    const hasTitle = !!latestTask.title?.trim();
                    const hasNotes = !!latestTask.notes?.trim();
                    const hasSubtasks = !!latestTask.subtasks?.length;
                    if (!hasTitle && !hasNotes && !hasSubtasks) {
                      deleteTask(selectedTask);
                    }
                  }
                }, 0);
              }
            }}
          />
        );
      })()}
    </div>
  );
}

