'use client';

import { useEffect, useRef } from 'react';
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar';
import { useCalendar } from '@/lib/contexts/CalendarContext';

export function GoogleCalendarSync() {
  const { startAutoSync, stopAutoSync, isConnected } = useGoogleCalendar();
  const { tasks, addTask, updateTask, isLoading } = useCalendar();
  
  // Keep latest tasks in a ref so the sync loop can access them
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    // Only start sync if we are connected AND local data is fully loaded
    if (isConnected && !isLoading) {
      startAutoSync(
        () => tasksRef.current,
        (taskId, updates) => updateTask(taskId, updates),
        (taskData) => addTask(taskData)
      );
    }

    return () => {
      stopAutoSync();
    };
  }, [isConnected, isLoading, startAutoSync, stopAutoSync, updateTask, addTask]);

  return null;
}

