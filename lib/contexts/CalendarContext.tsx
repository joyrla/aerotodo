'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Task, Project, CalendarState, ViewMode, CalendarContextType, TimePreset } from '@/types';
import { storage, profileStorage } from '@/lib/utils/storage';
import { taskHelpers } from '@/lib/utils/taskHelpers';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { addActivity } from '@/components/Calendar/modules/RecentActivityModule';

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const DEFAULT_TIME_PRESETS: TimePreset[] = [
  { id: '15m', label: '15m', minutes: 15 },
  { id: '30m', label: '30m', minutes: 30 },
  { id: '1h', label: '1h', minutes: 60 },
  { id: '2h', label: '2h', minutes: 120 },
];

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [viewMode, setViewModeState] = useState<ViewMode>('week');
  const [currentDateStr, setCurrentDateStrState] = useState<string>(new Date().toISOString());
  const [timePresets, setTimePresets] = useState<TimePreset[]>(DEFAULT_TIME_PRESETS);
  const [currentProfileId, setCurrentProfileIdState] = useState<string | null>(null);
  const trashTimeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const [state, setState] = useState<CalendarState>({
    currentDate: new Date(),
    viewMode: 'week',
    selectedDate: null,
  });

  // Load current profile from storage
  useEffect(() => {
    const isViewAll = localStorage.getItem('viewAllProfiles') === 'true';
    if (isViewAll) {
      setCurrentProfileIdState(null);
    } else {
      const storedProfileId = profileStorage.getCurrentProfile();
      setCurrentProfileIdState(storedProfileId);
    }
  }, []);

  // Filter tasks by current profile
  const filteredTasks = useMemo(() => {
    // If viewing all profiles, return all tasks
    if (currentProfileId === null) {
      return tasks;
    }
    
    // Filter tasks by profile
    // Strict filtering: Only show tasks explicitly assigned to this profile
    // Tasks with no profile only show in "View All"
    return tasks.filter(task => task.projectId === currentProfileId);
  }, [tasks, currentProfileId]);

  // Set current profile and persist
  const setCurrentProfileId = (id: string | null) => {
    setCurrentProfileIdState(id);
    if (id === null) {
      localStorage.setItem('viewAllProfiles', 'true');
    } else {
      localStorage.setItem('viewAllProfiles', 'false');
      profileStorage.setCurrentProfile(id);
    }
  };

  // Helper to map task to DB format
  const mapTaskToDB = (task: Task, userId: string) => ({
    id: task.id,
    user_id: userId,
    title: task.title,
    color: task.color,
    completed: task.completed,
    date: task.date,
    end_date: task.endDate,
    notes: task.notes || null,
    subtasks: task.subtasks || [],
    project_id: task.projectId || null,
    repeat_pattern: task.repeatPattern || null,
    reminder_date: task.reminderDate || null,
    google_calendar_event_id: task.googleCalendarEventId || null,
    time_slot: task.timeSlot || null,
    order: task.order ?? 0,
    created_at: task.createdAt,
    updated_at: new Date().toISOString(),
  });

  // Helper to map DB task to app format
  const mapTaskFromDB = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    color: dbTask.color as any,
    completed: dbTask.completed,
    date: dbTask.date,
    endDate: dbTask.end_date,
    notes: dbTask.notes || undefined,
    subtasks: dbTask.subtasks || [],
    projectId: dbTask.project_id,
    repeatPattern: dbTask.repeat_pattern,
    reminderDate: dbTask.reminder_date,
    googleCalendarEventId: dbTask.google_calendar_event_id,
    timeSlot: dbTask.time_slot,
    order: dbTask.order ?? 0,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  });

  // Helper to map project to DB format
  const mapProjectToDB = (project: Project, userId: string) => ({
    id: project.id,
    user_id: userId,
    name: project.name,
    color: project.color,
    created_at: project.createdAt,
  });

  // Helper to map DB project to app format
  const mapProjectFromDB = (dbProject: any): Project => ({
    id: dbProject.id,
    name: dbProject.name,
    color: dbProject.color as any,
    createdAt: dbProject.created_at,
  });

  // Load data from localStorage or Supabase
  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      // Always load view settings from local storage
    const storedViewMode = storage.get<ViewMode>('aerotodo_view_mode', 'week');
    const storedDateStr = storage.get<string>('aerotodo_current_date', new Date().toISOString());
    const storedPresets = storage.get<TimePreset[]>('aerotodo_time_presets', DEFAULT_TIME_PRESETS);
    
    setViewModeState(storedViewMode);
    setCurrentDateStrState(storedDateStr);
    setTimePresets(storedPresets);
    
      setState(prev => ({
        ...prev,
      currentDate: new Date(storedDateStr),
      viewMode: storedViewMode,
      }));

      if (user && supabase) {
        // Load from Supabase
        try {
          const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
          const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
          const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('preferences')
            .eq('user_id', user.id)
            .single();

          if (tasksError) throw tasksError;
          if (projectsError) throw projectsError;

          if (tasksData) {
            setTasksState(tasksData.map(mapTaskFromDB));
          }
          if (projectsData) {
            setProjectsState(projectsData.map(mapProjectFromDB));
          }
          if (settingsData?.preferences?.timePresets) {
            setTimePresets(settingsData.preferences.timePresets);
            // Sync to local
            storage.set('aerotodo_time_presets', settingsData.preferences.timePresets);
          }
        } catch (error: any) {
          console.error('Error loading data from Supabase:', error.message || error);
          toast.error(`Failed to sync data: ${error.message || 'Unknown error'}`);
        }
      } else {
        // Load from localStorage (Guest mode)
        const storedTasks = storage.get<Task[]>('aerotodo_tasks', []);
        const storedProjects = storage.get<Project[]>('aerotodo_projects', []);
        
        setTasksState(storedTasks);
        setProjectsState(storedProjects);
      }
    };

    loadData();
  }, [user, authLoading]);

  // Sync state when values change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentDate: new Date(currentDateStr),
      viewMode,
    }));
  }, [currentDateStr, viewMode]);

  // Ensure each profile has a corresponding project entry (required for FK constraints)
  useEffect(() => {
    const profiles = profileStorage.getProfiles();
    if (!profiles.length) return;

    const missingProfiles = profiles.filter(profile =>
      !projects.find(project => project.id === profile.id)
    );

    if (!missingProfiles.length) return;

    const newProjects = missingProfiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      color: profile.color,
      createdAt: new Date().toISOString(),
    }));

    setProjectsState(prev => {
      const updated = [...prev, ...newProjects];
      if (!user) {
        storage.set('aerotodo_projects', updated);
      }
      return updated;
    });

    if (user && supabase) {
      supabase
        .from('projects')
        .insert(newProjects.map(project => mapProjectToDB(project, user.id)))
        .then(({ error }) => {
          if (error) {
            console.error('Error creating profile-backed project:', error);
          }
        });
    }
  }, [projects, user]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      trashTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      trashTimeoutsRef.current.clear();
    };
  }, []);

  // Helper to set tasks and persist
  const setTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksState(prev => {
      const newTasks = typeof updater === 'function' ? updater(prev) : updater;
      // Always save to localStorage as backup/cache
      storage.set('aerotodo_tasks', newTasks);
      return newTasks;
    });
  };

  // Helper to set projects and persist
  const setProjects = (updater: Project[] | ((prev: Project[]) => Project[])) => {
    setProjectsState(prev => {
      const newProjects = typeof updater === 'function' ? updater(prev) : updater;
      storage.set('aerotodo_projects', newProjects);
      return newProjects;
    });
  };

  // Helper to set viewMode and persist to localStorage
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    storage.set('aerotodo_view_mode', mode);
  };

  // Helper to set currentDateStr and persist to localStorage
  const setCurrentDateStr = (dateStr: string) => {
    setCurrentDateStrState(dateStr);
    storage.set('aerotodo_current_date', dateStr);
  };

  // Task operations
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask = taskHelpers.createTask(taskData.title, taskData.color, taskData.date);
    
    // Calculate order for the new task (add to end of the day's tasks)
    const tasksInSameDay = tasks.filter(t => t.date === taskData.date);
    const maxOrder = tasksInSameDay.length > 0 
      ? Math.max(...tasksInSameDay.map(t => t.order ?? 0)) 
      : -1;
    const newOrder = maxOrder + 1;
    
    const updatedTask = { ...newTask, ...taskData, order: taskData.order ?? newOrder };
    
    // Optimistic update
    setTasks(prev => [...prev, updatedTask]);

    // Track activity
    addActivity('added', updatedTask.title, updatedTask);

    // Supabase update
    if (user && supabase) {
      const taskData = mapTaskToDB(updatedTask, user.id);
      supabase.from('tasks').insert(taskData).then(({ error }) => {
        if (error?.code === 'PGRST204' || error?.message?.includes('order')) {
          // Order column doesn't exist, try without it
          const { order, ...taskDataWithoutOrder } = taskData;
          supabase.from('tasks').insert(taskDataWithoutOrder).then(({ error: retryError }) => {
            if (retryError) {
              console.error('Error adding task:', retryError.message);
              toast.error('Failed to save task');
            }
          });
        } else if (error) {
          console.error('Error adding task:', error.message || error);
          toast.error('Failed to save task');
        }
      });
    }

    return updatedTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const updated = taskHelpers.updateTask(task, updates);
          
          // Supabase update
          if (user) {
            const taskData = mapTaskToDB(updated, user.id);
            supabase.from('tasks').update(taskData).eq('id', id).then(({ error }) => {
              if (error?.code === 'PGRST204' || error?.message?.includes('order')) {
                // Order column doesn't exist, try without it
                const { order, ...taskDataWithoutOrder } = taskData;
                supabase.from('tasks').update(taskDataWithoutOrder).eq('id', id);
              } else if (error) {
                console.error('Error updating task:', error.message);
              }
            });
          }
          
          return updated;
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    // Cancel any pending trash timeout for this task
    const timeoutId = trashTimeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      trashTimeoutsRef.current.delete(id);
    }
    
    // Optimistic update
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        addActivity('deleted', task.title, task);
      }
      return prev.filter(t => t.id !== id);
    });

    // Supabase update
    if (user) {
      supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting task:', error);
      });
    }
  };

  const moveTask = (taskId: string, newDate: string | null, destinationIndex?: number) => {
    setTasks(prev => {
      const taskToMove = prev.find(t => t.id === taskId);
      if (!taskToMove) {
        return prev;
      }

      const oldDate = taskToMove.date;
      const isSameDay = oldDate === newDate;
      
      // Get tasks in the destination date (excluding the task being moved)
      // Sort by order first, then by creation date for tasks without order
      const tasksInDestination = prev
        .filter(t => t.id !== taskId && t.date === newDate)
        .sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      // Normalize all orders in destination to be sequential (0, 1, 2, ...)
      // This ensures consistent ordering
      const normalizedTasks = tasksInDestination.map((t, idx) => ({
        ...t,
        order: idx
      }));

      // Calculate new order based on destination index
      let newOrder: number;
      const destIdx = destinationIndex ?? normalizedTasks.length;
      
      if (normalizedTasks.length === 0) {
        newOrder = 0;
      } else if (destIdx <= 0) {
        // Insert at beginning - use negative to ensure it comes first
        const firstOrder = normalizedTasks[0]?.order ?? 0;
        newOrder = firstOrder - 1;
      } else if (destIdx >= normalizedTasks.length) {
        // Insert at end
        const lastOrder = normalizedTasks[normalizedTasks.length - 1]?.order ?? 0;
        newOrder = lastOrder + 1;
      } else {
        // Insert between - use fractional order
        const prevOrder = normalizedTasks[destIdx - 1]?.order ?? (destIdx - 1);
        const nextOrder = normalizedTasks[destIdx]?.order ?? destIdx;
        newOrder = (prevOrder + nextOrder) / 2;
      }

      // Update the moved task
      const updatedTask = taskHelpers.updateTask(taskToMove, { 
        date: newDate, 
        order: newOrder 
      });

      // Track activity only if date changed
      if (!isSameDay) {
        addActivity('updated', taskToMove.title, updatedTask);
      }

      // Build new tasks array with normalized orders for destination
      const newTasks = prev.map(t => {
        if (t.id === taskId) {
          return updatedTask;
        }
        // Update orders for other tasks in the destination to be normalized
        const normalizedTask = normalizedTasks.find(nt => nt.id === t.id);
        if (normalizedTask && t.order !== normalizedTask.order) {
          return { ...t, order: normalizedTask.order };
        }
        return t;
      });

      // Supabase update for the moved task
      if (user) {
        // Try updating with order, fall back to without if column doesn't exist
        supabase.from('tasks').update({
          date: newDate,
          order: newOrder,
          updated_at: new Date().toISOString()
        }).eq('id', taskId).then(({ error }) => {
          if (error?.code === 'PGRST204') {
            // Order column doesn't exist, update without it
            supabase.from('tasks').update({
              date: newDate,
              updated_at: new Date().toISOString()
            }).eq('id', taskId);
          } else if (error) {
            console.error('Error moving task:', error.message);
          }
        });

        // Also update normalized orders for other tasks in destination (skip if order column missing)
        normalizedTasks.forEach(t => {
          const original = prev.find(p => p.id === t.id);
          if (original && original.order !== t.order) {
            supabase.from('tasks').update({
              order: t.order,
              updated_at: new Date().toISOString()
            }).eq('id', t.id).then(({ error }) => {
              // Silently ignore PGRST204 (order column doesn't exist)
              if (error && error.code !== 'PGRST204') {
                console.error('Error updating task order:', error.message);
              }
            });
          }
        });
      }

      // Save to localStorage for guests
      if (!user) {
        storage.saveTasks(newTasks);
      }

      return newTasks;
    });
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(prev => {
      const updatedTasks = prev.map(task => {
        if (task.id === id) {
          const newCompleted = !task.completed;
          const updatedTask = taskHelpers.updateTask(task, { completed: newCompleted });
          
          // Track activity only when completing (not uncompleting)
          if (newCompleted) {
            addActivity('completed', task.title, task);
          }
          
          // Supabase update for completion status
          if (user) {
            supabase.from('tasks').update({ 
              completed: newCompleted,
              updated_at: new Date().toISOString()
            }).eq('id', id).then(({ error }) => {
              if (error) console.error('Error updating task completion:', error);
            });
          }
          
          // Handle auto-trash
          const autoTrashEnabled = storage.get<boolean>('aerotodo_auto_trash_completed', false);
          
          if (newCompleted && autoTrashEnabled) {
            // Task was just completed - set timeout to delete after 3 seconds
            const timeoutId = setTimeout(() => {
              setTasks(currentTasks => {
                // Double-check the task is still completed before deleting
                const taskToDelete = currentTasks.find(t => t.id === id);
                if (taskToDelete && taskToDelete.completed) {
                  trashTimeoutsRef.current.delete(id);
                  
                  // Perform delete
                  if (user) {
                    supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
                      if (error) console.error('Error auto-deleting task:', error);
                    });
                  }
                  
                  return currentTasks.filter(t => t.id !== id);
                }
                trashTimeoutsRef.current.delete(id);
                return currentTasks;
              });
            }, 3000);
            trashTimeoutsRef.current.set(id, timeoutId);
          } else if (!newCompleted) {
            // Task was uncompleted - cancel any pending trash timeout
            const timeoutId = trashTimeoutsRef.current.get(id);
            if (timeoutId) {
              clearTimeout(timeoutId);
              trashTimeoutsRef.current.delete(id);
            }
          }
          
          return updatedTask;
        }
        return task;
      });
      return updatedTasks;
    });
  };

  // Project operations
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...projectData,
      createdAt: new Date().toISOString(),
    };
    
    setProjects(prev => [...prev, newProject]);

    if (user) {
      supabase.from('projects').insert(mapProjectToDB(newProject, user.id)).then(({ error }) => {
        if (error) {
          console.error('Error adding project:', error);
          toast.error('Failed to save project');
        }
      });
    }
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(project => {
        if (project.id === id) {
          const updated = { ...project, ...updates };
          
          if (user) {
            supabase.from('projects').update(mapProjectToDB(updated, user.id)).eq('id', id).then(({ error }) => {
              if (error) console.error('Error updating project:', error);
            });
          }
          
          return updated;
        }
        return project;
      })
    );
  };

  const deleteProject = (id: string) => {
    // Remove project and unassign all tasks from this project
    setProjects(prev => prev.filter(project => project.id !== id));
    setTasks(prev =>
      prev.map(task =>
        task.projectId === id ? { ...task, projectId: null } : task
      )
    );

    if (user) {
      supabase.from('projects').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting project:', error);
      });
      // The task projectId unassignment is handled by DB foreign key 'on delete set null' or needs manual update?
      // In SQL: project_id text references public.projects(id) on delete set null
      // So DB handles the tasks update. But I also need to update local state (which I did above).
    }
  };

  // Date navigation
  const setCurrentDate = (date: Date) => {
    setCurrentDateStr(date.toISOString());
  };

  const updateTimePresets = async (newPresets: TimePreset[]) => {
    setTimePresets(newPresets);
    storage.set('aerotodo_time_presets', newPresets);

    if (user) {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('preferences')
          .eq('user_id', user.id)
          .single();
        
        const currentPrefs = data?.preferences || {};
        
        const { error } = await supabase
          .from('user_settings')
          .update({
            preferences: {
              ...currentPrefs,
              timePresets: newPresets
            },
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating time presets:', error);
        toast.error('Failed to save time presets');
      }
    }
  };

  const goToToday = () => {
    setCurrentDateStr(new Date().toISOString());
  };

  const goToPreviousWeek = () => {
    const newDate = dateHelpers.goToPreviousWeek(state.currentDate);
    setCurrentDateStr(newDate.toISOString());
  };

  const goToNextWeek = () => {
    const newDate = dateHelpers.goToNextWeek(state.currentDate);
    setCurrentDateStr(newDate.toISOString());
  };

  const goToPreviousMonth = () => {
    const newDate = dateHelpers.goToPreviousMonth(state.currentDate);
    setCurrentDateStr(newDate.toISOString());
  };

  const goToNextMonth = () => {
    const newDate = dateHelpers.goToNextMonth(state.currentDate);
    setCurrentDateStr(newDate.toISOString());
  };

  const goToPreviousDay = () => {
    const newDate = dateHelpers.goToPreviousDay(state.currentDate);
    setCurrentDateStr(newDate.toISOString());
  };

  const goToNextDay = () => {
    const newDate = dateHelpers.goToNextDay(state.currentDate);
    setCurrentDateStr(newDate.toISOString());
  };

  const value: CalendarContextType = {
    state,
    tasks,
    projects,
    filteredTasks,
    currentProfileId,
    setCurrentProfileId,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleTaskComplete,
    addProject,
    updateProject,
    deleteProject,
    setViewMode,
    setCurrentDate,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousDay,
    goToNextDay,
    timePresets,
    updateTimePresets,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
