'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { dateHelpers } from '@/lib/utils/dateHelpers';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Settings, Check, ChevronDown, Keyboard, List, Clock, LogOut, Menu, Calendar as CalendarIcon, X, Sun, LayoutGrid } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewMode, TaskColor } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { profileStorage } from '@/lib/utils/storage';
import type { Profile } from '@/types';

interface CalendarNavProps {
  onShowKeyboardHelp?: () => void;
  weekViewMode?: 'list' | 'schedule';
  onWeekViewModeChange?: (mode: 'list' | 'schedule') => void;
}

const getProfileColorClasses = (color: TaskColor) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-500',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-purple-500',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30 hover:text-green-500',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/30 hover:text-orange-500',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500',
    pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/30 hover:text-pink-500',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30 hover:text-yellow-500',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/30 hover:text-teal-500',
    gray: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20 hover:border-gray-500/30 hover:text-gray-500',
    default: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  };
  return colorMap[color] || colorMap.default;
};

const getProfileDotColor = (color: TaskColor) => {
  const colorMap = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    yellow: 'bg-yellow-500',
    teal: 'bg-teal-500',
    gray: 'bg-gray-500',
    default: 'bg-muted-foreground',
  };
  return colorMap[color] || colorMap.default;
};

export function CalendarNav({ onShowKeyboardHelp, weekViewMode = 'list', onWeekViewModeChange }: CalendarNavProps = {}) {
  const {
    state,
    setViewMode,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousDay,
    goToNextDay,
  } = useCalendar();

  const { user, signOut } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');
  const [isViewAll, setIsViewAll] = useState<boolean>(false);

  useEffect(() => {
    setProfiles(profileStorage.getProfiles());
    const storedProfileId = profileStorage.getCurrentProfile();
    const storedViewAll = localStorage.getItem('viewAllProfiles') === 'true';
    setCurrentProfileId(storedProfileId);
    setIsViewAll(storedViewAll);
  }, []);

  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0];

  const handleProfileSwitch = (profileId: string) => {
    if (profileId === 'view-all') {
      localStorage.setItem('viewAllProfiles', 'true');
      setIsViewAll(true);
      window.location.reload();
    } else {
      localStorage.setItem('viewAllProfiles', 'false');
      profileStorage.setCurrentProfile(profileId);
      setCurrentProfileId(profileId);
      setIsViewAll(false);
      window.location.reload();
    }
  };

  const handlePrevious = () => {
    if (state.viewMode === 'week') {
      goToPreviousWeek();
    } else if (state.viewMode === 'month') {
      goToPreviousMonth();
    } else {
      goToPreviousDay();
    }
  };

  const handleNext = () => {
    if (state.viewMode === 'week') {
      goToNextWeek();
    } else if (state.viewMode === 'month') {
      goToNextMonth();
    } else {
      goToNextDay();
    }
  };

  const getDateDisplay = () => {
    return dateHelpers.formatMonthYear(state.currentDate);
  };

  const getMobileDateDisplay = () => {
    if (state.viewMode === 'day') {
      return dateHelpers.formatDate(state.currentDate, 'EEE, MMM d');
    }
    return dateHelpers.formatMonthYear(state.currentDate);
  };

  return (
    <div className="glass-nav sticky top-0 z-50 border-b border-border/40">
      {/* Desktop Nav */}
      <div className="hidden md:block max-w-[1800px] mx-auto px-6 py-3">
        <div className="relative flex items-center justify-between gap-4">
          {/* Left Section - Date Navigation */}
          <div className="flex items-center gap-4 w-[300px]">
            <h1 className="text-xl font-bold font-mono tracking-tight text-foreground/90">
              {getDateDisplay()}
            </h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="h-7 w-7 hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={goToToday}
                className="h-7 px-2.5 text-xs font-mono font-medium hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all duration-200 bg-background/50 border-border/60"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-7 w-7 hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center Section - View Mode Switcher */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
            <div className="relative">
              <Tabs 
                value={state.viewMode} 
                onValueChange={(value) => setViewMode(value as ViewMode)}
                className="w-auto"
              >
                <TabsList className="h-9 p-1 bg-muted/40 border border-border/40 shadow-sm">
                  <TabsTrigger 
                    value="day" 
                    className="h-7 px-4 text-xs font-mono font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    Day
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className="h-7 px-4 text-xs font-mono font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    Week
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month" 
                    className="h-7 px-4 text-xs font-mono font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Week View Toggle */}
              <div className={cn(
                "absolute left-full ml-3 top-0 h-full flex items-center transition-all duration-300 ease-out origin-left",
                state.viewMode === 'week' ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 -translate-x-2 pointer-events-none"
              )}>
                {onWeekViewModeChange && (
                  <div className="flex items-center bg-muted/40 rounded-lg p-1 border border-border/40 shadow-sm h-9">
                    <button
                      onClick={() => onWeekViewModeChange('list')}
                      className={cn(
                        'flex items-center justify-center h-7 w-8 rounded-md transition-all duration-200',
                        weekViewMode === 'list' 
                          ? 'bg-background text-foreground shadow-sm scale-105 ring-1 ring-black/5 dark:ring-white/5' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      )}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onWeekViewModeChange('schedule')}
                      className={cn(
                        'flex items-center justify-center h-7 w-8 rounded-md transition-all duration-200',
                        weekViewMode === 'schedule' 
                          ? 'bg-background text-foreground shadow-sm scale-105 ring-1 ring-black/5 dark:ring-white/5' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      )}
                      title="Schedule View"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center justify-end gap-2 w-[300px]">
            {/* Profile Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    'h-8 px-2.5 gap-2 font-mono text-xs font-medium',
                    'transition-all duration-200 ease-out border bg-background/50',
                    'hover:bg-accent/50 hover:border-border',
                    isViewAll 
                      ? 'border-border/60'
                      : currentProfile && getProfileColorClasses(currentProfile.color).split('hover:')[0]
                  )}
                >
                  <span className="text-base leading-none">{isViewAll ? '◈' : currentProfile?.icon}</span>
                  <span className="max-w-[100px] truncate">{isViewAll ? 'View All' : currentProfile?.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-background/95 border-border/50 shadow-xl">
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Switch Profile
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleProfileSwitch('view-all')}
                  className={cn(
                    "font-mono cursor-pointer text-xs py-2 focus:bg-accent/50",
                    isViewAll && "bg-accent/50"
                  )}
                >
                  <span className="text-sm mr-2">◈</span>
                  <span className="flex-1">View All Profiles</span>
                  {isViewAll && <Check className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                {profiles.map((profile) => {
                  const isActive = !isViewAll && profile.id === currentProfileId;
                  return (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleProfileSwitch(profile.id)}
                      className={cn(
                        "font-mono cursor-pointer text-xs py-2 focus:bg-accent/50",
                        isActive && "bg-accent/50"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full mr-2.5", getProfileDotColor(profile.color))} />
                      <span className="flex-1">{profile.name}</span>
                      {isActive && <Check className="h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild>
                  <Link href="/settings?section=profiles" className="font-mono cursor-pointer text-xs py-2 focus:bg-accent/50">
                    <Settings className="h-3.5 w-3.5 mr-2 opacity-70" />
                    <span>Manage Profiles</span>
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="font-mono cursor-pointer text-xs py-2 focus:bg-accent/50 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2 opacity-70" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {onShowKeyboardHelp && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-muted/60 transition-colors"
                onClick={onShowKeyboardHelp}
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4 opacity-70" />
              </Button>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/60 transition-colors">
                <Settings className="h-4 w-4 opacity-70" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Nav - Single Row Design */}
      <MobileNav
        state={state}
        setViewMode={setViewMode}
        weekViewMode={weekViewMode}
        onWeekViewModeChange={onWeekViewModeChange}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
        goToToday={goToToday}
        getMobileDateDisplay={getMobileDateDisplay}
        isViewAll={isViewAll}
        currentProfile={currentProfile}
        profiles={profiles}
        handleProfileSwitch={handleProfileSwitch}
        user={user}
        signOut={signOut}
      />
    </div>
  );
}

