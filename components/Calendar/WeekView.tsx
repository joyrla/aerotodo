'use client';

import { useState, useEffect } from 'react';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { taskHelpers } from '@/lib/utils/taskHelpers';
import { TaskList } from './TaskList';
import { ProductivitySection } from './ProductivitySection';
import { TimeGridWeekView } from './TimeGridWeekView';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface WeekViewProps {
  viewMode?: 'list' | 'schedule';
}

export function WeekView({ viewMode = 'list' }: WeekViewProps) {
  const { state, tasks, moveTask } = useCalendar();
  const { preferences } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  const weekDays = dateHelpers.getWeekDays(state.currentDate, preferences.weekStartsOn as 0 | 1);

  // Only enable drag and drop after client-side mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Determine the new date
    let newDate: string | null = null;
    
    if (destination.droppableId === 'someday') {
      newDate = null;
    } else if (destination.droppableId === 'overdue') {
      // If dropped back in overdue, keep the current date (don't change it)
      // The task will remain in overdue if its date is still in the past
      return;
    } else if (destination.droppableId === 'upcoming') {
      // Upcoming is drop-disabled, but handle gracefully
      return;
    } else if (destination.droppableId.startsWith('project-')) {
      // If dropped in a project, keep the original date
      return;
    } else {
      // It's a date string (YYYY-MM-DD format) - reschedule the task
      newDate = destination.droppableId;
    }

    // Get task and old date for undo
    const task = tasks.find(t => t.id === draggableId);
    const oldDate = task?.date || null;
    const oldIndex = source.index;
    const taskName = task?.title?.trim() || 'Untitled task';

    // Move/reschedule the task with destination index for proper ordering
    moveTask(draggableId, newDate, destination.index);

    // Show toast with undo only if date changed
    if (oldDate !== newDate) {
      const dateLabel = newDate ? format(new Date(newDate), 'MMM d') : 'Someday';
      toast(`"${taskName}" moved to ${dateLabel}`, {
        action: {
          label: 'Undo',
          onClick: () => {
            moveTask(draggableId, oldDate, oldIndex);
          }
        }
      });
    }
  };

  // Show schedule view
  if (viewMode === 'schedule' && isMounted) {
    return <TimeGridWeekView />;
  }

  // Render without drag-drop on server/initial client render to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex flex-col pb-8">
        {/* Main Week Grid - All 7 Days */}
        <div className="min-w-0 mb-2">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-5">
            {weekDays.map((day) => {
              const dateStr = dateHelpers.toISOString(day);
              const dayTasks = taskHelpers.filterTasksByDate(tasks, dateStr);
              const isToday = dateHelpers.isToday(day);
              const isPast = dateHelpers.isPast(day);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'flex-1 w-full lg:min-w-[160px] flex flex-col',
                    isPast && !isToday && 'opacity-60'
                  )}
                >
                  {/* Day Header - Sticky on mobile */}
                  <div
                    className={cn(
                      'py-3 border-b transition-colors flex-shrink-0 flex items-center justify-between',
                      'sticky top-[52px] z-10 bg-background',
                      'lg:static lg:py-0 lg:mb-2 lg:pb-2 lg:h-[32px]',
                      isToday ? 'border-primary' : 'border-border/50'
                    )}
                  >
                    <div className="flex items-baseline gap-2">
                      <div className={cn(
                        "text-[10px] uppercase tracking-wider font-mono font-medium",
                        isToday ? "text-primary" : "text-muted-foreground/60"
                      )}>
                      {dateHelpers.formatDayName(day)}
                    </div>
                    <div
                      className={cn(
                          'text-lg font-bold font-mono leading-none',
                          isToday ? 'text-primary' : 'text-foreground/80'
                      )}
                    >
                      {dateHelpers.formatDateDisplay(day)}
                      </div>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="min-h-[100px] lg:min-h-[400px] py-2 lg:py-0">
                    <TaskList
                      date={dateStr}
                      tasks={dayTasks}
                      droppableId={dateStr}
                      enableDragDrop={false}
                      showLinedBackground={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Productivity Section - Bottom */}
        <ProductivitySection enableDragDrop={false} />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col pb-8">
        {/* Main Week Grid - All 7 Days */}
        <div className="min-w-0 mb-2">
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-5">
            {weekDays.map((day) => {
              const dateStr = dateHelpers.toISOString(day);
              const dayTasks = taskHelpers.filterTasksByDate(tasks, dateStr);
              const isToday = dateHelpers.isToday(day);
              const isPast = dateHelpers.isPast(day);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'flex-1 w-full lg:min-w-[160px] flex flex-col',
                    isPast && !isToday && 'opacity-60'
                  )}
                >
                  {/* Day Header - Sticky on mobile */}
                  <div
                    className={cn(
                      'py-3 border-b transition-colors flex-shrink-0 flex items-center justify-between',
                      'sticky top-[52px] z-10 bg-background',
                      'lg:static lg:py-0 lg:mb-2 lg:pb-2 lg:h-[32px]',
                      isToday ? 'border-primary' : 'border-border/50'
                    )}
                  >
                    <div className="flex items-baseline gap-2">
                      <div className={cn(
                        "text-[10px] uppercase tracking-wider font-mono font-medium",
                        isToday ? "text-primary" : "text-muted-foreground/60"
                      )}>
                      {dateHelpers.formatDayName(day)}
                    </div>
                    <div
                      className={cn(
                          'text-lg font-bold font-mono leading-none',
                          isToday ? 'text-primary' : 'text-foreground/80'
                      )}
                    >
                      {dateHelpers.formatDateDisplay(day)}
                      </div>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="min-h-[100px] lg:min-h-[400px] py-2 lg:py-0">
                    <TaskList
                      date={dateStr}
                      tasks={dayTasks}
                      droppableId={dateStr}
                      showLinedBackground={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Productivity Section - Bottom */}
        <ProductivitySection enableDragDrop={true} />
      </div>
    </DragDropContext>
  );
}

