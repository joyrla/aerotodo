'use client';

import { useState, useEffect } from 'react';
import { ModuleRenderer } from './modules/ModuleRenderer';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { cn } from '@/lib/utils';

interface ProductivitySectionProps {
  enableDragDrop?: boolean;
}

export function ProductivitySection({ enableDragDrop = true }: ProductivitySectionProps) {
  const { tasks, moveTask } = useCalendar();
  const { moduleConfigs } = useSettings();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    // Handle dropping back into overdue - preserve original date
    if (destination.droppableId === 'overdue') {
      return;
    }

    // Handle dropping into someday/inbox
    if (destination.droppableId === 'someday') {
      moveTask(draggableId, null);
      return;
    }

    // Handle dropping into other modules (today, upcoming, later, etc.)
    if (destination.droppableId === 'today' || 
        destination.droppableId === 'upcoming' || 
        destination.droppableId === 'later' ||
        destination.droppableId === 'waiting' ||
        destination.droppableId === 'archive' ||
        destination.droppableId === 'habit-streak') {
      // For now, these modules don't accept drops - could be enhanced later
      return;
    }

    // Handle date-based drops (from overdue to specific dates)
    if (destination.droppableId.startsWith('date-')) {
      const dateStr = destination.droppableId.replace('date-', '');
      moveTask(draggableId, dateStr);
      return;
    }

    // Handle project drops
    if (destination.droppableId.startsWith('project-')) {
      const projectId = destination.droppableId.replace('project-', '');
      if (projectId === 'none') return;
      
      const task = tasks.find(t => t.id === draggableId);
      if (task) {
        moveTask(draggableId, task.date);
        // Note: project assignment would need to be handled via updateTask
        // This is a simplified version
      }
      return;
    }
  };

  // Get enabled modules sorted by order
  const enabledModules = moduleConfigs
    .filter(config => config.enabled)
    .sort((a, b) => a.order - b.order);

  if (!isMounted) {
    return null;
  }

  const content = (
    <div className="pt-4 overflow-visible">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 overflow-visible">
        {enabledModules.map((config) => (
          <div 
            key={config.id} 
            className="w-full"
          >
              <ModuleRenderer
                config={config}
                enableDragDrop={enableDragDrop && isMounted}
              />
          </div>
        ))}
      </div>
    </div>
  );

  if (enableDragDrop && isMounted) {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        {content}
      </DragDropContext>
    );
  }

  return content;
}
