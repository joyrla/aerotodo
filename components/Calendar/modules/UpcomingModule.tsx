'use client';

import { ModuleComponentProps, ModuleConfig } from '@/types/modules';
import { Task as TaskComponent } from '../Task';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { cn } from '@/lib/utils';
import { CalendarRange } from 'lucide-react';

export function UpcomingModule({ tasks, enableDragDrop, config }: ModuleComponentProps & { config: ModuleConfig }) {
  // Sort tasks by date for display (upcoming is always sorted by date, not manually orderable)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Empty state component
  const EmptyState = () => (
    <div className="py-6 px-1">
      <p className="text-xs font-mono text-muted-foreground/50">No upcoming tasks</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold font-mono text-foreground/80 flex items-center gap-2">
          <CalendarRange className="w-4 h-4" />
          {config.customName || 'Upcoming Next Week'}
          {tasks.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {tasks.length}
            </span>
          )}
        </div>
      </div>
      
      {/* Content - Droppable is disabled (isDropDisabled) but tasks can still be dragged OUT */}
      {sortedTasks.length === 0 ? (
        <EmptyState />
      ) : enableDragDrop ? (
        <Droppable droppableId="upcoming" isDropDisabled={true}>
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto space-y-1"
            >
              <div className="space-y-1">
                {sortedTasks.map((task, index) => {
                  const taskDate = task.date ? dateHelpers.parseDate(task.date) : null;
                  const today = new Date();
                  const isToday = taskDate && dateHelpers.isSameDay(taskDate, today);
                  const isTomorrow = taskDate && dateHelpers.isSameDay(taskDate, new Date(today.getTime() + 24 * 60 * 60 * 1000));
                  
                  const badge = taskDate ? (
                    <div className="flex items-center gap-1.5 px-1.5 pointer-events-none flex-shrink-0">
                      <span className={cn(
                        "text-[10px] font-mono whitespace-nowrap",
                        isToday 
                          ? "text-primary font-semibold" 
                          : isTomorrow
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground/70"
                      )}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateHelpers.formatDateDisplay(taskDate)}
                        {task.timeSlot && (
                          <span className="ml-1">
                            {task.timeSlot.start}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : null;

                  return (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={
                            snapshot.isDropAnimating
                              ? {
                                ...provided.draggableProps.style,
                                transitionDuration: '0.15s',
                                transitionTimingFunction: 'cubic-bezier(0.1, 1, 0.1, 1)'
                              }
                              : provided.draggableProps.style
                          }
                          className="w-full"
                        >
                          <TaskComponent
                            task={task}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={provided.dragHandleProps}
                            rightContent={badge}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="space-y-1">
            {sortedTasks.map((task) => {
              const taskDate = task.date ? dateHelpers.parseDate(task.date) : null;
              const today = new Date();
              const isToday = taskDate && dateHelpers.isSameDay(taskDate, today);
              const isTomorrow = taskDate && dateHelpers.isSameDay(taskDate, new Date(today.getTime() + 24 * 60 * 60 * 1000));
              
              const badge = taskDate ? (
                <div className="flex items-center gap-1.5 px-1.5 pointer-events-none flex-shrink-0">
                  <span className={cn(
                    "text-[10px] font-mono whitespace-nowrap",
                    isToday 
                      ? "text-primary font-semibold" 
                      : isTomorrow
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground/70"
                  )}>
                    {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateHelpers.formatDateDisplay(taskDate)}
                    {task.timeSlot && (
                      <span className="ml-1">
                        {task.timeSlot.start}
                      </span>
                    )}
                  </span>
                </div>
              ) : null;

              return (
                <div key={task.id} className="w-full">
                  <TaskComponent
                    task={task}
                    dragHandleProps={{}}
                    rightContent={badge}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

