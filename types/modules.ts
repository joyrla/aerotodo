import { Task, Project } from './index';
import { LucideIcon } from 'lucide-react';

export type ModuleId = 
  | 'overdue'
  | 'inbox'
  | 'upcoming'
  | 'recent-activity'
  | 'habit-streak'
  | 'pomodoro'
  | 'projects';

export interface ModuleConfig {
  id: ModuleId;
  enabled: boolean;
  order: number;
  customName?: string;
  customIcon?: string;
  borderColor?: string;
  // Module-specific config
  config?: Record<string, any>;
}

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  defaultIcon: LucideIcon;
  defaultBorderColor?: string;
  canRename?: boolean;
  canDisable?: boolean;
  comingSoon?: boolean;
  filterTasks: (tasks: Task[], projects: Project[], config?: Record<string, any>) => Task[];
  getTaskCount?: (tasks: Task[], projects: Project[], config?: Record<string, any>) => number;
}

export interface ModuleComponentProps {
  tasks: Task[];
  projects: Project[];
  enableDragDrop?: boolean;
  config?: Record<string, any>;
  onConfigChange?: (config: Record<string, any>) => void;
}

