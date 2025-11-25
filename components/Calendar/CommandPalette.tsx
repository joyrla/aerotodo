'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { Command, Calendar, Plus, Settings, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commands = [
  { id: 'new-task', icon: Plus, label: 'New Task', action: 'new-task' },
  { id: 'today', icon: Calendar, label: 'Go to Today', action: 'go-today' },
  { id: 'day-view', icon: Calendar, label: 'Switch to Day View', action: 'view-day' },
  { id: 'week-view', icon: Calendar, label: 'Switch to Week View', action: 'view-week' },
  { id: 'month-view', icon: Calendar, label: 'Switch to Month View', action: 'view-month' },
  { id: 'focus-mode', icon: Zap, label: 'Enter Focus Mode', action: 'focus-mode' },
  { id: 'settings', icon: Settings, label: 'Open Settings', action: 'settings' },
  { id: 'search', icon: Search, label: 'Search Tasks', action: 'search' },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);
  const { setViewMode, goToToday, tasks } = useCalendar();
  const router = useRouter();

  const filteredCommands = search
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  // Filter tasks based on search
  const filteredTasks = search
    ? tasks.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  const allResults = [
    ...filteredCommands.map(cmd => ({ ...cmd, type: 'command' as const })),
    ...filteredTasks.map(task => ({
      id: task.id,
      icon: Calendar,
      label: task.title,
      action: `task-${task.id}`,
      type: 'task' as const
    }))
  ];

  useEffect(() => {
    setSelected(0);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelected(0);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => (s + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => (s - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const result = allResults[selected];
      if (result) {
        handleAction(result.action);
      }
    }
  };

  const handleAction = (action: string) => {
    if (action === 'new-task') {
      // Could trigger task creation
    } else if (action === 'go-today') {
      goToToday();
    } else if (action === 'view-day') {
      setViewMode('day');
    } else if (action === 'view-week') {
      setViewMode('week');
    } else if (action === 'view-month') {
      setViewMode('month');
    } else if (action === 'focus-mode') {
      // Trigger focus mode
    } else if (action === 'settings') {
      router.push('/settings');
    } else if (action === 'search') {
      // Trigger search
    } else if (action.startsWith('task-')) {
      // Open task detail
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-background border-border animate-scale-in" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-border">
          <Command className="w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 shadow-none font-mono"
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {allResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground font-mono">
              No results found
            </div>
          ) : (
            <div className="space-y-1">
              {allResults.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleAction(result.action)}
                    onMouseEnter={() => setSelected(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
                      'transition-colors font-mono text-sm',
                      selected === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{result.label}</span>
                    {result.type === 'task' && (
                      <span className="text-xs text-muted-foreground">Task</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

