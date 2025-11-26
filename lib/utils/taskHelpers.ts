import { Task, TaskColor } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const taskHelpers = {
  createTask: (
    title: string,
    color: TaskColor = 'default',
    date: string | null = null
  ): Task => {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      title,
      color,
      completed: false,
      date,
      createdAt: now,
      updatedAt: now,
    };
  },

  updateTask: (task: Task, updates: Partial<Task>): Task => ({
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
  }),

  sortTasksByCreation: (tasks: Task[]): Task[] => 
    [...tasks].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),

  sortTasksByCompletion: (tasks: Task[]): Task[] => 
    [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    }),

  filterTasksByDate: (tasks: Task[], date: string): Task[] => 
    tasks.filter(task => task.date === date),

  filterSomedayTasks: (tasks: Task[]): Task[] => 
    tasks.filter(task => task.date === null),

  filterCompletedTasks: (tasks: Task[]): Task[] => 
    tasks.filter(task => task.completed),

  filterActiveTasks: (tasks: Task[]): Task[] => 
    tasks.filter(task => !task.completed),

  searchTasks: (tasks: Task[], query: string): Task[] => {
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) ||
      task.notes?.toLowerCase().includes(lowerQuery)
    );
  },

  getColorClasses: (color: TaskColor): { bg: string; hover: string; border: string } => {
    const colorMap: Record<TaskColor, { bg: string; hover: string; border: string }> = {
      yellow: { bg: 'bg-yellow-100', hover: 'hover:bg-yellow-200', border: 'border-yellow-300' },
      green: { bg: 'bg-green-100', hover: 'hover:bg-green-200', border: 'border-green-300' },
      blue: { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', border: 'border-blue-300' },
      purple: { bg: 'bg-purple-100', hover: 'hover:bg-purple-200', border: 'border-purple-300' },
      pink: { bg: 'bg-pink-100', hover: 'hover:bg-pink-200', border: 'border-pink-300' },
      orange: { bg: 'bg-orange-100', hover: 'hover:bg-orange-200', border: 'border-orange-300' },
      red: { bg: 'bg-red-100', hover: 'hover:bg-red-200', border: 'border-red-300' },
      teal: { bg: 'bg-teal-100', hover: 'hover:bg-teal-200', border: 'border-teal-300' },
      gray: { bg: 'bg-gray-100', hover: 'hover:bg-gray-200', border: 'border-gray-300' },
      default: { bg: 'bg-white', hover: 'hover:bg-gray-50', border: 'border-gray-200' },
    };
    return colorMap[color];
  },

  getAllColors: (): TaskColor[] => 
    ['yellow', 'green', 'blue', 'purple', 'pink', 'orange', 'red', 'teal', 'gray', 'default'],
};
