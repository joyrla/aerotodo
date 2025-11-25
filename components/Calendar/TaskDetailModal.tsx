'use client';

import { useState, useEffect, useRef } from 'react';
import { Task as TaskType, TaskColor, RepeatPattern } from '@/types';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { Trash2, Plus, Repeat, Bell, Palette, ChevronDown, Clock, Calendar as CalendarIcon, X, RotateCw, CalendarDays, CalendarCheck, Check, Edit2, AlignLeft, ArrowRight } from 'lucide-react';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { storage } from '@/lib/utils/storage';
import { toast } from 'sonner';

// Modern, minimal color palette
const colorOptions: Array<{ color: TaskColor; value: string; pastelValue: string; label: string }> = [
  { color: 'blue', value: '#3b82f6', pastelValue: 'rgba(59, 130, 246, 0.12)', label: 'Blue' },
  { color: 'green', value: '#10b981', pastelValue: 'rgba(16, 185, 129, 0.12)', label: 'Green' },
  { color: 'yellow', value: '#f59e0b', pastelValue: 'rgba(245, 158, 11, 0.12)', label: 'Yellow' },
  { color: 'red', value: '#ef4444', pastelValue: 'rgba(239, 68, 68, 0.12)', label: 'Red' },
];

const repeatOptions: Array<{ value: RepeatPattern; label: string; icon?: string }> = [
  { value: null, label: 'No repeat', icon: '✕' },
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'yearly', label: 'Yearly', icon: '🎂' },
];

