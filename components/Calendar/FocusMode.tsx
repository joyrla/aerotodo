'use client';

import { useCalendar } from '@/lib/contexts/CalendarContext';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { Task } from './Task';
import { PomodoroTimer } from './PomodoroTimer';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
}

export function FocusMode({ open, onClose }: FocusModeProps) {
  const { filteredTasks: tasks } = useCalendar();
  
  // Get today's incomplete tasks
  const today = dateHelpers.toISOString(new Date());
  const todayTasks = tasks.filter(
    (task) => !task.completed && task.date === today
  );

  if (!open) return null;

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background',
        'animate-fade-in'
      )}
    >
      <div className="absolute top-4 right-4">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-10 w-10"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="max-w-2xl w-full px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono mb-2">Focus Mode</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} for today
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Pomodoro Timer */}
          <div className="flex-shrink-0">
            <PomodoroTimer />
          </div>

          {/* Today's Tasks */}
          <div className="flex-1 space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                No tasks for today. Great job! 🎉
              </div>
            ) : (
              todayTasks.map((task) => (
                <Task key={task.id} task={task} dragHandleProps={{}} />
              ))
            )}
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-muted-foreground font-mono">
          Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to exit focus mode
        </div>
      </div>
    </div>
  );
}

