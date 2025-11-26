'use client';

import { useState, useRef, useEffect } from 'react';

import { Task as TaskType } from '@/types';
import { Task } from './Task';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { taskHelpers } from '@/lib/utils/taskHelpers';
import { storage } from '@/lib/utils/storage';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { parseTaskInput, getDatePreview } from '@/lib/utils/nlpParser';

interface TaskListProps {
  date: string | null;
  tasks: TaskType[];
  droppableId: string;
  enableDragDrop?: boolean;
  showLinedBackground?: boolean;
  projectId?: string | null;
}

export function TaskList({ date, tasks, droppableId, enableDragDrop = true, showLinedBackground = false, projectId }: TaskListProps) {
  const { addTask, updateTask } = useCalendar();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [datePreview, setDatePreview] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSavedRef = useRef(false);
  const isComposingRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Reset justAdded state on mouse move
  useEffect(() => {
    if (!justAdded) return;
    
    const handleMouseMove = () => {
      setJustAdded(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { once: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [justAdded]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
      // Set cursor to the beginning
      inputRef.current.setSelectionRange(0, 0);
      hasSavedRef.current = false; // Reset save flag when starting to add
    }
  }, [isAdding]);

  // Save task when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Skip if already saved or not adding
      if (!isAdding || hasSavedRef.current) return;
      
      // Skip if clicking inside the input
      if (inputRef.current && inputRef.current.contains(e.target as Node)) return;
      
      // Skip if clicking on any button (like delete, color picker, etc.)
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;

      // Save if there's text
      if (newTaskTitle.trim()) {
        hasSavedRef.current = true;

        const parsed = parseTaskInput(newTaskTitle, date);
        const taskDate = parsed.date || date;

        addTask({
          title: parsed.title || newTaskTitle.trim(),
          color: 'default',
          completed: false,
          date: taskDate,
          projectId,
          timeSlot: parsed.time,
        });
        setNewTaskTitle('');
        setDatePreview(null);
        setIsAdding(false);
      } else {
        setDatePreview(null);
        setIsAdding(false);
      }
    };

    if (isAdding) {
      // Use setTimeout to ensure this runs after any other click handlers
      setTimeout(() => {
        document.addEventListener('mousedown', handleDocumentClick);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isAdding, newTaskTitle, date, projectId, addTask]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      isSubmittingRef.current = true;
      hasSavedRef.current = true;

      // Parse the input using NLP with the current column date as reference
      const parsed = parseTaskInput(newTaskTitle, date);

      // Use parsed date if available (and different from ref), otherwise use the original date
      // This handles cases where chrono returns the ref date when only time is parsed
      const taskDate = parsed.date || date;

      addTask({
        title: parsed.title || newTaskTitle.trim(),
        color: 'default',
        completed: false,
        date: taskDate,
        projectId,
        timeSlot: parsed.time,
      });

      setNewTaskTitle('');
      setDatePreview(null);
      // Keep isAdding true and refocus to allow continuous task entry
      hasSavedRef.current = false; // Reset for next task
      setJustAdded(true); // Prevent immediate hover on new task
      
      // Refocus the input for the next task
      // Use requestAnimationFrame for better timing than setTimeout
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          isSubmittingRef.current = false;
        }
      });
    } else {
      setIsAdding(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTaskTitle(value);

    // Update date preview - clear immediately if empty
    if (!value || !value.trim()) {
      setDatePreview(null);
    } else {
      const preview = getDatePreview(value, date);
      setDatePreview(preview);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ignore Enter key during IME composition (Korean, Japanese, Chinese, etc.)
    if (e.key === 'Enter' && !isComposingRef.current) {
      e.preventDefault(); // Prevent default to avoid form submission or other side effects
      handleAddTask();
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setDatePreview(null);
      setIsAdding(false);
      inputRef.current?.blur();
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't handle blur if clicking on a button (let the button's onClick handle it)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('button')) {
      return;
    }
    
    // Skip if submitting or already saved
    if (isSubmittingRef.current || hasSavedRef.current) return;

    if (newTaskTitle.trim()) {
      hasSavedRef.current = true;
      
      const parsed = parseTaskInput(newTaskTitle, date);
      const taskDate = parsed.date || date;
      
      addTask({
        title: parsed.title || newTaskTitle.trim(),
        color: 'default',
        completed: false,
        date: taskDate,
        projectId,
        timeSlot: parsed.time,
      });
      setNewTaskTitle('');
      setDatePreview(null);
      setIsAdding(false);
    } else {
      setDatePreview(null);
      setIsAdding(false);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't trigger if we're already adding
    if (isAdding) return;

    // Don't trigger if clicking on a task or the input
    const target = e.target as HTMLElement;
    if (target.closest('[data-rfd-draggable-id]') || target.closest('input') || target.closest('button')) {
      return;
    }

    setIsAdding(true);
  };

  // Sort tasks based on order field, then by creation date as fallback
  const moveCompletedToBottom = typeof window !== 'undefined' 
    ? storage.get<boolean>('aerotodo_move_completed_to_bottom', false)
    : false;
  
  // Sort by order field first, then by creation date, optionally with completed at bottom
  const activeTasks = [...tasks].sort((a, b) => {
    // If moveCompletedToBottom is enabled, completed tasks go to the bottom first
    if (moveCompletedToBottom) {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
    }
    
    // Then sort by order if both have it
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only one has order, prioritize the one with order
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // Fallback to creation date
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Calculate empty rows to fill space
  const minRows = 10;
  const occupiedRows = activeTasks.length + (isAdding ? 1 : 0);
  const emptyRowsCount = Math.max(0, minRows - occupiedRows);

  // Render without Droppable wrapper if drag-drop is disabled (SSR/initial render)
  if (!enableDragDrop) {
    return (
      <div 
        className="h-full px-0 pb-4 relative space-y-1"
      >
        {/* Active Tasks */}
        {activeTasks.map((task, index) => (
          <div 
            key={task.id} 
            className={cn(justAdded && "pointer-events-none")}
            style={{
              animation: `slideInFromBottom 0.25s ease-out ${index * 0.03}s both`
            }}
          >
            <Task task={task} dragHandleProps={{}} />
          </div>
        ))}

        {/* Add Task Input - Always visible at bottom */}
        <div 
          className={cn(
            "group min-h-[36px] py-2 px-3 rounded-lg transition-all flex items-start cursor-text",
            isAdding || newTaskTitle
              ? "bg-foreground/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-foreground/[0.06] opacity-100"
              : "bg-muted/20 hover:bg-muted/30 opacity-60 hover:opacity-80"
          )}
          onClick={() => {
            setIsAdding(true);
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
        >
          <div className="flex-1 flex flex-col">
            <input
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={handleInputChange}
              onFocus={() => setIsAdding(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Add task..."
              className="w-full px-0 py-0 bg-transparent border-0 text-sm font-mono outline-none focus:ring-0 placeholder:text-muted-foreground/50 text-left leading-relaxed"
              style={{ lineHeight: '1.5' }}
              onClick={(e) => {
                e.stopPropagation();
                if (inputRef.current) {
                  inputRef.current.setSelectionRange(0, 0);
                }
              }}
            />
            {datePreview && (
              <div className="text-[10px] font-mono text-primary/70 mt-0.5 leading-tight">
                📅 {datePreview}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="h-full px-0 pb-4 relative space-y-1"
        >
          {/* Active Tasks */}
          {activeTasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={cn(
                    justAdded && "pointer-events-none", 
                    "touch-manipulation"
                  )}
                  style={
                    snapshot.isDropAnimating
                      ? {
                        ...provided.draggableProps.style,
                        transitionDuration: '0.1s',
                        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)'
                      }
                      : provided.draggableProps.style
                  }
                >
                  <Task
                    task={task}
                    isDragging={snapshot.isDragging}
                    dragHandleProps={provided.dragHandleProps}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}

          {/* Add Task Input - Always visible at bottom */}
          <div 
            className={cn(
              "group min-h-[36px] py-2 px-3 rounded-lg transition-all flex items-start cursor-text",
              isAdding || newTaskTitle
                ? "bg-foreground/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-foreground/[0.06] opacity-100"
                : "bg-muted/20 hover:bg-muted/30 opacity-60 hover:opacity-80"
            )}
            onClick={() => {
              setIsAdding(true);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            <div className="flex-1 flex flex-col">
              <input
                ref={inputRef}
                type="text"
                value={newTaskTitle}
                onChange={handleInputChange}
                onFocus={() => setIsAdding(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Add task..."
                className="w-full px-0 py-0 bg-transparent border-0 text-sm font-mono outline-none focus:ring-0 placeholder:text-muted-foreground/50 text-left leading-relaxed"
                style={{ lineHeight: '1.5' }}
                onClick={(e) => e.stopPropagation()}
              />
              {datePreview && (
                <div className="text-[10px] font-mono text-primary/70 mt-0.5 leading-tight">
                  📅 {datePreview}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Droppable>
  );
}

