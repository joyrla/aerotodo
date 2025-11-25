'use client';

import { ModuleComponentProps, ModuleConfig } from '@/types/modules';
import { Task as TaskComponent } from '../Task';
import { TaskList } from '../TaskList';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export function OverdueModule({ tasks, enableDragDrop, config }: ModuleComponentProps & { config: ModuleConfig }) {
  const emptyState = (
    <div className="py-6 px-1">
      <p className="text-xs font-mono text-muted-foreground/50">No overdue tasks</p>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold font-mono text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {config.customName || 'Overdue'}
          </div>
        </div>
        {emptyState}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold font-mono text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {config.customName || 'Overdue'}
          {tasks.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              {tasks.length}
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      {enableDragDrop ? (
        <Droppable droppableId="overdue">
          {(provided, snapshot) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto space-y-1"
            >
              <div className="space-y-1">
                {tasks.map((task, index) => {
                  const taskDate = task.date ? dateHelpers.parseDate(task.date) : null;
                  const daysOverdue = taskDate 
                    ? Math.floor((new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  
                  const badge = taskDate ? (
                    <div className="flex items-center gap-1.5 px-1.5 pointer-events-none flex-shrink-0">
                              <span className={cn(
                                "text-[10px] font-mono whitespace-nowrap",
                                daysOverdue > 7 
                                  ? "text-red-500 dark:text-red-400" 
                                  : daysOverdue > 3
                                  ? "text-orange-500 dark:text-orange-400"
                                  : "text-muted-foreground/70"
                              )}>
                                {dateHelpers.formatDateDisplay(taskDate)}
                                {task.timeSlot && (
                                  <span className="ml-1">
                                    {task.timeSlot.start}
                                  </span>
                                )}
                              </span>
                              {daysOverdue > 0 && (
                                <span className={cn(
                                  "text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap font-semibold flex-shrink-0",
                                  daysOverdue > 7 
                                    ? "bg-red-500/20 text-red-600 dark:text-red-400" 
                                    : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                                )}>
                                  {daysOverdue}d
                                </span>
                              )}
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
            {tasks.map((task) => {
              const taskDate = task.date ? dateHelpers.parseDate(task.date) : null;
              const daysOverdue = taskDate 
                ? Math.floor((new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              
              const badge = taskDate ? (
                <div className="flex items-center gap-1.5 px-1.5 pointer-events-none flex-shrink-0">
                      <span className={cn(
                        "text-[10px] font-mono whitespace-nowrap",
                        daysOverdue > 7 
                          ? "text-red-500 dark:text-red-400" 
                          : daysOverdue > 3
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-muted-foreground/70"
                      )}>
                        {dateHelpers.formatDateDisplay(taskDate)}
                        {task.timeSlot && (
                          <span className="ml-1">
                            {task.timeSlot.start}
                          </span>
                        )}
                      </span>
                      {daysOverdue > 0 && (
                        <span className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap font-semibold flex-shrink-0",
                          daysOverdue > 7 
                            ? "bg-red-500/20 text-red-600 dark:text-red-400" 
                            : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                        )}>
                          {daysOverdue}d
                        </span>
                      )}
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

