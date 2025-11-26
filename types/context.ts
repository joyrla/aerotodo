import { GoogleCalendarSyncResult, Task, Project, CalendarState, ViewMode, Profile, TimePreset, GoogleCalendarSettings } from './index';

export interface CalendarContextType {
  state: CalendarState;
  tasks: Task[];
  projects: Project[];
  filteredTasks: Task[];
  currentProfileId: string | null;
  setCurrentProfileId: (id: string | null) => void;
  isLoading: boolean;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newDate: string | null, destinationIndex?: number) => void;
  toggleTaskComplete: (id: string) => void;
  
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  
  goToToday: () => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  
  timePresets: TimePreset[];
  updateTimePresets: (presets: TimePreset[]) => Promise<void>;
}