interface TaskDetailModalProps {
  task: TaskType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const { updateTask, deleteTask, toggleTaskComplete, tasks, setCurrentDate } = useCalendar();
  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showReminderManual, setShowReminderManual] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNavigateDialog, setShowNavigateDialog] = useState(false);
  const [selectedDateForNavigation, setSelectedDateForNavigation] = useState<Date | null>(null);
  const [optimisticSubtaskStates, setOptimisticSubtaskStates] = useState<Record<string, boolean | null>>({});
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  // Refs for inputs to capture values on close
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null); // Added Ref for color picker
  const currentTitleRef = useRef<string>(title);
  const currentNotesRef = useRef<string>(notes);
  const currentSubtaskRef = useRef<string>(newSubtask);

  // Keep refs in sync
  useEffect(() => { currentTitleRef.current = title; }, [title]);
  useEffect(() => { currentNotesRef.current = notes; }, [notes]);
  useEffect(() => { currentSubtaskRef.current = newSubtask; }, [newSubtask]);

  // Sync state when task changes
  useEffect(() => {
    setTitle(task.title || '');
    setNotes(task.notes || '');
  }, [task.id, task.title, task.notes]);

  // Handle click outside for color picker
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

  // Overlap Detection
  const checkOverlap = (newStart: string, newEnd: string) => {
    if (!task.date) return false;

    // Helper to convert "HH:MM" to minutes
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
      
    const startMins = toMinutes(newStart);
    const endMins = toMinutes(newEnd);

    return tasks.some(t => {
      if (t.id === task.id) return false; // Ignore self
      if (t.date !== task.date) return false; // Ignore other days
      if (!t.timeSlot) return false; // Ignore non-timed tasks

      const tStartMins = toMinutes(t.timeSlot.start);
      const tEndMins = toMinutes(t.timeSlot.end);

      // Check overlap: (StartA < EndB) && (EndA > StartB)
      return (startMins < tEndMins && endMins > tStartMins);
    });
  };

  const handleTimeSlotChange = (timeSlot: { start: string; end: string } | null) => {
    if (timeSlot) {
      if (checkOverlap(timeSlot.start, timeSlot.end)) {
        toast.error('Time slot overlaps with another task');
        return; // Prevent update
      }
    }
    updateTask(task.id, { timeSlot });
  };

  const handleClose = (shouldOpen: boolean) => {
    if (!shouldOpen) {
      // Save unsaved changes before closing
      const currentTitle = (titleInputRef.current?.value ?? currentTitleRef.current).trim();
      const currentNotes = notesTextareaRef.current?.value ?? currentNotesRef.current;
      
      if (currentTitle !== task.title) {
        updateTask(task.id, { title: currentTitle });
      }
      if (currentNotes !== task.notes) {
        updateTask(task.id, { notes: currentNotes || undefined });
      }
      
      // Add pending subtask if any
      const currentSubtask = (subtaskInputRef.current?.value ?? currentSubtaskRef.current).trim();
      if (currentSubtask) {
        const subtasks = task.subtasks || [];
        updateTask(task.id, {
          subtasks: [
            ...subtasks,
            { id: Date.now().toString(), title: currentSubtask, completed: false }
          ]
        });
        setNewSubtask('');
      }

      onOpenChange(false);
    } else {
      onOpenChange(true);
    }
  };

  // Handle title save
  const handleSaveTitle = () => {
    setTimeout(() => {
      if (title.trim() && title.trim() !== task.title) {
          updateTask(task.id, { title: title.trim() });
      } else if (!title.trim() && task.title) {
        updateTask(task.id, { title: '' });
      }
    }, 0);
  };

  // Handle notes save
  const handleSaveNotes = () => {
    setTimeout(() => {
      if (notes !== task.notes) {
        updateTask(task.id, { notes: notes || undefined });
      }
    }, 0);
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    setTimeout(() => {
      if (newSubtask.trim()) {
        const subtasks = task.subtasks || [];
        updateTask(task.id, {
          subtasks: [...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]
        });
        setNewSubtask('');
      }
    }, 0);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const subtasks = task.subtasks || [];
    const subtask = subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;
    
    const willBeCompleted = !subtask.completed;
    updateTask(task.id, {
      subtasks: subtasks.map(st => st.id === subtaskId ? { ...st, completed: willBeCompleted } : st),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const subtasks = task.subtasks || [];
    updateTask(task.id, {
      subtasks: subtasks.filter(st => st.id !== subtaskId),
    });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    handleClose(false);
  };

  // Formatting and Helpers
  const formattedDate = (() => {
    if (!task.date) return storage.getInboxName();
    try {
      const parsed = dateHelpers.parseDate(task.date);
      return isNaN(parsed.getTime()) ? storage.getInboxName() : dateHelpers.formatDate(parsed, 'EEE, MMM d');
    } catch {
      return storage.getInboxName();
    }
  })();

  return (
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        showCloseButton={false}
        mobileSheet={true}
        mobilePosition="bottom"
        className="w-full sm:max-w-2xl bg-background border-border/50 p-0 gap-0 overflow-hidden backface-hidden"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // Delay focus to after animation completes
          setTimeout(() => {
            if (!task.title) titleInputRef.current?.focus();
          }, 200);
        }}
      >
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
        
        {/* Mobile - Fixed height bottom sheet that doesn't move with keyboard */}
        <div className="md:hidden flex flex-col h-[82dvh] max-h-[82dvh] bg-background">

          {/* TOP SECTION: All interactive elements (stays visible with keyboard) */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3 overflow-visible">
            
            {/* Row 1: Title with Checkbox & Close */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleTaskComplete(task.id)}
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all active:scale-90',
                  task.completed 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground/40'
                )}
              >
                {task.completed && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
              </button>
              
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTitle();
                    handleClose(false);
                  }
                }}
                placeholder="Add task..."
                className={cn(
                  'flex-1 text-sm font-mono border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-muted-foreground/50 leading-relaxed',
                  task.completed && 'line-through text-muted-foreground'
                )}
              />
              
              <button
                onClick={() => handleClose(false)}
                className="p-2 -mr-2 rounded-full text-muted-foreground active:bg-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Row 2: Quick Actions - All using Popovers for consistent dropdown behavior */}
            <div className="flex items-center gap-1.5 pb-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {/* Date */}
              <Popover open={showMobileDatePicker} onOpenChange={setShowMobileDatePicker}>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-mono transition-colors flex-none",
                    task.date ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"
                  )}>
                    <CalendarIcon className="w-3 h-3 flex-none" />
                    <span className="flex-none">{task.date ? format(new Date(task.date), 'EEE, MMM d') : 'Date'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[280px] p-0" 
                  align="start" 
                  side="bottom" 
                  sideOffset={4}
                >
                  {/* Quick Date Shortcuts - 4 columns */}
                  <div className="border-b border-border/50 p-2">
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => {
                          const today = new Date();
                          updateTask(task.id, { date: dateHelpers.toISOString(today) });
                          setShowMobileDatePicker(false);
                        }}
                        className={cn(
                          "py-1.5 text-[10px] font-mono rounded-md transition-all active:scale-95",
                          task.date && dateHelpers.isToday(new Date(task.date))
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-foreground hover:bg-muted"
                        )}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          updateTask(task.id, { date: dateHelpers.toISOString(tomorrow) });
                          setShowMobileDatePicker(false);
                        }}
                        className="py-1.5 text-[10px] font-mono rounded-md bg-muted/50 text-foreground hover:bg-muted transition-all active:scale-95"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => {
                          // Get next Saturday
                          const today = new Date();
                          const dayOfWeek = today.getDay();
                          const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
                          const weekend = new Date(today);
                          weekend.setDate(today.getDate() + daysUntilSaturday);
                          updateTask(task.id, { date: dateHelpers.toISOString(weekend) });
                          setShowMobileDatePicker(false);
                        }}
                        className="py-1.5 text-[10px] font-mono rounded-md bg-muted/50 text-foreground hover:bg-muted transition-all active:scale-95"
                      >
                        Weekend
                      </button>
                      <button
                        onClick={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          updateTask(task.id, { date: dateHelpers.toISOString(nextWeek) });
                          setShowMobileDatePicker(false);
                        }}
                        className="py-1.5 text-[10px] font-mono rounded-md bg-muted/50 text-foreground hover:bg-muted transition-all active:scale-95"
                      >
                        +1 Week
                      </button>
                    </div>
                  </div>

                  {/* Compact Calendar */}
                  <div className="p-1">
                    <Calendar
                      mode="single"
                      selected={task.date ? new Date(task.date) : undefined}
                      onSelect={(date) => {
                        updateTask(task.id, { date: date ? dateHelpers.toISOString(date) : null });
                        setShowMobileDatePicker(false);
                      }}
                      modifiersClassNames={{
                        selected: "!bg-muted !text-muted-foreground font-medium",
                        today: "bg-primary text-primary-foreground font-semibold",
                      }}
                      classNames={{
                        months: "flex flex-col relative",
                        month: "space-y-2",
                        month_caption: "flex items-center justify-center h-8 px-8",
                        caption_label: "text-xs font-medium font-mono",
                        nav: "flex items-center w-full absolute top-0 inset-x-0 justify-between px-1 h-8",
                        button_previous: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 transition-colors rounded-md hover:bg-muted inline-flex items-center justify-center",
                        button_next: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 transition-colors rounded-md hover:bg-muted inline-flex items-center justify-center",
                        table: "w-full border-collapse",
                        weekdays: "flex",
                        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[10px] flex-1 text-center",
                        week: "flex w-full mt-1",
                        day: "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 flex-1",
                        day_button: cn(
                          "h-9 w-9 p-0 font-normal font-mono rounded-md inline-flex items-center justify-center transition-colors",
                          "hover:bg-accent hover:text-accent-foreground"
                        ),
                        outside: "text-muted-foreground opacity-40",
                        disabled: "text-muted-foreground opacity-40",
                        hidden: "invisible",
                      }}
                    />
                  </div>

                  {/* Move to Inbox / Clear Date */}
                  {task.date && (
                    <div className="px-2 pb-2">
                      <button
                        onClick={() => {
                          updateTask(task.id, { date: null });
                          setShowMobileDatePicker(false);
                        }}
                        className="w-full py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all active:scale-95 border border-border/50"
                      >
                        Move to Inbox
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Time */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap",
                    task.timeSlot ? "bg-orange-500/10 text-orange-600" : "bg-muted/30 text-muted-foreground"
                  )}>
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{task.timeSlot ? (() => {
                      const formatTime = (time: string) => {
                        const [h, m] = time.split(':').map(Number);
                        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                      };
                      return `${formatTime(task.timeSlot.start)} - ${formatTime(task.timeSlot.end)}`;
                    })() : 'Time'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-3" align="start" side="bottom" sideOffset={4}>
                  <div className="space-y-3">
                    {/* Time Range */}
                    <div className="flex items-center gap-3">
                      {/* Start */}
                      <div className="relative flex-1 min-w-[85px]">
                        <input
                          type="time"
                          value={task.timeSlot?.start || '09:00'}
                          onChange={(e) => {
                            handleTimeSlotChange({ 
                              start: e.target.value, 
                              end: task.timeSlot?.end || '10:00' 
                            });
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="h-9 px-3 flex items-center justify-center text-sm font-mono bg-orange-500/10 text-orange-600 rounded-lg whitespace-nowrap">
                          {(() => {
                            const time = task.timeSlot?.start || '09:00';
                            const [h, m] = time.split(':').map(Number);
                            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                          })()}
                        </div>
                      </div>
                      
                      <span className="text-muted-foreground/40 text-sm font-mono">–</span>
                      
                      {/* End */}
                      <div className="relative flex-1 min-w-[85px]">
                        <input
                          type="time"
                          value={task.timeSlot?.end || '10:00'}
                          onChange={(e) => {
                            handleTimeSlotChange({ 
                              start: task.timeSlot?.start || '09:00', 
                              end: e.target.value 
                            });
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="h-9 px-3 flex items-center justify-center text-sm font-mono bg-muted/40 text-foreground rounded-lg whitespace-nowrap">
                          {(() => {
                            const time = task.timeSlot?.end || '10:00';
                            const [h, m] = time.split(':').map(Number);
                            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Duration shortcuts */}
                    <div className="flex gap-1.5">
                      {[{ l: '15m', m: 15 }, { l: '30m', m: 30 }, { l: '1h', m: 60 }, { l: '2h', m: 120 }].map((d) => (
                        <button
                          key={d.l}
                          onClick={() => {
                            const start = task.timeSlot?.start || '09:00';
                            const [h, m] = start.split(':').map(Number);
                            const end = new Date(2000, 0, 1, h, m + d.m);
                            handleTimeSlotChange({ start, end: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` });
                          }}
                          className="flex-1 py-1.5 text-xs font-mono rounded-md bg-muted/30 text-muted-foreground hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                        >
                          {d.l}
                        </button>
                      ))}
                    </div>

                    {/* Remove button */}
                    {task.timeSlot && (
                      <button
                        onClick={() => handleTimeSlotChange(null)}
                        className="w-full py-1 text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Color */}
              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0",
                      task.color === 'default' && "bg-muted/30"
                    )}
                    style={{
                      backgroundColor: task.color !== 'default'
                        ? colorOptions.find(c => c.color === task.color)?.pastelValue
                        : undefined
                    }}
                  >
                    <Palette
                      className="w-3 h-3"
                      style={{ color: task.color !== 'default'
                        ? colorOptions.find(c => c.color === task.color)?.value
                        : 'hsl(var(--muted-foreground))' }}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-1.5"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <div className="flex flex-col gap-1">
                    {colorOptions.map(({ color, pastelValue, value, label }) => {
                      const isSelected = task.color === color;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            updateTask(task.id, { color });
                            setShowColorPicker(false);
                          }}
                          className={cn(
                            "w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center",
                            "hover:opacity-80",
                            isSelected && "ring-2 ring-offset-1 ring-offset-background"
                          )}
                          style={{ 
                            backgroundColor: pastelValue,
                            ...(isSelected && { ringColor: value })
                          }}
                          title={label}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3" style={{ color: value }} strokeWidth={3} />
                          )}
                        </button>
                      );
                    })}
                    {/* No color option - just X on white */}
                    <button
                      onClick={() => {
                        updateTask(task.id, { color: 'default' });
                        setShowColorPicker(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-60"
                      title="No highlight"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Repeat */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1 h-7 px-2 rounded-md text-xs font-mono transition-colors shrink-0",
                    task.repeatPattern ? "bg-violet-500/10 text-violet-600" : "bg-muted/30 text-muted-foreground"
                  )}>
                    <Repeat className="w-3 h-3" />
                    {task.repeatPattern && <span>{repeatOptions.find(r => r.value === task.repeatPattern)?.label}</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[110px] p-1" align="start" side="bottom" sideOffset={4}>
                  <div className="space-y-0.5">
                    {repeatOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => updateTask(task.id, { repeatPattern: opt.value })}
                        className={cn(
                          "w-full text-left px-2 py-1.5 text-[11px] font-mono rounded transition-colors",
                          task.repeatPattern === opt.value 
                            ? "bg-violet-500/10 text-violet-600" 
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

            </div>
          </div>

          {/* SCROLLABLE SECTION: Subtasks & Notes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain">
            
            {/* Subtasks Section */}
            <div>
              <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide mb-2 flex items-center justify-between">
                <span>Subtasks</span>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-[10px] font-mono bg-muted/50 px-2 py-0.5 rounded-full">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {/* Existing Subtasks */}
                {task.subtasks?.map(subtask => (
                  <div 
                    key={subtask.id} 
                    className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg active:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all active:scale-90",
                        subtask.completed ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {subtask.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm font-mono leading-relaxed",
                      subtask.completed && "line-through text-muted-foreground"
                    )}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1.5 -mr-1.5 rounded-lg text-muted-foreground/30 active:text-destructive active:bg-destructive/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add New Subtask Row - same style as main task list input */}
                <div className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg">
                  <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground/30 flex-shrink-0" />
                  <input
                    ref={subtaskInputRef}
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    onBlur={handleAddSubtask}
                    placeholder="Add subtask..."
                    className="flex-1 text-sm font-mono bg-transparent border-none focus:ring-0 p-0 placeholder:text-muted-foreground/50 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlignLeft className="w-3 h-3" />
                <span>Notes</span>
              </div>
              <textarea
                ref={notesTextareaRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Add notes..."
                rows={3}
                className="w-full text-sm bg-muted/20 rounded-lg border border-border/30 resize-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 focus:border-primary/30 p-2.5"
              />
            </div>

            {/* Keyboard spacer - smaller */}
            <div className="h-32" />
          </div>

          {/* Floating Delete Button - Material Design FAB position */}
          <button
            onClick={handleDelete}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 active:scale-95 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Header Area */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-3">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <button className="group flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/50 transition-all duration-200 text-sm font-mono font-medium text-muted-foreground hover:text-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formattedDate}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                    selected={task.date ? new Date(task.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                         updateTask(task.id, { date: dateHelpers.toISOString(date) });
                         setShowDatePicker(false);
                      } else {
                         updateTask(task.id, { date: null });
                         setShowDatePicker(false);
                      }
                    }}
                initialFocus
              />
                </PopoverContent>
             </Popover>
             
             {/* Move to Inbox Quick Action if has date */}
             {task.date && (
                <button
                 onClick={() => updateTask(task.id, { date: null })}
                 className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors"
                >
                 Move to Inbox
                </button>
             )}
          </div>

          <div className="flex items-center gap-1">
              <button
               onClick={handleDelete}
               className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
               title="Delete Task"
             >
               <Trash2 className="w-4 h-4" />
              </button>
                    <button
                onClick={() => handleClose(false)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
             >
                <X className="w-5 h-5" />
                    </button>
              </div>
        </div>

        {/* Main Body - Desktop only, mobile shows compact version above */}
        <div className="hidden md:block px-8 py-6 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          
          {/* Title Input */}
          <div className="flex items-center gap-4">
              <button
                onClick={() => toggleTaskComplete(task.id)}
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  task.completed
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/40 hover:border-primary'
                )}
              >
                {task.completed && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
              </button>
            <div className="flex-1">
                <Input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTitle();
                      handleClose(false);
                    }
                  }}
                  placeholder="Add task..."
              className={cn(
                    'text-base font-mono border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-muted-foreground/50 leading-relaxed',
                    task.completed && 'line-through text-muted-foreground'
                  )}
                />
                  </div>
          </div>

          {/* Properties Grid */}
          <div className="flex flex-col gap-6 pl-10">
             
             {/* Time Block */}
             <div className="space-y-2">
                <div className="bg-muted/20 rounded-lg p-3 border border-border/40 hover:border-border/80 transition-colors">
                   <TimeSlotPicker
                     value={task.timeSlot || null}
                     onChange={handleTimeSlotChange}
                     className="w-full"
                     hideLabel={false}
                   />
                </div>
             </div>

             {/* Properties List */}
             <div className="space-y-3">
               <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground font-semibold flex items-center gap-1.5">
                  <AlignLeft className="w-3 h-3" /> Properties
               </label>
               
               <div className="flex flex-wrap gap-2 relative z-20">
                  {/* Color Picker - Dropdown Style */}
                  <div ref={colorPickerRef} className="relative">
                      <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                        className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-150 ease-out",
                        task.color !== 'default' 
                          ? "border-transparent text-foreground shadow-sm" 
                          : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground",
                        showColorPicker && "ring-2 ring-primary/20"
                      )}
                      style={{
                        backgroundColor: task.color !== 'default' 
                          ? colorOptions.find(c => c.color === task.color)?.pastelValue 
                          : 'transparent'
                      }}
                    >
                      <Palette className="w-3.5 h-3.5" 
                        style={{
                          color: task.color !== 'default' ? colorOptions.find(c => c.color === task.color)?.value : undefined
                        }}
                      />
                      <span>{task.color === 'default' ? 'Color' : colorOptions.find(c => c.color === task.color)?.label}</span>
                      </button>

                    {/* Dropdown Menu - Expands horizontally */}
                    <div className={cn(
                      "absolute top-full left-0 mt-1 z-50 overflow-hidden",
                      "rounded-md border border-border/60 bg-background/95 backdrop-blur-md shadow-lg",
                      "transition-all duration-100 ease-out",
                      showColorPicker 
                        ? "opacity-100 max-w-[300px]" 
                        : "opacity-0 max-w-0 pointer-events-none"
                    )}>
                      <div className="flex items-center gap-1.5 p-1.5 whitespace-nowrap">
                        {colorOptions.map((option) => (
                  <button
                            key={option.color}
                            onClick={() => {
                              setShowColorPicker(false);
                              updateTask(task.id, { color: option.color });
                            }}
                    className={cn(
                              "w-5 h-5 rounded transition-all duration-150 ease-out flex items-center justify-center",
                              "hover:scale-125",
                              task.color === option.color && "scale-110"
                            )}
                            style={{ backgroundColor: option.pastelValue }}
                            title={option.label}
                          >
                            {task.color === option.color && (
                              <Check
                                className="w-3 h-3 drop-shadow-sm"
                                strokeWidth={2.5}
                                style={{ color: option.value }}
                              />
                            )}
                      </button>
                        ))}
                  <button
                    onClick={() => {
                            setShowColorPicker(false);
                            updateTask(task.id, { color: 'default' });
                    }}
                    className={cn(
                            "w-5 h-5 rounded transition-all duration-150 ease-out flex items-center justify-center",
                            "hover:scale-125",
                            task.color === 'default' && "scale-110"
                          )}
                          title="No Color"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                    </div>
                  </div>

                  {/* Repeat */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all",
                         task.repeatPattern ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
                      )}>
                        <Repeat className="w-3.5 h-3.5" />
                        <span>{repeatOptions.find(r => r.value === task.repeatPattern)?.label || 'Repeat'}</span>
                    </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="start">
                      {repeatOptions.map(opt => (
                    <button
                          key={opt.label}
                          onClick={() => updateTask(task.id, { repeatPattern: opt.value })}
                          className="w-full text-left px-2 py-1.5 text-xs font-mono rounded hover:bg-accent"
                    >
                          {opt.label}
                    </button>
                      ))}
            </PopoverContent>
          </Popover>

                  {/* Reminder - Coming Soon */}
          <button
            disabled
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border/40 text-muted-foreground/50 cursor-not-allowed"
            title="Reminders coming soon"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reminder</span>
            <span className="text-[9px] bg-muted px-1 py-0.5 rounded">Soon</span>
          </button>

                  {/* Add to GCal - Coming Soon */}
            <button
            disabled
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-border/40 text-muted-foreground/50 cursor-not-allowed"
            title="Google Calendar sync coming soon"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>GCal</span>
            <span className="text-[9px] bg-muted px-1 py-0.5 rounded">Soon</span>
            </button>
        </div>
             </div>
          </div>

          {/* Notes */}
          <div className="pl-10 space-y-2">
            <textarea
              ref={notesTextareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
                placeholder="Add notes..."
                className="w-full min-h-[80px] text-sm bg-transparent border-none resize-none placeholder:text-muted-foreground/40 focus:ring-0 p-0 font-sans"
            />
          </div>

          {/* Subtasks */}
          <div className="pl-10 space-y-1">
             {/* Subtasks Header */}
             <div className="flex items-center justify-between mb-2">
               <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground font-semibold">
                 Subtasks
               </label>
               {task.subtasks && task.subtasks.length > 0 && (
                 <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                   {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                 </span>
               )}
             </div>
             
             {/* Existing Subtasks */}
             {task.subtasks?.map(subtask => (
               <div key={subtask.id} className="flex items-center gap-3 group py-2 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors">
                 <button
                   onClick={() => handleToggleSubtask(subtask.id)}
                   className={cn(
                     "group/checkbox flex-shrink-0 flex items-center justify-center",
                     "p-2 -m-2",
                     "transition-all duration-200 ease-out"
                   )}
                 >
                   <div className={cn(
                     "w-4 h-4 rounded-full border flex items-center justify-center",
                     "transition-all duration-200 ease-out",
                     "group-hover/checkbox:scale-110 group-active/checkbox:scale-90",
                     subtask.completed
                       ? "bg-primary border-primary text-primary-foreground"
                       : "border-muted-foreground/40 group-hover/checkbox:border-primary/60 bg-transparent"
                   )}>
                     {subtask.completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                   </div>
                 </button>
                 <span className={cn(
                   "text-sm font-mono flex-1 leading-relaxed transition-colors",
                   subtask.completed ? "line-through text-muted-foreground" : "text-foreground"
                 )}>
                   {subtask.title}
                 </span>
                 <button
                   onClick={() => handleDeleteSubtask(subtask.id)}
                   className={cn(
                     "opacity-0 group-hover:opacity-100 p-1 rounded",
                     "text-muted-foreground hover:text-destructive transition-all duration-200",
                     "hover:bg-destructive/10 hover:scale-110"
                   )}
                 >
                   <Trash2 className="w-3.5 h-3.5" />
                 </button>
               </div>
             ))}
             
             {/* Add Subtask Row - matches main task list input style */}
             <div className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg">
               <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground/30 flex-shrink-0" />
               <input
                 ref={subtaskInputRef}
                 value={newSubtask}
                 onChange={(e) => setNewSubtask(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                 onBlur={handleAddSubtask}
                 placeholder="Add subtask..."
                 className="bg-transparent border-none text-sm font-mono focus:ring-0 p-0 placeholder:text-muted-foreground/50 flex-1 leading-relaxed"
               />
             </div>
          </div>
        </div>

        {/* Mobile drag handle indicator at bottom */}
        <div className="md:hidden h-6" />

        </DialogContent>
      </Dialog>
  );
}
