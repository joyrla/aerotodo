'use client';

import { useState, useEffect, useRef } from 'react';
import { Task as TaskType, TaskColor, RepeatPattern } from '@/types';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { Trash2, Plus, Repeat, Bell, Palette, ChevronDown, Clock, Calendar as CalendarIcon, X, RotateCw, CalendarDays, CalendarCheck, Check, Edit2, AlignLeft, ArrowRight, Inbox, Loader2 } from 'lucide-react';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { storage } from '@/lib/utils/storage';
import { toast } from 'sonner';

import { TASK_COLORS, getTaskColor, hexToRgba } from '@/components/ui/color-picker';

// Color grid matching the shared TASK_COLORS - all 12 colors (11 + clear)
const colorGrid: TaskColor[] = [
  'red', 'pink', 'orange', 'yellow',
  'green', 'teal', 'cyan', 'blue',
  'purple', 'brown', 'gray', 'default',
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
  const { updateTask, deleteTask, toggleTaskComplete, tasks, setCurrentDate, timePresets } = useCalendar();
  const { isConnected: isGcalConnected, syncTask, unsyncTask, settings: gcalSettings } = useGoogleCalendar();
  const [isSyncingToGcal, setIsSyncingToGcal] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showDesktopColorPicker, setShowDesktopColorPicker] = useState(false);
  const [showMobileColorPicker, setShowMobileColorPicker] = useState(false);
  const [showReminderManual, setShowReminderManual] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNavigateDialog, setShowNavigateDialog] = useState(false);
  const [selectedDateForNavigation, setSelectedDateForNavigation] = useState<Date | null>(null);
  const [optimisticSubtaskStates, setOptimisticSubtaskStates] = useState<Record<string, boolean | null>>({});
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);

    updateMatch();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    } else {
      mediaQuery.addListener(updateMatch);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      } else {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, []);

  const handleCalendarDateChange = (date: Date | null) => {
    if (date) {
      updateTask(task.id, { date: dateHelpers.toISOString(date) });
    } else {
      updateTask(task.id, { date: null });
    }
  };

  // Refs for inputs to capture values on close
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
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
        mobileSheet={!isDesktop}
        mobilePosition="bottom"
        className="w-full sm:max-w-lg bg-background border-border/50 p-0 gap-0 overflow-hidden backface-hidden"
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
                  className="p-0" 
                  align="start" 
                  side="bottom" 
                  sideOffset={4}
                >
                  <TaskDatePickerContent
                    variant="mobile"
                    selectedDate={task.date ? new Date(task.date) : null}
                    onSelectDate={handleCalendarDateChange}
                    onClose={() => setShowMobileDatePicker(false)}
                  />
                </PopoverContent>
              </Popover>

              {/* Time */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap",
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
                      return `${formatTime(task.timeSlot.start)} – ${formatTime(task.timeSlot.end)}`;
                    })() : 'Time'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2.5" align="start" side="bottom" sideOffset={4}>
                  <div className="space-y-2">
                    {/* Unified time row */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-lg">
                      <div className="relative w-[72px] shrink-0">
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
                        <div className="h-7 px-2 flex items-center justify-center text-[11px] font-mono text-orange-600 bg-orange-500/15 rounded-md font-medium whitespace-nowrap">
                          {(() => {
                            const time = task.timeSlot?.start || '09:00';
                            const [h, m] = time.split(':').map(Number);
                            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                          })()}
                        </div>
                      </div>
                      
                      <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">to</span>
                      
                      <div className="relative w-[72px] shrink-0">
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
                        <div className="h-7 px-2 flex items-center justify-center text-[11px] font-mono text-foreground bg-background rounded-md border border-border/40 whitespace-nowrap">
                          {(() => {
                            const time = task.timeSlot?.end || '10:00';
                            const [h, m] = time.split(':').map(Number);
                            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                          })()}
                        </div>
                      </div>

                      <button
                        onClick={() => task.timeSlot && handleTimeSlotChange(null)}
                        className={cn(
                          "h-7 w-7 flex items-center justify-center rounded-md transition-colors shrink-0",
                          task.timeSlot 
                            ? "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10" 
                            : "text-muted-foreground/20 cursor-default"
                        )}
                        disabled={!task.timeSlot}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Duration chips - more compact */}
                    <div className="flex gap-1 items-center">
                      {timePresets.map((d) => {
                        // Check if this duration matches current selection
                        const start = task.timeSlot?.start || '09:00';
                        const end = task.timeSlot?.end || '10:00';
                        const [sh, sm] = start.split(':').map(Number);
                        const [eh, em] = end.split(':').map(Number);
                        const currentDuration = (eh * 60 + em) - (sh * 60 + sm);
                        const isActive = task.timeSlot && currentDuration === d.minutes;
                        
                        return (
                          <button
                            key={d.id}
                            onClick={() => {
                              let startStr = task.timeSlot?.start;
                              if (!startStr) {
                                const now = new Date();
                                const h = now.getHours();
                                const m = now.getMinutes();
                                startStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                              }
                              const [h, m] = startStr.split(':').map(Number);
                              const endDate = new Date(2000, 0, 1, h, m + d.minutes);
                              handleTimeSlotChange({ 
                                start: startStr, 
                                end: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}` 
                              });
                            }}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-mono rounded-md transition-colors",
                              isActive 
                                ? "bg-orange-500/15 text-orange-600 font-medium" 
                                : "bg-muted/40 text-muted-foreground hover:bg-orange-500/10 hover:text-orange-600"
                            )}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                      <Link href="/settings?section=general">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted/60 ml-0.5">
                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Color - Mobile Popover */}
              <Popover open={showMobileColorPicker} onOpenChange={setShowMobileColorPicker}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0",
                      showMobileColorPicker && task.color === 'default' && "bg-accent"
                    )}
                    style={{
                      backgroundColor: task.color !== 'default' ? hexToRgba(getTaskColor(task.color), 0.15) : undefined,
                      color: task.color !== 'default' ? getTaskColor(task.color) : undefined
                    }}
                  >
                    <Palette className={cn(
                      "w-3.5 h-3.5",
                      task.color === 'default' ? "text-muted-foreground" : "text-current"
                    )} />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  align="start" 
                  side="bottom" 
                  className="w-auto p-1.5 rounded-lg border-border/20 bg-popover/98 backdrop-blur-xl shadow-xl shadow-black/15"
                  sideOffset={6}
                >
                  <div className="grid grid-cols-4 gap-0.5">
                    {colorGrid.map((color) => {
                      const isSelected = task.color === color;
                      const isDefault = color === 'default';
                      const value = getTaskColor(color);
                      const previewColor = isDefault ? 'transparent' : hexToRgba(value, 0.5);
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            updateTask(task.id, { color });
                            setShowMobileColorPicker(false);
                          }}
                          className={cn(
                            "w-7 h-7 rounded-md transition-all duration-150 flex items-center justify-center",
                            "hover:scale-110 active:scale-95",
                            isDefault && "border border-dashed border-muted-foreground/40"
                          )}
                          style={{ backgroundColor: previewColor }}
                        >
                          {isSelected && (
                            <Check 
                              className={cn("w-3.5 h-3.5", isDefault ? "text-muted-foreground" : "text-foreground")} 
                              strokeWidth={3}
                              style={{ color: isDefault ? undefined : value, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}
                            />
                          )}
                        </button>
                      );
                    })}
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

              {/* GCal - Mobile */}
              <button
                onClick={async () => {
                  if (!isGcalConnected) {
                    toast.info("Connect Google Calendar in Settings → Integrations");
                    return;
                  }
                  if (!gcalSettings.defaultCalendarId) {
                    toast.info("Select a calendar in Settings → Integrations");
                    return;
                  }
                  
                  setIsSyncingToGcal(true);
                  try {
                    if (task.googleCalendarEventId) {
                      const confirmed = window.confirm("Remove from Google Calendar?");
                      if (confirmed) {
                        const success = await unsyncTask(task);
                        if (success) {
                          updateTask(task.id, { googleCalendarEventId: null });
                        }
                      }
                    } else {
                      const eventId = await syncTask(task);
                      if (eventId) {
                        updateTask(task.id, { googleCalendarEventId: eventId });
                      }
                    }
                  } finally {
                    setIsSyncingToGcal(false);
                  }
                }}
                disabled={isSyncingToGcal}
                className={cn(
                  "flex items-center gap-1 h-7 px-2 rounded-md text-xs font-mono transition-colors shrink-0",
                  task.googleCalendarEventId
                    ? "bg-green-500/10 text-green-600"
                    : isGcalConnected
                      ? "bg-muted/30 text-muted-foreground"
                      : "bg-muted/30 text-muted-foreground/50"
                )}
              >
                {isSyncingToGcal ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CalendarCheck className="w-3 h-3" />
                )}
                {task.googleCalendarEventId && <Check className="w-2.5 h-2.5" />}
              </button>

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
                {/* Existing Subtasks - sorted with completed at bottom if setting enabled */}
                {(() => {
                  const moveCompletedToBottom = typeof window !== 'undefined' 
                    ? storage.get<boolean>('aerotodo_move_completed_to_bottom', false)
                    : false;
                  
                  const sortedSubtasks = [...(task.subtasks || [])].sort((a, b) => {
                    if (moveCompletedToBottom && a.completed !== b.completed) {
                      return a.completed ? 1 : -1;
                    }
                    return 0;
                  });
                  
                  return sortedSubtasks;
                })().map(subtask => (
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

        {/* Desktop - Optimized layout with refined UX */}
        <div className="hidden md:flex flex-col w-full h-full">
          
          {/* Header: Title with Checkbox & Actions */}
          <div className="flex items-start gap-4 px-6 pt-6 pb-4">
            <button
              onClick={() => toggleTaskComplete(task.id)}
              className={cn(
                'w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105',
                task.completed
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/30 hover:border-primary/60'
              )}
            >
              {task.completed && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <Input
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
                placeholder="Task name..."
                className={cn(
                  'text-base font-medium font-mono border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-muted-foreground/40',
                  task.completed && 'line-through text-muted-foreground'
                )}
              />
            </div>
            
            <div className="flex items-center gap-1 -mt-1">
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleClose(false)}
                className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions - Pill style buttons */}
          <div className="flex items-center gap-2 px-6 pb-5 flex-wrap">
            {/* Date */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-mono transition-all border",
                  task.date 
                    ? "bg-primary/8 text-primary border-primary/20 hover:bg-primary/12" 
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60 hover:text-foreground"
                )}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{task.date ? format(new Date(task.date), 'EEE, MMM d') : 'Add date'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-auto" align="start" sideOffset={6}>
                <TaskDatePickerContent
                  variant="desktop"
                  selectedDate={task.date ? new Date(task.date) : null}
                  onSelectDate={handleCalendarDateChange}
                  onClose={() => setShowDatePicker(false)}
                />
              </PopoverContent>
            </Popover>

            {/* Time */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-mono transition-all border whitespace-nowrap",
                  task.timeSlot 
                    ? "bg-orange-500/8 text-orange-600 border-orange-500/20 hover:bg-orange-500/12" 
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60 hover:text-foreground"
                )}>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{task.timeSlot ? (() => {
                    const formatTime = (time: string) => {
                      const [h, m] = time.split(':').map(Number);
                      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                    };
                    return `${formatTime(task.timeSlot.start)} – ${formatTime(task.timeSlot.end)}`;
                  })() : 'Add time'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start" side="bottom" sideOffset={6}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <input
                        type="text"
                        key={`start-${task.timeSlot?.start}`}
                        defaultValue={(() => {
                          if (!task.timeSlot?.start) return '';
                          const [h, m] = task.timeSlot.start.split(':').map(Number);
                          const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                        })()}
                        placeholder="-- --"
                        className="h-9 px-3 flex items-center justify-center text-sm font-mono rounded-lg border border-transparent bg-orange-500/10 text-orange-700 focus:bg-orange-500/20 focus:border-orange-500/30 focus:ring-0 focus:outline-none text-center w-[100px] transition-all placeholder:text-orange-700/50 selection:bg-orange-200 selection:text-orange-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const input = e.target.value;
                          if (!input) return;
                          
                          // Simple parsing logic
                          const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/i;
                          const match = input.match(timeRegex);
                          
                          if (match) {
                            let [_, hStr, mStr, meridiem] = match;
                            let h = parseInt(hStr);
                            let m = mStr ? parseInt(mStr) : 0;
                            
                            if (meridiem) {
                              const isPM = meridiem.toLowerCase().startsWith('p');
                              if (isPM && h < 12) h += 12;
                              if (!isPM && h === 12) h = 0;
                            } else if (h < 8) {
                              // Assume PM for small numbers if no meridiem provided? Or keep 24h?
                              // Let's stick to 24h or AM default if ambiguous, but 9 -> 09:00.
                              // Common UX: < 12 is AM, > 12 is PM.
                              // But 1-7 might mean PM in work context? Let's keep simple: AM default unless typed 13+.
                            }

                            const newStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                            handleTimeSlotChange({ 
                              start: newStart, 
                              end: task.timeSlot?.end || '10:00' 
                            });
                          } else {
                            // Revert on invalid (trigger re-render via key update or manual reset)
                            e.target.value = e.target.defaultValue;
                          }
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-medium">→</span>
                    <div className="relative group">
                      <input
                        type="text"
                        key={`end-${task.timeSlot?.end}`}
                        defaultValue={(() => {
                          if (!task.timeSlot?.end) return '';
                          const [h, m] = task.timeSlot.end.split(':').map(Number);
                          const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                        })()}
                        placeholder="-- --"
                        className="h-9 px-3 flex items-center justify-center text-sm font-mono rounded-lg border border-transparent bg-orange-500/10 text-orange-700 focus:bg-orange-500/20 focus:border-orange-500/30 focus:ring-0 focus:outline-none text-center w-[100px] transition-all placeholder:text-orange-700/50 selection:bg-orange-200 selection:text-orange-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const input = e.target.value;
                          if (!input) return;
                          
                          const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/i;
                          const match = input.match(timeRegex);
                          
                          if (match) {
                            let [_, hStr, mStr, meridiem] = match;
                            let h = parseInt(hStr);
                            let m = mStr ? parseInt(mStr) : 0;
                            
                            if (meridiem) {
                              const isPM = meridiem.toLowerCase().startsWith('p');
                              if (isPM && h < 12) h += 12;
                              if (!isPM && h === 12) h = 0;
                            }

                            const newEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                            handleTimeSlotChange({ 
                              start: task.timeSlot?.start || '09:00', 
                              end: newEnd 
                            });
                          } else {
                            e.target.value = e.target.defaultValue;
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => task.timeSlot && handleTimeSlotChange(null)}
                      className={cn(
                        "h-9 w-9 flex items-center justify-center rounded-lg transition-all shrink-0",
                        task.timeSlot 
                          ? "text-red-500 hover:bg-red-500/10" 
                          : "text-muted-foreground/20 cursor-default"
                      )}
                      disabled={!task.timeSlot}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    {timePresets.map((d) => {
                      const start = task.timeSlot?.start || '09:00';
                      const end = task.timeSlot?.end || '10:00';
                      const [sh, sm] = start.split(':').map(Number);
                      const [eh, em] = end.split(':').map(Number);
                      const currentDuration = (eh * 60 + em) - (sh * 60 + sm);
                      const isActive = task.timeSlot && currentDuration === d.minutes;
                      return (
                        <button
                          key={d.id}
                          onClick={() => {
                            let startStr = task.timeSlot?.start;
                            
                            if (!startStr) {
                              const now = new Date();
                              const h = now.getHours();
                              const m = now.getMinutes();
                              startStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                            }

                            const [sh, sm] = startStr.split(':').map(Number);
                            const endMinutes = sh * 60 + sm + d.minutes;
                            const endH = Math.floor(endMinutes / 60) % 24;
                            const endM = endMinutes % 60;
                            
                            handleTimeSlotChange({
                              start: startStr,
                              end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
                            });
                          }}
                          className={cn(
                            "px-3 py-1.5 text-xs font-mono rounded-md transition-all",
                            isActive 
                              ? "bg-orange-500/15 text-orange-600 font-medium" 
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                    <Link href="/settings?section=general">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted/60 ml-0.5">
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Color */}
            <Popover open={showDesktopColorPicker} onOpenChange={setShowDesktopColorPicker}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center transition-all border",
                    task.color !== 'default'
                      ? "border-transparent hover:bg-accent"
                      : "bg-muted/40 border-transparent hover:bg-muted/60",
                    showDesktopColorPicker && task.color === 'default' && "ring-2 ring-primary/20"
                  )}
                  style={{
                    backgroundColor: task.color !== 'default' ? hexToRgba(getTaskColor(task.color), 0.15) : undefined,
                    color: task.color !== 'default' ? getTaskColor(task.color) : undefined
                  }}
                >
                  <Palette className={cn(
                    "w-3.5 h-3.5",
                    task.color === 'default' ? "text-muted-foreground" : "text-current"
                  )} />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                align="start" 
                side="bottom" 
                className="w-auto p-1.5 rounded-lg border-border/20 bg-popover/98 backdrop-blur-xl shadow-xl shadow-black/15"
                sideOffset={6}
              >
                <div className="grid grid-cols-4 gap-0.5">
                  {colorGrid.map((color) => {
                    const isSelected = task.color === color;
                    const isDefault = color === 'default';
                    const value = getTaskColor(color);
                    const previewColor = isDefault ? 'transparent' : hexToRgba(value, 0.5);
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setShowDesktopColorPicker(false);
                          updateTask(task.id, { color });
                        }}
                        className={cn(
                          "w-7 h-7 rounded-md transition-all duration-150 flex items-center justify-center",
                          "hover:scale-110 active:scale-95",
                          isDefault && "border border-dashed border-muted-foreground/40"
                        )}
                        style={{ backgroundColor: previewColor }}
                        title={isDefault ? 'No Color' : color.charAt(0).toUpperCase() + color.slice(1)}
                      >
                        {isSelected && (
                          <Check 
                            className={cn("w-3.5 h-3.5", isDefault ? "text-muted-foreground" : "text-foreground")} 
                            strokeWidth={3}
                            style={{ color: isDefault ? undefined : value, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Repeat */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all border",
                  task.repeatPattern 
                    ? "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/15" 
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60 hover:text-foreground"
                )}>
                  <Repeat className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[140px] p-1.5" align="start" side="bottom" sideOffset={6}>
                <div className="space-y-0.5">
                  {repeatOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => updateTask(task.id, { repeatPattern: opt.value })}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-mono rounded-md transition-colors",
                        task.repeatPattern === opt.value 
                          ? "bg-violet-500/10 text-violet-600 font-medium" 
                          : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Reminder - Coming Soon */}
            <button
              onClick={() => toast.info("Reminders are coming soon!")}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-mono border border-transparent bg-muted/40 text-muted-foreground/50 hover:bg-muted/60 hover:text-muted-foreground transition-colors"
              title="Reminders coming soon"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminder</span>
              <span className="text-[9px] bg-muted-foreground/10 px-1 rounded">Soon</span>
            </button>

            {/* GCal Sync Button */}
            <button
              onClick={async () => {
                if (!isGcalConnected) {
                  toast.info("Connect Google Calendar in Settings → Integrations");
                  return;
                }
                if (!gcalSettings.defaultCalendarId) {
                  toast.info("Select a calendar in Settings → Integrations");
                  return;
                }
                
                setIsSyncingToGcal(true);
                try {
                  if (task.googleCalendarEventId) {
                    // Already synced - offer to remove
                    const confirmed = window.confirm("This task is already synced. Remove from Google Calendar?");
                    if (confirmed) {
                      const success = await unsyncTask(task);
                      if (success) {
                        updateTask(task.id, { googleCalendarEventId: null });
                      }
                    }
                  } else {
                    // Sync to Google Calendar
                    const eventId = await syncTask(task);
                    if (eventId) {
                      updateTask(task.id, { googleCalendarEventId: eventId });
                    }
                  }
                } finally {
                  setIsSyncingToGcal(false);
                }
              }}
              disabled={isSyncingToGcal}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-mono border border-transparent transition-colors",
                task.googleCalendarEventId
                  ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                  : isGcalConnected
                    ? "bg-muted/40 text-foreground/70 hover:bg-muted/60"
                    : "bg-muted/40 text-muted-foreground/50 hover:bg-muted/60 hover:text-muted-foreground"
              )}
              title={
                task.googleCalendarEventId 
                  ? "Synced to Google Calendar (click to remove)" 
                  : isGcalConnected 
                    ? "Sync to Google Calendar"
                    : "Connect Google Calendar in Settings"
              }
            >
              {isSyncingToGcal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CalendarCheck className="w-3.5 h-3.5" />
              )}
              <span>GCal</span>
              {task.googleCalendarEventId && (
                <Check className="w-3 h-3" />
              )}
              {!isGcalConnected && (
                <span className="text-[9px] bg-muted-foreground/10 px-1 rounded">Setup</span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-6" />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-h-[50vh]">
            
            {/* Subtasks Section */}
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Subtasks</span>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded-full">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-0.5">
                {(() => {
                  const moveCompletedToBottom = typeof window !== 'undefined' 
                    ? storage.get<boolean>('aerotodo_move_completed_to_bottom', false)
                    : false;
                  
                  const sortedSubtasks = [...(task.subtasks || [])].sort((a, b) => {
                    if (moveCompletedToBottom && a.completed !== b.completed) {
                      return a.completed ? 1 : -1;
                    }
                    return 0;
                  });
                  
                  return sortedSubtasks;
                })().map(subtask => (
                  <div 
                    key={subtask.id} 
                    className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className={cn(
                        "w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all hover:scale-105",
                        subtask.completed 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground/30 hover:border-primary/60"
                      )}
                    >
                      {subtask.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm font-mono",
                      subtask.completed && "line-through text-muted-foreground/60"
                    )}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1.5 -mr-1.5 rounded-md text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-dashed border-muted-foreground/25 flex-shrink-0" />
                  <input
                    ref={subtaskInputRef}
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    onBlur={handleAddSubtask}
                    placeholder="Add subtask..."
                    className="bg-transparent border-none text-sm font-mono focus:ring-0 p-0 placeholder:text-muted-foreground/35 flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Notes</span>
              </div>
              <div className="bg-muted/20 rounded-xl border border-border/30 hover:border-border/50 transition-colors focus-within:border-primary/30 focus-within:bg-muted/30">
                <textarea
                  ref={notesTextareaRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Add notes..."
                  className="w-full min-h-[100px] text-sm bg-transparent border-none resize-none placeholder:text-muted-foreground/35 focus:ring-0 p-4 font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile drag handle indicator at bottom */}
        <div className="md:hidden h-6" />

        </DialogContent>
      </Dialog>
  );
}

type DatePickerVariant = "mobile" | "desktop";

interface TaskDatePickerContentProps {
  variant: DatePickerVariant;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  onClose: () => void;
}

const DATE_PICKER_CALENDAR_CLASSNAMES = {
  months: "flex flex-col relative",
  month: "space-y-2",
  month_caption: "flex items-center justify-center h-8 px-8",
  caption_label: "text-xs font-medium font-mono",
  nav: "flex items-center w-full absolute top-0 inset-x-0 justify-between px-1 h-8",
  button_previous:
    "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 transition-colors rounded-md hover:bg-muted inline-flex items-center justify-center",
  button_next:
    "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 transition-colors rounded-md hover:bg-muted inline-flex items-center justify-center",
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
};

const DATE_PICKER_MODIFIER_CLASSNAMES = {
  selected: "!bg-muted !text-muted-foreground font-medium",
  today: "!bg-primary text-primary-foreground font-medium",
};

function TaskDatePickerContent({
  variant,
  selectedDate,
  onSelectDate,
  onClose,
}: TaskDatePickerContentProps) {
  const isDesktop = variant === "desktop";
  const widthClass = "w-[280px]";
  const textSizeClass = isDesktop ? "text-xs" : "text-[10px]";

  const handleSelect = (date: Date | null) => {
    onSelectDate(date);
    onClose();
  };

  const isSameDay = (base: Date | null, comparison: Date) => {
    if (!base) return false;
    return (
      base.getFullYear() === comparison.getFullYear() &&
      base.getMonth() === comparison.getMonth() &&
      base.getDate() === comparison.getDate()
    );
  };

  const quickActions: Array<{
    label: string;
    getDate: () => Date;
  }> = [
    { label: "Today", getDate: () => new Date() },
    {
      label: "Tomorrow",
      getDate: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      },
    },
    {
      label: "Weekend",
      getDate: () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
        const weekend = new Date(today);
        weekend.setDate(today.getDate() + daysUntilSaturday);
        return weekend;
      },
    },
    {
      label: "+1 Week",
      getDate: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
      },
    },
  ];

  return (
    <div className={cn("text-left", widthClass)}>
      <Calendar
        mode="single"
        selected={selectedDate ?? undefined}
        onSelect={(date) => handleSelect(date ?? null)}
        classNames={DATE_PICKER_CALENDAR_CLASSNAMES}
        modifiersClassNames={DATE_PICKER_MODIFIER_CLASSNAMES}
        initialFocus={isDesktop}
      />
      <div className="p-2 border-t border-border/50">
        <button
          onClick={() => handleSelect(null)}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Move to Inbox</span>
        </button>
      </div>
    </div>
  );
}
