'use client';

import { useState, useEffect } from 'react';
import { ModuleComponentProps, ModuleConfig } from '@/types/modules';
import { TaskList } from '../TaskList';
import { storage } from '@/lib/utils/storage';
import { Edit2, Check, Inbox } from 'lucide-react';

export function InboxModule({ tasks, enableDragDrop, config }: ModuleComponentProps & { config: ModuleConfig }) {
  const [inboxName, setInboxName] = useState('Inbox');
  const [isEditingInboxName, setIsEditingInboxName] = useState(false);
  const [editedInboxName, setEditedInboxName] = useState('Inbox');

  useEffect(() => {
    setInboxName(storage.getInboxName());
    setEditedInboxName(storage.getInboxName());
  }, []);

  const handleStartEditingInboxName = () => {
    setIsEditingInboxName(true);
    setEditedInboxName(inboxName);
  };

  const handleSaveInboxName = () => {
    const trimmedName = editedInboxName.trim();
    if (trimmedName) {
      setInboxName(trimmedName);
      storage.setInboxName(trimmedName);
    } else {
      setEditedInboxName(inboxName);
    }
    setIsEditingInboxName(false);
  };

  const handleCancelEditingInboxName = () => {
    setEditedInboxName(inboxName);
    setIsEditingInboxName(false);
  };

  const displayName = config.customName || inboxName;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between group">
        {isEditingInboxName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editedInboxName}
              onChange={(e) => setEditedInboxName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveInboxName();
                } else if (e.key === 'Escape') {
                  handleCancelEditingInboxName();
                }
              }}
              onBlur={handleSaveInboxName}
              className="flex-1 text-sm font-semibold font-mono text-foreground/80 bg-transparent border-b border-primary outline-none px-1"
              autoFocus
            />
            <button
              onClick={handleSaveInboxName}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-sm font-semibold font-mono text-foreground/80 flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            <span>{displayName}</span>
            {tasks.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                {tasks.length}
              </span>
            )}
            <button
              onClick={handleStartEditingInboxName}
              className="p-1 hover:bg-accent rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Rename inbox"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <TaskList
          date={null}
          tasks={tasks}
          droppableId="someday"
          enableDragDrop={enableDragDrop}
          showLinedBackground={false}
        />
      </div>
    </div>
  );
}

