'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Settings as SettingsIcon, Bell, Palette, Database, Shield, Zap, Link2, LayoutGrid, Users, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TaskManagementSettings } from './sections/TaskManagementSettings';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { ReminderSettings } from './sections/ReminderSettings';
import { NotificationSettings } from './sections/NotificationSettings';
import { DataSettings } from './sections/DataSettings';
import { IntegrationsSettings } from './sections/IntegrationsSettings';
import { AccountSettings } from './sections/AccountSettings';
import { ModulesSettings } from './sections/ModulesSettings';
import { ProfilesSettings } from './sections/ProfilesSettings';

type SettingsSection = 
  | 'general'
  | 'appearance'
  | 'modules'
  | 'profiles'
  | 'reminders'
  | 'notifications'
  | 'integrations'
  | 'data'
  | 'account';

interface SettingsSectionItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsSections: SettingsSectionItem[] = [
  { id: 'general', label: 'Task Management', icon: SettingsIcon, description: 'Task behavior and organization' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Themes and visual preferences' },
  { id: 'modules', label: 'Modules', icon: LayoutGrid, description: 'Productivity modules and layout' },
  { id: 'profiles', label: 'Profiles', icon: Users, description: 'Manage multiple profiles' },
  { id: 'reminders', label: 'Reminders', icon: Bell, description: 'Default reminder times' },
  { id: 'notifications', label: 'Notifications', icon: Zap, description: 'Alert and notification preferences' },
  { id: 'integrations', label: 'Integrations', icon: Link2, description: 'Connect external services' },
  { id: 'data', label: 'Data & Privacy', icon: Database, description: 'Export, import, and privacy settings' },
  { id: 'account', label: 'Account', icon: Shield, description: 'Account and security settings' },
];

export function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTransition, setMobileTransition] = useState<'idle' | 'entering' | 'leaving'>('idle');
  const prevSectionRef = useRef<SettingsSection | null>(null);

  useEffect(() => {
    setMounted(true);
    const sectionParam = searchParams.get('section');
    if (sectionParam && settingsSections.some(s => s.id === sectionParam)) {
      setActiveSection(sectionParam as SettingsSection);
    }
  }, [searchParams]);

  const filteredSections = settingsSections.filter(section => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return section.label.toLowerCase().includes(query) || section.description.toLowerCase().includes(query);
  });

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
  };

  const handleBack = () => {
    if (activeSection && window.innerWidth < 768) {
      setActiveSection(null);
    } else {
      router.push('/');
    }
  };

  const activeSectionData = settingsSections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Show either list or detail */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9 -ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold font-mono truncate">
                {activeSection ? activeSectionData?.label : 'Settings'}
              </h1>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        {!activeSection ? (
          // Section List
          <div className="px-4 py-2 animate-slide-in-left">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm font-mono bg-muted/30"
              />
            </div>
            <div className="space-y-1">
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left active:bg-accent/50 active:scale-[0.98] transition-all duration-150 hover-lift"
                    style={{
                      animation: `slideInFromLeft 0.3s ease-out ${index * 0.03}s both`
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium font-mono">{section.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{section.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform group-active:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Section Detail
          <div className="px-4 py-4 animate-slide-in-right">
            {activeSection === 'general' && <TaskManagementSettings />}
            {activeSection === 'appearance' && <AppearanceSettings />}
            {activeSection === 'modules' && <ModulesSettings />}
            {activeSection === 'profiles' && <ProfilesSettings />}
            {activeSection === 'reminders' && <ReminderSettings />}
            {activeSection === 'notifications' && <NotificationSettings />}
            {activeSection === 'integrations' && <IntegrationsSettings />}
            {activeSection === 'data' && <DataSettings />}
            {activeSection === 'account' && <AccountSettings />}
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="h-8 w-8 hover:bg-accent/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-mono font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground font-mono">Manage your preferences and account</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <aside className={cn("w-64 flex-shrink-0", mounted && "animate-fade-in")}>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm font-mono"
                />
              </div>
              
              <nav className="space-y-1">
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id || (!activeSection && section.id === 'general');
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200',
                        'hover:bg-accent/50',
                        isActive
                          ? 'bg-accent text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{section.label}</div>
                        <div className="text-xs opacity-70">{section.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main Content */}
            <main className={cn("flex-1 min-w-0", mounted && "animate-fade-in")}>
              <div className="max-w-3xl">
                {(activeSection === 'general' || !activeSection) && <TaskManagementSettings />}
                {activeSection === 'appearance' && <AppearanceSettings />}
                {activeSection === 'modules' && <ModulesSettings />}
                {activeSection === 'profiles' && <ProfilesSettings />}
                {activeSection === 'reminders' && <ReminderSettings />}
                {activeSection === 'notifications' && <NotificationSettings />}
                {activeSection === 'integrations' && <IntegrationsSettings />}
                {activeSection === 'data' && <DataSettings />}
                {activeSection === 'account' && <AccountSettings />}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

