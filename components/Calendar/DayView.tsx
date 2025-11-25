'use client';

import { useState, useEffect } from 'react';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { taskHelpers } from '@/lib/utils/taskHelpers';
import { TaskList } from './TaskList';
import { ProductivitySection } from './ProductivitySection';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function DayView() {
  const { state, tasks, moveTask } = useCalendar();
  const [isMounted, setIsMounted] = useState(false);
  const currentDay = state.currentDate;
  const dateStr = dateHelpers.toISOString(currentDay);
  const dayTasks = taskHelpers.filterTasksByDate(tasks, dateStr);

  // Only enable drag and drop after client-side mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

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
      // If dropped back in overdue, keep the original date (don't change)
      return;
    } else if (destination.droppableId.startsWith('project-')) {
      // If dropped in a project, keep the original date
      return;
    } else {
      // It's a date string (YYYY-MM-DD format)
      newDate = destination.droppableId;
    }

    // Get task and old date for undo
    const task = tasks.find(t => t.id === draggableId);
    const oldDate = task?.date || null;
    const taskName = task?.title?.trim() || 'Untitled task';

    moveTask(draggableId, newDate);
    
    // Show toast with undo
    const dateLabel = newDate ? format(new Date(newDate), 'MMM d') : 'Someday';
    toast(`"${taskName}" moved to ${dateLabel}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          moveTask(draggableId, oldDate);
        }
      }
    });
  };

  // Render without drag-drop on server/initial client render to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex flex-col h-full pb-4 px-3 sm:px-4 lg:px-6">
        {/* Current Day */}
        <div className="min-w-0 mb-8">
          <div className="mb-0 pb-2 border-b-2 border-border">
            <div className="text-xs sm:text-sm text-muted-foreground font-mono mb-1">
              {dateHelpers.formatDayName(currentDay)}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono">
              {dateHelpers.formatDateDisplay(currentDay)}
            </div>
          </div>
          <TaskList
            date={dateStr}
            tasks={dayTasks}
            droppableId={dateStr}
            enableDragDrop={false}
          />
        </div>

        {/* Productivity Section - Bottom */}
        <ProductivitySection enableDragDrop={false} />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full pb-4 px-3 sm:px-4 lg:px-6">
        {/* Current Day */}
        <div className="min-w-0 mb-8">
          <div className="mb-0 pb-2 border-b-2 border-border">
            <div className="text-xs sm:text-sm text-muted-foreground font-mono mb-1">
              {dateHelpers.formatDayName(currentDay)}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono">
              {dateHelpers.formatDateDisplay(currentDay)}
            </div>
          </div>
          <TaskList
            date={dateStr}
            tasks={dayTasks}
            droppableId={dateStr}
          />
        </div>

        {/* Productivity Section - Bottom */}
        <ProductivitySection enableDragDrop={true} />
      </div>
    </DragDropContext>
  );
}

