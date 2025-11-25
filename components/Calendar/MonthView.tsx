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
    
    // Create a new task with empty title and immediately open detail modal
    const newTask = addTask({
      title: '',
      color: 'default',
      completed: false,
      date: dateStr,
    });
    
    // addTask returns the created task, open modal immediately
    if (newTask && newTask.id) {
      setSelectedTask(newTask.id);
    }
  };

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

  // Helper function for color values
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
    <div className="flex flex-col h-full pb-4 px-2 md:px-4 min-h-0">
      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-0 mb-0 flex-shrink-0 border-b border-border">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-[10px] md:text-xs uppercase tracking-wider font-mono text-muted-foreground font-semibold py-2 md:py-3"
          >
            <span className="md:hidden">{name.charAt(0)}</span>
            <span className="hidden md:inline">{name}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col gap-0 min-h-0 border-l border-r border-b border-border overflow-hidden">
        {weeks.map((week, weekIndex) => {
          return (
          <div 
            key={weekIndex} 
            className="grid grid-cols-7 gap-0 min-h-0 border-t border-border"
            style={{ flex: '1 1 0%', minHeight: '80px' }}
          >
            {week.map((day) => {
              const dateStr = dateHelpers.toISOString(day);
              const dayTasks = taskHelpers.filterTasksByDate(tasks, dateStr);
              
              const multiDayTasks = tasks.filter(task => {
                if (!task.date || !task.endDate) return false;
                const taskStart = new Date(task.date);
                const taskEnd = new Date(task.endDate);
                const currentDay = new Date(dateStr);
                return currentDay >= taskStart && currentDay <= taskEnd;
              });
              
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

              // Mobile: show dots, Desktop: show task previews
              // Desktop: show up to 4 tasks, then "+X more" if 6+ tasks. Show all 5 if exactly 5.
              const showMoreButton = allDayTasks.length > 5;
              const maxVisibleDesktop = showMoreButton ? 4 : allDayTasks.length;

              return (
                <div
                  key={dateStr}
                  onClick={(e) => {
                    // On mobile, always open day detail on tap
                    if (window.innerWidth < 768) {
                      e.stopPropagation();
                      setSelectedDate(day);
                      return;
                    }
                    handleDayClick(day, dayTasks, e);
                  }}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={cn(
                    'group relative flex flex-col border-r border-border transition-all cursor-pointer overflow-hidden',
                    'p-1 md:p-2',
                    'min-h-[60px] md:min-h-[100px]',
                    'active:bg-accent/40 md:hover:bg-accent/30',
                    isToday && 'bg-primary/5',
                    !isCurrentMonth && 'bg-muted/30',
                    isPast && !isToday && 'opacity-60'
                  )}
                >
                  {/* Date Number and Quick Add Input */}
                  <div className="flex items-start justify-between gap-2 mb-1 md:mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-full font-semibold font-mono flex-shrink-0',
                          'w-6 h-6 text-xs md:min-w-[26px] md:h-[26px] md:text-sm',
                          isToday && 'bg-primary text-primary-foreground',
                          !isToday && isCurrentMonth && 'text-foreground',
                          !isCurrentMonth && 'text-muted-foreground/50'
                        )}
                      >
                        {dateHelpers.formatDate(day, 'd')}
                      </div>
                      
                      {/* Desktop: Quick Add Input - visible on hover or when editing */}
                      {(hoveredDate === dateStr || isEditing) && (
                        <div 
                          className={cn(
                            'hidden md:flex task-input flex-1 h-[26px] items-center gap-1 px-1.5 rounded-md',
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
                            ref={(el) => { inputRefs.current[dateStr] = el; }}
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
                    
                    {/* Desktop: Detail Button */}
                    <div
                      onClick={(e) => handleAddTaskButtonClick(day, e)}
                      className={cn(
                        'hidden md:flex detail-button group/add-btn relative items-center justify-center w-5 h-5 rounded transition-all duration-200 ease-out cursor-pointer flex-shrink-0',
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

                  {/* Mobile: Task List (compact, not clickable - day click handles it) */}
                  <div className="md:hidden flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden pointer-events-none">
                    {allDayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-[9px] leading-tight truncate px-1 py-0.5 rounded font-medium",
                          task.completed && "opacity-50 line-through"
                        )}
                        style={{
                          backgroundColor: task.color === 'default' 
                            ? 'rgba(107, 114, 128, 0.15)' 
                            : `${getColorValue(task.color)}20`,
                          color: task.color === 'default' 
                            ? 'hsl(var(--foreground))' 
                            : getColorValue(task.color),
                        }}
                      >
                        {task.title || 'Untitled'}
                      </div>
                    ))}
                    {allDayTasks.length > 2 && (
                      <span className="text-[8px] text-muted-foreground font-mono px-1">+{allDayTasks.length - 2}</span>
                    )}
                  </div>
                  
                  {/* Desktop: Task List */}
                  <div className="hidden md:flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
                    {allDayTasks.slice(0, maxVisibleDesktop).map((task) => (
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
                        <span className={cn('truncate flex-1', task.completed && 'line-through')}>
                          {task.title || 'Untitled'}
                        </span>
                        {hoveredTask === task.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const taskName = task.title?.trim() || 'Untitled task';
                              const deletedTask = { ...task };
                              deleteTask(task.id);
                              toast(`"${taskName}" deleted`, {
                                action: { label: 'Undo', onClick: () => addTask(deletedTask) }
                              });
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded bg-background shadow-md border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {showMoreButton && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                        }}
                        className="text-xs text-muted-foreground font-mono font-medium px-2 py-1 rounded-md hover:bg-accent/50 transition-colors text-left hover:text-foreground"
                      >
                        +{allDayTasks.length - 4} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* Day Tasks Modal */}
      {selectedDate && (() => {
        const dayTasks = taskHelpers.filterTasksByDate(tasks, dateHelpers.toISOString(selectedDate));
        const isToday = dateHelpers.isToday(selectedDate);
        const isPast = dateHelpers.isPast(selectedDate) && !isToday;
        
        return (
          <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
            <DialogContent 
              mobileSheet={true}
              showCloseButton={false}
              className="max-w-lg max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex-shrink-0 border-b border-border/50 animate-slide-in-top">
                {/* Date Display */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Large Date Number */}
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex flex-col items-center justify-center",
                        isToday 
                          ? "bg-primary text-primary-foreground" 
                          : isPast 
                            ? "bg-muted text-muted-foreground"
                            : "bg-accent text-foreground"
                      )}>
                        <span className="text-2xl font-bold font-mono leading-none">
                          {dateHelpers.formatDate(selectedDate, 'd')}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                          {dateHelpers.formatDate(selectedDate, 'EEE')}
                        </span>
                      </div>
                      {/* Month & Year */}
                      <div>
                        <DialogTitle className="text-lg font-semibold">
                          {dateHelpers.formatDate(selectedDate, 'MMMM yyyy')}
                        </DialogTitle>
                        <p className={cn(
                          "text-sm font-mono mt-0.5",
                          isToday ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {isToday ? 'Today' : dateHelpers.formatDate(selectedDate, 'EEEE')}
                        </p>
                      </div>
                    </div>
                    {/* Task Count Badge */}
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-mono font-medium",
                      dayTasks.length > 0 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {dayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 animate-scale-in">
                      <Plus className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mb-1">No tasks yet</p>
                    <p className="text-xs text-muted-foreground/60">Add a task below to get started</p>
                  </div>
                ) : (
                  <div className="px-5 py-4 animate-slide-in-bottom">
                    <TaskList
                      date={dateHelpers.toISOString(selectedDate)}
                      tasks={dayTasks}
                      droppableId={`day-modal-${dateHelpers.toISOString(selectedDate)}`}
                      enableDragDrop={false}
                    />
                  </div>
                )}
              </div>

              {/* Footer with Quick Add */}
              <div className="flex-shrink-0 border-t border-border/50 px-5 py-4 bg-muted/30 animate-slide-in-bottom">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Add a task..."
                      className="w-full h-10 px-4 rounded-lg bg-background border border-border/50 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          addTask({
                            title: (e.target as HTMLInputElement).value.trim(),
                            color: 'default',
                            completed: false,
                            date: dateHelpers.toISOString(selectedDate),
                          });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a task..."]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        addTask({
                          title: input.value.trim(),
                          color: 'default',
                          completed: false,
                          date: dateHelpers.toISOString(selectedDate),
                        });
                        input.value = '';
                      }
                    }}
                    className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

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

