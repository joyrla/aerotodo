'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CalendarProvider, useCalendar } from '@/lib/contexts/CalendarContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { GuestWarningBanner } from '@/components/auth/GuestWarningBanner';
import { CalendarNav } from '@/components/Calendar/CalendarNav';
import { WeekView } from '@/components/Calendar/WeekView';
import { DayView } from '@/components/Calendar/DayView';
import { MonthView } from '@/components/Calendar/MonthView';
import { KeyboardShortcutsHelp } from '@/components/Calendar/KeyboardShortcutsHelp';
import { FocusMode } from '@/components/Calendar/FocusMode';
import { CommandPalette } from '@/components/Calendar/CommandPalette';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar, ArrowRight } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

function WelcomeDialog({ 
  open, 
  onOpenChange, 
  onStartNow, 
  onSignIn, 
  onTryWithoutSignup 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onStartNow: () => void;
  onSignIn: () => void;
  onTryWithoutSignup: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>Welcome to AeroTodo</DialogTitle>
        </VisuallyHidden>
        
        <div className="p-8 space-y-8">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">AeroTodo</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Your tasks, simplified.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A clean, fast, open-source planner.<br />
                No clutter. Just your tasks.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={onStartNow}
              className="w-full h-11 text-sm font-medium group"
            >
              Create free account
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <Button
              onClick={onSignIn}
              variant="outline"
              className="w-full h-11 text-sm font-medium"
            >
              Sign in
            </Button>
          </div>

          {/* Guest option */}
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={onTryWithoutSignup}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              or continue without an account →
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CalendarContent() {
  const { state, setViewMode, goToToday, goToPreviousWeek, goToNextWeek, goToPreviousMonth, goToNextMonth, goToPreviousDay, goToNextDay } = useCalendar();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [weekViewMode, setWeekViewMode] = useState<'list' | 'schedule'>('list');
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Check if user has seen welcome dialog
  useEffect(() => {
    if (authLoading) return;
    
    const seen = localStorage.getItem('aerotodo_seen_welcome');
    if (!user && !seen) {
      setShowWelcome(true);
    }
    setHasSeenWelcome(!!seen);
  }, [user, authLoading]);

  // Handle auth query params
  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'login' || auth === 'signup') {
      setAuthMode(auth);
      setShowAuthModal(true);
      setShowWelcome(false);
    }
  }, [searchParams]);

  const handleTryWithoutSignup = () => {
    localStorage.setItem('aerotodo_seen_welcome', 'true');
    setShowWelcome(false);
    setHasSeenWelcome(true);
  };

  const handleStartNow = () => {
    setShowWelcome(false);
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setShowWelcome(false);
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Define keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        cmd: true,
        description: 'Open command palette',
        category: 'Commands',
        action: () => setShowCommandPalette(true),
      },
      {
        key: 'ArrowLeft',
        description: 'Previous period',
        category: 'Navigation',
        action: () => {
          if (state.viewMode === 'week') goToPreviousWeek();
          else if (state.viewMode === 'month') goToPreviousMonth();
          else goToPreviousDay();
        },
      },
      {
        key: 'ArrowRight',
        description: 'Next period',
        category: 'Navigation',
        action: () => {
          if (state.viewMode === 'week') goToNextWeek();
          else if (state.viewMode === 'month') goToNextMonth();
          else goToNextDay();
        },
      },
      {
        key: '1',
        description: 'Day view',
        category: 'Navigation',
        action: () => setViewMode('day'),
      },
      {
        key: '2',
        description: 'Week view',
        category: 'Navigation',
        action: () => setViewMode('week'),
      },
      {
        key: '3',
        description: 'Month view',
        category: 'Navigation',
        action: () => setViewMode('month'),
      },
      {
        key: 't',
        description: 'Go to today',
        category: 'Navigation',
        action: () => goToToday(),
      },
      {
        key: '?',
        description: 'Show keyboard shortcuts',
        category: 'Help',
        action: () => setShowKeyboardHelp(true),
      },
      {
        key: 'f',
        cmd: true,
        shift: true,
        description: 'Focus mode',
        category: 'Views',
        action: () => setShowFocusMode(true),
      },
      {
        key: 'Escape',
        description: 'Close modals / Exit focus mode',
        category: 'General',
        action: () => {
          setShowFocusMode(false);
          setShowKeyboardHelp(false);
        },
      },
    ],
  });

  const handleSignUpFromBanner = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="h-full min-h-[100dvh] flex flex-col bg-background overflow-visible" suppressHydrationWarning>
      {/* Guest warning banner */}
      <GuestWarningBanner onSignUpClick={handleSignUpFromBanner} />
      
      <CalendarNav 
        onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
        weekViewMode={weekViewMode}
        onWeekViewModeChange={setWeekViewMode}
      />
      <div className={cn(
        "flex-1",
        state.viewMode === 'month' ? "overflow-hidden" : "overflow-y-auto overflow-x-visible scrollbar-hide"
      )} suppressHydrationWarning>
        <div className={cn(
          "max-w-[1800px] mx-auto overflow-visible",
          state.viewMode === 'month' ? "h-full px-2 py-2" : "px-3 py-4 sm:px-6 sm:py-6"
        )} suppressHydrationWarning>
          {state.viewMode === 'week' && <div className="animate-fade-in"><WeekView viewMode={weekViewMode} /></div>}
          {state.viewMode === 'day' && <div className="animate-fade-in"><DayView /></div>}
          {state.viewMode === 'month' && <div className="animate-fade-in"><MonthView /></div>}
        </div>
      </div>
      
      {/* Modals */}
      <KeyboardShortcutsHelp open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp} />
      <FocusMode open={showFocusMode} onClose={() => setShowFocusMode(false)} />
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} />
      
      {/* Welcome Dialog for first-time visitors */}
      <WelcomeDialog 
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onStartNow={handleStartNow}
        onSignIn={handleSignIn}
        onTryWithoutSignup={handleTryWithoutSignup}
      />
      
      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        defaultMode={authMode}
      />
    </div>
  );
}

function HomeContent() {
  return (
    <CalendarProvider>
      <CalendarContent />
    </CalendarProvider>
  );
}

export default function Home() {
  return (
    <main className="h-full min-h-[100dvh]">
      <Suspense fallback={<div className="h-full min-h-[100dvh] bg-background" />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
