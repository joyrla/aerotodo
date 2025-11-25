'use client';

import { ReactNode } from 'react';
import { Task } from '@/types';
import { TaskList } from '../TaskList';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface BaseModuleProps {
  title: string;
  titleIcon?: LucideIcon;
  tasks: Task[];
  droppableId: string;
  enableDragDrop?: boolean;
  borderColor?: string;
  showLinedBackground?: boolean;
  taskCount?: number;
  headerActions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function BaseModule({
  title,
  titleIcon: TitleIcon,
  tasks,
  droppableId,
  enableDragDrop = false,
  borderColor = 'border-border',
  showLinedBackground = false,
  taskCount,
  headerActions,
  children,
  className,
}: BaseModuleProps) {
  const displayCount = taskCount !== undefined ? taskCount : tasks.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold font-mono text-foreground/80 flex items-center gap-2">
          {TitleIcon && <TitleIcon className="w-4 h-4" />}
          <span>{title}</span>
          {displayCount > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {displayCount}
            </span>
          )}
        </div>
        {headerActions}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {children || (
          <TaskList
            date={null}
            tasks={tasks}
            droppableId={droppableId}
            enableDragDrop={enableDragDrop}
            showLinedBackground={false}
          />
        )}
      </div>
    </div>
  );
}

