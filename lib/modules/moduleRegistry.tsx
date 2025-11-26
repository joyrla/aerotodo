'use client';

import { ModuleDefinition, ModuleId } from '@/types/modules';
import { Task, GoogleCalendarSettings, Project } from '@/types';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { taskHelpers } from '@/lib/utils/taskHelpers';
import { 
  AlertCircle, 
  Inbox, 
  Calendar, 
  Activity,
  Flame,
  Timer,
  FolderKanban,
} from 'lucide-react';

// Helper to check if a task should be treated as an event (not a task)
// This excludes it from task-focused modules like Overdue
export function isGoogleCalendarEvent(task: Task): boolean {
  // If the task has a Google Calendar event ID, it came from GCal
  return !!task.googleCalendarEventId;
}

// Get the treatAsEvents setting from localStorage
function getGcalTreatAsEvents(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const settings = localStorage.getItem('gcal_settings');
    if (settings) {
      const parsed = JSON.parse(settings) as GoogleCalendarSettings;
      return parsed.treatAsEvents ?? true; // Default to true
    }
  } catch {
    // Ignore parse errors
  }
  return true; // Default to treating GCal imports as events
}

export const moduleRegistry: Record<ModuleId, ModuleDefinition> = {
  overdue: {
    id: 'overdue',
    name: 'Overdue',
    description: 'Tasks past their due date',
    defaultIcon: AlertCircle,
    defaultBorderColor: 'border-red-500/30',
    canRename: false,
    canDisable: false,
    filterTasks: (tasks: Task[], projects: Project[], config, currentProfileId) => {
      // Filter by profile if set
      const profileTasks = currentProfileId 
        ? tasks.filter(t => t.projectId === currentProfileId)
        : tasks;

      const todayStr = dateHelpers.toISOString(new Date());
      const treatAsEvents = getGcalTreatAsEvents();
      
      return profileTasks.filter(task => {
        if (!task.date || task.completed) return false;
        // Exclude Google Calendar events if treatAsEvents is enabled
        if (treatAsEvents && isGoogleCalendarEvent(task)) return false;
        return task.date < todayStr;
      });
    },
  },
  inbox: {
    id: 'inbox',
    name: 'Inbox',
    description: 'Unscheduled tasks',
    defaultIcon: Inbox,
    defaultBorderColor: 'border-border',
    canRename: true,
    canDisable: true,
    filterTasks: (tasks: Task[]) => {
      // Inbox ignores profile filter (Global Inbox)
      return taskHelpers.filterSomedayTasks(tasks);
    },
  },
  upcoming: {
    id: 'upcoming',
    name: 'Upcoming Next Week',
    description: 'Tasks from next week onwards',
    defaultIcon: Calendar,
    defaultBorderColor: 'border-blue-500/30',
    canRename: true,
    canDisable: true,
    filterTasks: (tasks: Task[], projects: Project[], config, currentProfileId) => {
      // Filter by profile if set
      const profileTasks = currentProfileId 
        ? tasks.filter(t => t.projectId === currentProfileId)
        : tasks;

      const today = new Date();
      const nextWeekDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const startOfNextWeek = dateHelpers.getWeekStart(nextWeekDate);
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(endOfNextWeek.getDate() + 7); // 7 days window
      
      return profileTasks.filter(task => {
        if (!task.date || task.completed) return false;
        const taskDate = dateHelpers.parseDate(task.date);
        return taskDate >= startOfNextWeek && taskDate < endOfNextWeek;
      });
    },
  },
  'recent-activity': {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Your latest task changes and completions',
    defaultIcon: Activity,
    defaultBorderColor: 'border-blue-500/30',
    canRename: true,
    canDisable: true,
    filterTasks: () => {
      return [];
    },
  },
  'habit-streak': {
    id: 'habit-streak',
    name: 'Habit Streak',
    description: 'Track your daily habits and streaks',
    defaultIcon: Flame,
    defaultBorderColor: 'border-orange-500/30',
    canRename: false,
    canDisable: true,
    comingSoon: true,
    filterTasks: () => [],
  },
  pomodoro: {
    id: 'pomodoro',
    name: 'Pomodoro Timer',
    description: 'Focus timer for productivity',
    defaultIcon: Timer,
    defaultBorderColor: 'border-red-500/30',
    canRename: false,
    canDisable: true,
    comingSoon: true,
    filterTasks: () => [],
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Organize tasks into projects',
    defaultIcon: FolderKanban,
    defaultBorderColor: 'border-purple-500/30',
    canRename: false,
    canDisable: true,
    comingSoon: true,
    filterTasks: () => [],
  },
};

export function getModuleDefinition(id: ModuleId): ModuleDefinition | undefined {
  return moduleRegistry[id];
}

export function getAllModuleDefinitions(): ModuleDefinition[] {
  return Object.values(moduleRegistry);
}
