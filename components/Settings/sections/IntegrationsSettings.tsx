'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsSection } from '../SettingsSection';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar';
import { useCalendar } from '@/lib/contexts/CalendarContext';
import { profileStorage } from '@/lib/utils/storage';
import type { Profile } from '@/types';
import { Link2, CalendarDays, Mail, Slack, Workflow, Check, X, RefreshCw, Loader2, ChevronDown, ChevronUp, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  comingSoon?: boolean;
}

export function IntegrationsSettings() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const {
    settings: gcalSettings,
    calendars,
    isLoading,
    isSyncing,
    isConnected,
    connect,
    disconnect,
    updateSettings,
    performFullSync,
    loadCalendars,
  } = useGoogleCalendar();
  
  const { tasks, updateTask, addTask, projects, addProject, ensureProjectExists } = useCalendar();
  const [showGcalSettings, setShowGcalSettings] = useState(true);

  // Load profiles from storage
  useEffect(() => {
    setProfiles(profileStorage.getProfiles());
  }, []);

  // Handle OAuth callback messages
  useEffect(() => {
    const gcalStatus = searchParams.get('gcal');
    const error = searchParams.get('error');

    if (gcalStatus === 'connected') {
      toast.success('Successfully connected to Google Calendar!');
      setShowGcalSettings(true);
      window.history.replaceState({}, '', '/settings?section=integrations');
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      window.history.replaceState({}, '', '/settings?section=integrations');
    }
  }, [searchParams]);

  const handleSync = async () => {
    await performFullSync(
      tasks,
      (taskId, updates) => updateTask(taskId, updates),
      (taskData) => addTask(taskData),
      ensureProjectExists
    );
  };

  const otherIntegrations: Integration[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get task notifications in Slack',
      icon: Slack,
      connected: false,
      comingSoon: true,
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Send task updates via email',
      icon: Mail,
      connected: false,
      comingSoon: true,
    },
    {
      id: 'n8n',
      name: 'n8n',
      description: 'Automate workflows with n8n',
      icon: Workflow,
      connected: false,
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Google Calendar - Featured Integration */}
      <SettingsSection
        title="Google Calendar"
        description="Sync your tasks with Google Calendar for seamless scheduling"
      >
        <div className="space-y-4">
          {/* Connection Card */}
          <div className={cn(
            "rounded-xl border transition-all duration-200",
            isConnected 
              ? "border-border bg-card" 
              : "border-border bg-card"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
                  isConnected 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono">Google Calendar</span>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-500/8 px-1.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {isConnected 
                      ? gcalSettings.lastSyncAt 
                        ? `Last sync: ${new Date(gcalSettings.lastSyncAt).toLocaleDateString()} at ${new Date(gcalSettings.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Ready to sync'
                      : 'Connect to sync tasks'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="h-8 px-3 font-mono text-xs"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </Button>
                )}
                <Button
                  variant={isConnected ? 'ghost' : 'default'}
                  size="sm"
                  onClick={isConnected ? disconnect : connect}
                  disabled={isLoading}
                  className={cn(
                    "h-8 px-3 font-mono text-xs",
                    isConnected && "text-muted-foreground hover:text-destructive"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : isConnected ? (
                    <X className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            {isConnected && (
              <>
                {/* Toggle */}
                <button
                  onClick={() => setShowGcalSettings(!showGcalSettings)}
                  className="w-full flex items-center justify-between px-4 py-2 border-t border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    {showGcalSettings ? 'Hide settings' : 'Show settings'}
                  </span>
                  {showGcalSettings ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {showGcalSettings && (
                  <div className="px-4 pb-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    {/* Dropdowns Row */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {/* Calendar Selection */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-mono text-muted-foreground">Calendar</Label>
                        <Select
                          value={gcalSettings.defaultCalendarId || ''}
                          onValueChange={(value) => updateSettings({ defaultCalendarId: value })}
                        >
                          <SelectTrigger className="h-9 font-mono text-sm">
                            <SelectValue placeholder="Select calendar" />
                          </SelectTrigger>
                          <SelectContent>
                            {calendars.map((cal) => (
                              <SelectItem key={cal.id} value={cal.id} className="font-mono text-sm">
                                <div className="flex items-center gap-2">
                                  {cal.backgroundColor && (
                                    <div 
                                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: cal.backgroundColor }}
                                    />
                                  )}
                                  <span className="truncate">{cal.summary}</span>
                                  {cal.primary && (
                                    <span className="text-[10px] text-muted-foreground">(Primary)</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Profile Assignment */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-mono text-muted-foreground">Import to Profile</Label>
                        <Select
                          value={gcalSettings.profileId || 'none'}
                          onValueChange={(value) => {
                            const profileId = value === 'none' ? undefined : value;
                            // Ensure the profile exists as a project (for FK constraints)
                            if (profileId) {
                              const profile = profiles.find(p => p.id === profileId);
                              const projectExists = projects.some(p => p.id === profileId);
                              if (profile && !projectExists) {
                                addProject({
                                  id: profile.id,
                                  name: profile.name,
                                  color: profile.color || 'default',
                                });
                              }
                            }
                            updateSettings({ profileId });
                          }}
                        >
                          <SelectTrigger className="h-9 font-mono text-sm">
                            <SelectValue placeholder="No profile" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="font-mono text-sm">
                              No profile
                            </SelectItem>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id} className="font-mono text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{profile.icon}</span>
                                  {profile.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Sync Options */}
                    <div className="space-y-1 rounded-lg border border-border/50 overflow-hidden">
                      {/* Two-Way Sync */}
                      <div className="px-3 py-2.5 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono">Two-Way Sync</span>
                          <Switch
                            checked={gcalSettings.twoWaySync}
                            onCheckedChange={(checked) => updateSettings({ twoWaySync: checked })}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-1.5 flex items-start gap-1.5">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" />
                          Import events from Google Calendar as tasks.
                        </p>
                      </div>
                      
                      {/* Sync All Tasks */}
                      <div className="px-3 py-2.5 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono">Sync All Tasks</span>
                          <Switch
                            checked={gcalSettings.syncAllTasks}
                            onCheckedChange={(checked) => updateSettings({ syncAllTasks: checked })}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-1.5 flex items-start gap-1.5">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" />
                          Push all tasks to Google Calendar automatically.
                        </p>
                      </div>
                      
                      {/* Time-Blocked Only */}
                      {!gcalSettings.syncAllTasks && (
                        <div className="px-3 py-2.5 border-t border-border/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono">Time-Blocked Only</span>
                            <Switch
                              checked={gcalSettings.syncTimeBlockedOnly}
                              onCheckedChange={(checked) => updateSettings({ syncTimeBlockedOnly: checked })}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-1.5 flex items-start gap-1.5">
                            <Info className="w-3 h-3 mt-0.5 shrink-0" />
                            Only sync tasks that have a time slot assigned.
                          </p>
                        </div>
                      )}
                      
                      {/* Delete from GCal */}
                      <div className="px-3 py-2.5 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono">Delete from GCal</span>
                          <Switch
                            checked={gcalSettings.deleteFromGcal ?? true}
                            onCheckedChange={(checked) => updateSettings({ deleteFromGcal: checked })}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-1.5 flex items-start gap-1.5">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" />
                          Remove events from GCal when tasks are deleted here.
                        </p>
                      </div>
                      
                      {/* Treat as Events */}
                      <div className="px-3 py-2.5 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono">Treat as Events</span>
                          <Switch
                            checked={gcalSettings.treatAsEvents ?? true}
                            onCheckedChange={(checked) => updateSettings({ treatAsEvents: checked })}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-1.5 flex items-start gap-1.5">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" />
                          Imported events won't appear in Overdue section.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Other Integrations */}
      <SettingsSection
        title="Other Integrations"
        description="Connect with more tools and services"
      >
        <div className="grid gap-2">
          {otherIntegrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">{integration.name}</span>
                      {integration.comingSoon && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {integration.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}
