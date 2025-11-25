'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Settings as SettingsIcon, Bell, Palette, Calendar, Database, Shield, Zap, Download, Upload, Link2, Mail, Smartphone, Globe, Lock, Trash2, LayoutGrid, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TaskManagementSettings } from './sections/TaskManagementSettings';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { ReminderSettings } from './sections/ReminderSettings';
import { GoogleCalendarSettings } from './sections/GoogleCalendarSettings';
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
  {
    id: 'general',
    label: 'Task Management',
    icon: SettingsIcon,
    description: 'Task behavior and organization',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Themes and visual preferences',
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: LayoutGrid,
    description: 'Productivity modules and layout',
  },
  {
    id: 'profiles',
    label: 'Profiles',
    icon: Users,
    description: 'Manage multiple profiles',
  },
  {
    id: 'reminders',
    label: 'Reminders',
    icon: Bell,
    description: 'Default reminder times',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Zap,
    description: 'Alert and notification preferences',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link2,
    description: 'Connect external services',
  },
  {
    id: 'data',
    label: 'Data & Privacy',
    icon: Database,
    description: 'Export, import, and privacy settings',
  },
  {
    id: 'account',
    label: 'Account',
    icon: Shield,
    description: 'Account and security settings',
  },
];

export function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    // Check if there's a section query parameter
    const sectionParam = searchParams.get('section');
    if (sectionParam && ['general', 'appearance', 'modules', 'profiles', 'reminders', 'notifications', 'integrations', 'data', 'account'].includes(sectionParam)) {
      setActiveSection(sectionParam as SettingsSection);
    }
  }, [searchParams]);

  // Filter sections based on search query
  const filteredSections = settingsSections.filter(section => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.label.toLowerCase().includes(query) ||
      section.description.toLowerCase().includes(query)
    );
  });

  const handleSectionChange = (section: SettingsSection) => {
    if (section === activeSection) return;
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10 animate-slide-in-top">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/calendar')}
              className="h-8 w-8 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-accent/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <h1 className="text-2xl font-mono font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground font-mono">Manage your preferences and account</p>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className={cn(
            "w-64 flex-shrink-0",
            mounted && "opacity-0 animate-slide-in-left"
          )} style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {/* Search Settings */}
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
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200',
                      'hover:bg-accent/50 hover:translate-x-1',
                      'opacity-0',
                      activeSection === section.id
                        ? 'bg-accent border border-foreground/20 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 30 + 200}ms forwards`,
                    }}
                  >
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                      activeSection === section.id && "scale-110"
                    )} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{section.label}</div>
                      <div className="text-xs opacity-70">{section.description}</div>
                    </div>
                  </button>
                );
              })}
              {filteredSections.length === 0 && (
                <div className="text-center py-8 text-sm font-mono text-muted-foreground">
                  No settings found for "{searchQuery}"
                </div>
              )}
            </nav>
          </aside>

          {/* Main Content */}
          <main className={cn(
            "flex-1 min-w-0",
            mounted && "opacity-0 animate-slide-in-right"
          )} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="max-w-3xl">
              <div
                key={activeSection}
                className="opacity-0 animate-slide-in-bottom"
                style={{ animationDelay: '0ms' }}
              >
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
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

