'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

const shortcuts: ShortcutCategory[] = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['←', '→'], description: 'Navigate between dates' },
      { keys: ['1'], description: 'Switch to Day view' },
      { keys: ['2'], description: 'Switch to Week view' },
      { keys: ['3'], description: 'Switch to Month view' },
      { keys: ['T'], description: 'Go to Today' },
    ],
  },
  {
    category: 'Tasks',
    shortcuts: [
      { keys: ['N'], description: 'Quick add task' },
      { keys: ['Space'], description: 'Toggle task completion' },
      { keys: ['⌘', 'D'], description: 'Duplicate selected task' },
      { keys: ['⌘', 'Enter'], description: 'Open task details' },
      { keys: ['Delete'], description: 'Delete selected task' },
    ],
  },
  {
    category: 'Search & Command',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', 'F'], description: 'Search tasks' },
      { keys: ['⌘', '⇧', 'F'], description: 'Focus mode' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      { keys: ['Esc'], description: 'Close dialogs / Exit modes' },
      { keys: ['⌘', 'S'], description: 'Settings' },
      { keys: ['⌘', 'Z'], description: 'Undo (coming soon)' },
    ],
  },
];

function KeyBadge({ keyName }: { keyName: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center px-2 h-6 min-w-[1.5rem]',
        'text-xs font-mono font-semibold',
        'bg-muted border border-border rounded',
        'shadow-sm'
      )}
    >
      {keyName}
    </kbd>
  );
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border animate-slide-up" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="text-sm font-semibold font-mono text-muted-foreground uppercase tracking-wider">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 py-1"
                  >
                    <span className="text-sm font-mono text-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <KeyBadge keyName={key} />
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono text-center">
            Press <KeyBadge keyName="?" /> anytime to view this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

