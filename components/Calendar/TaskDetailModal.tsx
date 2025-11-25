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

const repeatOptions: Array<{ value: RepeatPattern; label: string }> = [
  { value: null, label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
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
        className="w-full h-full sm:h-auto sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/50 p-0 gap-0 overflow-hidden shadow-2xl rounded-none sm:rounded-lg"
        style={{ boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.25)' }}
        onOpenAutoFocus={(e) => {
          if (!task.title) {
            e.preventDefault();
            requestAnimationFrame(() => titleInputRef.current?.focus());
          }
        }}
      >
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
        
        {/* Header Area */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/10">
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

        {/* Main Body */}
        <div className="px-8 py-6 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          
          {/* Title Input */}
          <div className="flex items-center gap-4">
              <button
                onClick={() => toggleTaskComplete(task.id)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  task.completed
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30 hover:border-primary'
                )}
              >
                {task.completed && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
              </button>
            <div className="flex-1">
                <Input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent default form submission if any
                      handleSaveTitle();
                      handleClose(false); // Close on Enter
                    }
                  }}
                  placeholder="Task title"
              className={cn(
                    'text-xl font-medium border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-muted-foreground/40',
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
          <div className="pl-10 space-y-3">
             <div className="flex flex-col gap-1">
               {task.subtasks?.map(subtask => (
                 <div key={subtask.id} className="flex items-center gap-3 group min-h-[32px]">
                <button
                      onClick={() => handleToggleSubtask(subtask.id)}
                  className={cn(
                        "group/checkbox flex-shrink-0 flex items-center justify-center",
                        "p-2 -m-2", // Bigger hit area
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
             </div>
             
             <div className="flex items-center gap-3 text-muted-foreground/60 pl-0.5">
               <Plus className="w-4 h-4" />
               <input
                ref={subtaskInputRef}
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                onBlur={handleAddSubtask}
                 placeholder="Add subtask"
                 className="bg-transparent border-none text-sm font-mono focus:ring-0 p-0 placeholder:text-muted-foreground/60 flex-1"
               />
            </div>
          </div>

              </div>

        </DialogContent>
      </Dialog>
  );
}
