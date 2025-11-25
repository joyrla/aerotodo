export type TaskColor = 
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'red'
  | 'teal'
  | 'gray'
  | 'default';

export type RepeatPattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

export interface Task {
  id: string;
  title: string;
  color: TaskColor;
  completed: boolean;
  date: string | null; // ISO date string or null for "Someday" (start date for multi-day tasks)
  endDate?: string | null; // Optional end date for multi-day tasks spanning multiple days
  notes?: string;
  subtasks?: SubTask[];
  projectId?: string | null; // Optional project assignment
  repeatPattern?: RepeatPattern;
  reminderDate?: string | null; // ISO date string for reminder
  googleCalendarEventId?: string | null; // Google Calendar event ID if synced
  timeSlot?: { start: string; end: string } | null; // Time blocking (HH:mm format)
  order?: number; // Position within the day for ordering
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: TaskColor;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarState {
  currentDate: Date;
  viewMode: ViewMode;
  selectedDate: Date | null;
}

export interface DayTasks {
  date: string; // ISO date string
  tasks: Task[];
}

export interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  days: DayTasks[];
  somedayTasks: Task[];
}

export interface MonthData {
  monthStart: Date;
  monthEnd: Date;
  weeks: WeekData[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  defaultView: ViewMode;
  language: string;
}

export interface Profile {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: TaskColor;
  createdAt: string;
}

export interface ReminderPreset {
  id: string;
  label: string;
  type: 'day-before' | 'morning' | 'today' | 'tomorrow' | 'relative';
  time: string; // HH:mm format
  offsetDays?: number; // For day-before and tomorrow
  offsetHours?: number; // For relative (e.g., "In 1 hour")
  enabled: boolean;
}

export interface ReminderSettings {
  presets: ReminderPreset[];
}

export interface TaskFilter {
  completed?: boolean;
  color?: TaskColor;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Context types
export interface CalendarContextType {
  state: CalendarState;
  tasks: Task[];
  projects: Project[];
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
}

export interface DragItem {
  taskId: string;
  sourceDate: string | null;
}

export interface DropResult {
  droppableId: string;
  index: number;
}
