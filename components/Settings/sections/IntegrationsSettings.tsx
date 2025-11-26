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
import { Link2, CalendarCheck, Mail, Slack, Workflow, Check, X, RefreshCw, Loader2, ExternalLink, Settings2 } from 'lucide-react';
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
  const { projects } = useCalendar();
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
  
  const { tasks, updateTask, addTask } = useCalendar();
  const [showGcalSettings, setShowGcalSettings] = useState(false);

  // Handle OAuth callback messages
  useEffect(() => {
    const gcalStatus = searchParams.get('gcal');
    const error = searchParams.get('error');

    if (gcalStatus === 'connected') {
      toast.success('Successfully connected to Google Calendar!');
      setShowGcalSettings(true);
      // Clean URL
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
      (taskData) => addTask(taskData)
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
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isConnected ? "bg-green-500/10" : "bg-muted"
              )}>
                <CalendarCheck className={cn(
                  "w-5 h-5",
                  isConnected ? "text-green-600" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <div className="text-sm font-mono font-medium flex items-center gap-2">
                  Google Calendar
                  {isConnected && (
                    <span className="text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Connected
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {isConnected 
                    ? gcalSettings.lastSyncAt 
                      ? `Last synced: ${new Date(gcalSettings.lastSyncAt).toLocaleString()}`
                      : 'Connected - Ready to sync'
                    : 'Not connected'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="font-mono"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGcalSettings(!showGcalSettings)}
                    className="font-mono"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant={isConnected ? 'outline' : 'default'}
                size="sm"
                onClick={isConnected ? disconnect : connect}
                disabled={isLoading}
                className="font-mono"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isConnected ? (
                  <X className="w-4 h-4 mr-2" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          </div>

          {/* Google Calendar Settings */}
          {isConnected && showGcalSettings && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
              {/* Calendar Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-mono">Default Calendar</Label>
                <Select
                  value={gcalSettings.defaultCalendarId || ''}
                  onValueChange={(value) => updateSettings({ defaultCalendarId: value })}
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id} className="font-mono">
                        <div className="flex items-center gap-2">
                          {cal.backgroundColor && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cal.backgroundColor }}
                            />
                          )}
                          {cal.summary}
                          {cal.primary && (
                            <span className="text-xs text-muted-foreground">(Primary)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground font-mono">
                  Tasks will be synced to this calendar
                </p>
              </div>

              {/* Profile Assignment */}
              <div className="space-y-2">
                <Label className="text-sm font-mono">Assign to Profile</Label>
                <Select
                  value={gcalSettings.profileId || 'none'}
                  onValueChange={(value) => updateSettings({ profileId: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="No profile (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="font-mono">
                      No profile (default)
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="font-mono">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground font-mono">
                  Events imported from Google Calendar will be assigned to this profile
                </p>
              </div>

              {/* Sync Options */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono">Two-Way Sync</Label>
                    <p className="text-xs text-muted-foreground font-mono">
                      Import events from Google Calendar as tasks
                    </p>
                  </div>
                  <Switch
                    checked={gcalSettings.twoWaySync}
                    onCheckedChange={(checked) => updateSettings({ twoWaySync: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-mono">Sync All Tasks</Label>
                    <p className="text-xs text-muted-foreground font-mono">
                      Automatically sync all tasks to Google Calendar
                    </p>
                  </div>
                  <Switch
                    checked={gcalSettings.syncAllTasks}
                    onCheckedChange={(checked) => updateSettings({ syncAllTasks: checked })}
                  />
                </div>

                {!gcalSettings.syncAllTasks && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-mono">Time-Blocked Only</Label>
                      <p className="text-xs text-muted-foreground font-mono">
                        Only sync tasks that have a time slot assigned
                      </p>
                    </div>
                    <Switch
                      checked={gcalSettings.syncTimeBlockedOnly}
                      onCheckedChange={(checked) => updateSettings({ syncTimeBlockedOnly: checked })}
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-mono">
                  💡 Tip: You can also sync individual tasks using the calendar button in the task detail view.
                </p>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Other Integrations */}
      <SettingsSection
        title="Other Integrations"
        description="Connect with more tools and services"
      >
        <div className="space-y-3">
          {otherIntegrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-mono font-medium flex items-center gap-2">
                      {integration.name}
                      {integration.comingSoon && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {integration.description}
                    </div>
                  </div>
                </div>
                {!integration.comingSoon && (
                  <Button
                    variant={integration.connected ? 'outline' : 'default'}
                    size="sm"
                    className="font-mono"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {integration.connected ? 'Connected' : 'Connect'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}