// Mobile Navigation with Sidebar
function MobileNav({
  state,
  setViewMode,
  weekViewMode,
  onWeekViewModeChange,
  handlePrevious,
  handleNext,
  goToToday,
  getMobileDateDisplay,
  isViewAll,
  currentProfile,
  profiles,
  handleProfileSwitch,
  user,
  signOut,
}: {
  state: { viewMode: ViewMode; currentDate: Date };
  setViewMode: (mode: ViewMode) => void;
  weekViewMode: 'list' | 'schedule';
  onWeekViewModeChange?: (mode: 'list' | 'schedule') => void;
  handlePrevious: () => void;
  handleNext: () => void;
  goToToday: () => void;
  getMobileDateDisplay: () => string;
  isViewAll: boolean;
  currentProfile: Profile | undefined;
  profiles: Profile[];
  handleProfileSwitch: (id: string) => void;
  user: { id: string } | null;
  signOut: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleViewChange = (mode: ViewMode, weekMode?: 'list' | 'schedule') => {
    setViewMode(mode);
    if (weekMode && onWeekViewModeChange) {
      onWeekViewModeChange(weekMode);
    }
    closeSidebar();
  };

  return (
    <>
      <div className="md:hidden px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Menu button */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted/60 transition-colors active:scale-95"
          >
            <Menu className="w-4 h-4 text-foreground" />
          </button>

          {/* Center: Date with navigation */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center">
              <button onClick={handlePrevious} className="p-1.5 hover:bg-muted/50 rounded-md transition-colors active:scale-95">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={goToToday}
                className="px-3 py-1 min-w-[120px] text-center"
              >
                <span className="text-sm font-semibold font-mono tracking-tight">{getMobileDateDisplay()}</span>
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-muted/50 rounded-md transition-colors active:scale-95">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Right: Profile */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
                  <span className="text-sm">{isViewAll ? '◈' : currentProfile?.icon}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 backdrop-blur-xl bg-background/95 border-border/50 shadow-xl">
                <DropdownMenuLabel className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  Profile
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleProfileSwitch('view-all')}
                  className={cn("font-mono cursor-pointer text-xs py-2", isViewAll && "bg-accent/50")}
                >
                  <span className="text-sm mr-2">◈</span>
                  <span className="flex-1">View All</span>
                  {isViewAll && <Check className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/30" />
                {profiles.map((profile) => {
                  const isActive = !isViewAll && profile.id === currentProfile?.id;
                  return (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleProfileSwitch(profile.id)}
                      className={cn("font-mono cursor-pointer text-xs py-2", isActive && "bg-accent/50")}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full mr-2.5", getProfileDotColor(profile.color))} />
                      <span className="flex-1">{profile.name}</span>
                      {isActive && <Check className="h-3 w-3 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem asChild>
                  <Link href="/settings?section=profiles" className="font-mono cursor-pointer text-xs py-2">
                    <Settings className="h-3.5 w-3.5 mr-2 opacity-70" />
                    Manage Profiles
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay - Strong blur for readability */}
      <div 
        className={cn(
          "fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl transition-all duration-200 md:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />

      {/* Sidebar - Compact with solid background */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-[101] h-full w-[240px] bg-background border-r border-border/50 shadow-2xl md:hidden",
          "transition-transform duration-200 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header - Compact */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-background font-bold text-xs">A</span>
            </div>
            <span className="font-mono font-semibold text-xs">AeroTodo</span>
          </div>
          <button 
            onClick={closeSidebar}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* View Options */}
          <div className="p-2.5">
            <p className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Views</p>
            
            {/* Day */}
            <button
              onClick={() => handleViewChange('day')}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all active:scale-[0.98]",
                state.viewMode === 'day' 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <Sun className="w-4.5 h-4.5" />
              <span className="font-mono text-xs font-medium">Day</span>
              {state.viewMode === 'day' && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {/* Week - List */}
            <button
              onClick={() => handleViewChange('week', 'list')}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all active:scale-[0.98]",
                state.viewMode === 'week' && weekViewMode === 'list'
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <List className="w-4.5 h-4.5" />
              <span className="font-mono text-xs font-medium">Week List</span>
              {state.viewMode === 'week' && weekViewMode === 'list' && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {/* Week - Schedule */}
            <button
              onClick={() => handleViewChange('week', 'schedule')}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all active:scale-[0.98]",
                state.viewMode === 'week' && weekViewMode === 'schedule'
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <Clock className="w-4.5 h-4.5" />
              <span className="font-mono text-xs font-medium">Week Schedule</span>
              {state.viewMode === 'week' && weekViewMode === 'schedule' && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {/* Month */}
            <button
              onClick={() => handleViewChange('month')}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all active:scale-[0.98]",
                state.viewMode === 'month'
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <LayoutGrid className="w-4.5 h-4.5" />
              <span className="font-mono text-xs font-medium">Month</span>
              {state.viewMode === 'month' && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-border/40" />

          {/* Quick Actions */}
          <div className="p-2.5">
            <p className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Quick Actions</p>
            
            <button
              onClick={() => { goToToday(); closeSidebar(); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-muted/50 transition-all active:scale-[0.98] text-foreground"
            >
              <CalendarIcon className="w-4.5 h-4.5" />
              <span className="font-mono text-xs font-medium">Go to Today</span>
            </button>

            <Link href="/settings" onClick={closeSidebar}>
              <div className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-muted/50 transition-all active:scale-[0.98] text-foreground">
                <Settings className="w-4.5 h-4.5" />
                <span className="font-mono text-xs font-medium">Settings</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Section - Sign In/Out */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 border-t border-border/40 bg-background">
          {user ? (
            <button
              onClick={() => { signOut(); closeSidebar(); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-destructive/10 transition-all active:scale-[0.98] text-destructive"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="font-mono text-xs font-medium">Sign Out</span>
            </button>
          ) : (
            <Link href="/login" onClick={closeSidebar}>
              <div className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-primary/10 transition-all active:scale-[0.98] text-primary">
                <LogOut className="w-4.5 h-4.5 rotate-180" />
                <span className="font-mono text-xs font-medium">Sign In</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
