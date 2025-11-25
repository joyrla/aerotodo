'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  compact?: boolean;
}

export function PomodoroTimer({ compact = false }: PomodoroTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [seconds, setSeconds] = useState(25 * 60); // 25 minutes
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  
  const WORK_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setSeconds((seconds) => {
          if (seconds > 0) {
            return seconds - 1;
          } else {
            // Timer finished
            if (!isBreak) {
              setSessions((s) => s + 1);
            }
            setIsActive(false);
            setIsPaused(true);
            // Show browser notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(isBreak ? 'Break time over!' : 'Focus session complete!', {
                  body: isBreak ? 'Time to get back to work' : 'Time for a break',
                  icon: '/favicon.ico',
                });
              } catch {
                // Notification not supported
              }
            }
            // Auto-switch to break or work
            setIsBreak(!isBreak);
            return isBreak ? WORK_TIME : BREAK_TIME;
          }
        });
      }, 1000);
    } else if (!isActive && seconds === 0) {
      // Reset when timer ends
      setSeconds(isBreak ? BREAK_TIME : WORK_TIME);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, seconds, isBreak, WORK_TIME, BREAK_TIME]);

  const toggleTimer = () => {
    if (isActive) {
      setIsPaused(!isPaused);
    } else {
      setIsActive(true);
      setIsPaused(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(true);
    setSeconds(isBreak ? BREAK_TIME : WORK_TIME);
  };

  const switchMode = () => {
    setIsActive(false);
    setIsPaused(true);
    setIsBreak(!isBreak);
    setSeconds(!isBreak ? BREAK_TIME : WORK_TIME);
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const progress = ((isBreak ? BREAK_TIME : WORK_TIME) - seconds) / (isBreak ? BREAK_TIME : WORK_TIME) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-lg font-mono font-bold">
          {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
        </div>
        <Button onClick={toggleTimer} size="sm" variant="outline" className="h-7 w-7 p-0">
          {isActive && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
        <span className={cn(!isBreak && 'text-primary font-semibold')}>Work</span>
        <span>/</span>
        <span className={cn(isBreak && 'text-primary font-semibold')}>Break</span>
      </div>

      {/* Circular Progress */}
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            className={cn(
              'transition-all duration-1000',
              isBreak ? 'text-green-500' : 'text-primary'
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-mono font-bold">
            {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-2">
            {isBreak ? 'Break Time' : 'Focus Time'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button onClick={toggleTimer} size="lg" className="w-24">
          {isActive && !isPaused ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </Button>
        <Button onClick={resetTimer} size="lg" variant="outline">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button onClick={switchMode} size="lg" variant="outline">
          <Coffee className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-sm font-mono text-muted-foreground">
        Sessions: {sessions}
      </div>
    </div>
  );
}

