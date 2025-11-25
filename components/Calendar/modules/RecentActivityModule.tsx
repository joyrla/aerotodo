'use client';

import { useState, useEffect } from 'react';
import { ModuleComponentProps } from '@/types/modules';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { CheckCircle2, Plus, Trash2, Edit3, RotateCcw, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'completed' | 'added' | 'deleted' | 'updated';
  taskTitle: string;
  timestamp: Date;
  data?: any;
}

export function RecentActivityModule({ config }: ModuleComponentProps) {
  const { addTask, deleteTask, toggleTaskComplete } = useCalendar();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Load activities
  useEffect(() => {
    const loadActivities = () => {
      const stored = localStorage.getItem('aerotodo_recent_activities');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setActivities(parsed.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          })));
        } catch (e) {
          console.error('Failed to parse activities:', e);
        }
      }
    };

    loadActivities();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aerotodo_recent_activities') {
        loadActivities();
      }
    };

    // Custom event for same-tab updates
    const handleCustomEvent = () => loadActivities();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aerotodo-activity-update', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aerotodo-activity-update', handleCustomEvent);
    };
  }, []);

  const handleUndo = (activity: ActivityItem) => {
    if (!activity.data) return;

    // Perform the undo action
    switch (activity.type) {
      case 'completed':
        // Undo completion -> toggle back (assuming task exists)
        toggleTaskComplete(activity.data.id);
        break;
      case 'deleted':
        // Undo delete -> add task back
        // We strip the ID to let addTask generate a new one, ensuring no collisions
        // unless we implement a specific restoreTask method
        const { id, ...taskData } = activity.data;
        addTask(taskData);
        break;
      case 'added':
        // Undo add -> delete task
        deleteTask(activity.data.id);
        break;
    }

    // Remove the activity from the list
    const newActivities = activities.filter(a => a.id !== activity.id);
    setActivities(newActivities);
    localStorage.setItem('aerotodo_recent_activities', JSON.stringify(newActivities));
    window.dispatchEvent(new Event('aerotodo-activity-update'));
  };

  const handleDeleteActivity = (activityId: string) => {
    const newActivities = activities.filter(a => a.id !== activityId);
    setActivities(newActivities);
    localStorage.setItem('aerotodo_recent_activities', JSON.stringify(newActivities));
    window.dispatchEvent(new Event('aerotodo-activity-update'));
  };

  const handleClearAll = () => {
    setActivities([]);
    localStorage.removeItem('aerotodo_recent_activities');
    window.dispatchEvent(new Event('aerotodo-activity-update'));
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed': return CheckCircle2;
      case 'added': return Plus;
      case 'deleted': return Trash2;
      case 'updated': return Edit3;
      default: return Activity;
    }
  };

  const getActionDescription = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed': return 'completed a task';
      case 'added': return 'added a task';
      case 'deleted': return 'deleted a task';
      case 'updated': return 'updated a task';
      default: return 'modified a task';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[300px]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold font-mono text-foreground/80 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {config?.customName || 'Activity'}
        </div>
        {activities.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider"
          >
            Clear All
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="py-6 px-1">
          <p className="text-xs font-mono text-muted-foreground/50">No recent activity</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-subtle">
          {activities.slice(0, 50).map((activity) => {
            const Icon = getActivityIcon(activity.type);
            
            return (
              <div
                key={activity.id}
                className={cn(
                  "group relative flex items-center gap-3 p-2.5 rounded-lg",
                  "bg-card/50 backdrop-blur-sm",
                  "transition-all duration-200 ease-out",
                  "hover:bg-accent/40 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-background/50 shadow-sm",
                  activity.type === 'completed' && "text-green-500",
                  activity.type === 'deleted' && "text-red-500",
                  activity.type === 'added' && "text-blue-500",
                  activity.type === 'updated' && "text-orange-500"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <span className={cn(
                    "text-xs font-medium truncate",
                    activity.type === 'deleted' && "line-through opacity-70"
                  )}>
                    {activity.taskTitle}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {getActionDescription(activity.type)} {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>

                <div className={cn(
                  "flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2",
                  "transition-all duration-[250ms] ease-out",
                  "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                  "bg-background rounded-md shadow-sm py-0.5 px-1"
                )}>
                  {/* Undo Button */}
                  {activity.data && (activity.type !== 'updated') && (
                    <button
                      onClick={() => handleUndo(activity)}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded transition-all duration-200",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-accent hover:scale-110"
                      )}
                      title="Undo action"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Activity Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteActivity(activity.id);
                    }}
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded transition-all duration-200",
                      "text-muted-foreground hover:text-destructive",
                      "hover:bg-destructive/10 hover:scale-110"
                    )}
                    title="Remove from history"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function addActivity(type: ActivityItem['type'], taskTitle: string, data?: any) {
  try {
    const stored = localStorage.getItem('aerotodo_recent_activities');
    const activities: ActivityItem[] = stored ? JSON.parse(stored) : [];
    
    const newActivity: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      taskTitle,
      timestamp: new Date(),
      data,
    };

    // Add to beginning and keep only last 50
    const updated = [newActivity, ...activities].slice(0, 50);
    localStorage.setItem('aerotodo_recent_activities', JSON.stringify(updated));
    
    // Trigger custom event for same-tab updates (async to avoid render-phase updates)
    setTimeout(() => {
      window.dispatchEvent(new Event('aerotodo-activity-update'));
    }, 0);
  } catch (e) {
    console.error('Failed to add activity:', e);
  }
}
