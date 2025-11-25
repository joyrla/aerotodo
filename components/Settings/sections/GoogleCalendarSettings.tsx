'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { isGoogleCalendarConnected, disconnectGoogleCalendar, initiateGoogleCalendarAuth } from '@/lib/utils/googleCalendar';
import { SettingsSection } from '../SettingsSection';
import { CalendarCheck, Link2, Unlink } from 'lucide-react';

export function GoogleCalendarSettings() {
  const [connected, setConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    setConnected(isGoogleCalendarConnected());
    setAutoSync(localStorage.getItem('aerotodo_google_calendar_auto_sync') === 'true');
  }, []);

  const handleConnect = () => {
    initiateGoogleCalendarAuth();
    // In production, this would redirect to OAuth and come back
    // For now, we'll just show a message
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar? All synced events will remain in Google Calendar but won\'t be updated.')) {
      disconnectGoogleCalendar();
      setConnected(false);
    }
  };

  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('aerotodo_google_calendar_auto_sync', checked.toString());
  };

  return (
    <SettingsSection
      title="Google Calendar"
      description="Sync your tasks with Google Calendar"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-mono font-medium">
                {connected ? 'Connected' : 'Not Connected'}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {connected 
                  ? 'Your tasks are syncing with Google Calendar'
                  : 'Connect your Google Calendar to sync tasks'}
              </div>
            </div>
          </div>
          {connected ? (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="font-mono"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              size="sm"
              className="font-mono"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Connect
            </Button>
          )}
        </div>

        {connected && (
          <div className="flex items-start gap-3">
            <Checkbox
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={handleAutoSyncToggle}
              className="mt-1"
            />
            <div className="space-y-1 flex-1">
              <Label htmlFor="auto-sync" className="text-sm font-mono cursor-pointer">
                Auto-sync all tasks
              </Label>
              <p className="text-xs text-muted-foreground font-mono">
                Automatically sync all tasks with Google Calendar when created or updated
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-mono font-medium mb-3">Sync Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono">Sync Direction</Label>
              <select
                defaultValue="app-to-google"
                className="px-3 py-1.5 bg-background border border-border rounded text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="app-to-google">AeroTodo → Google Calendar</option>
                <option value="bidirectional">Bidirectional</option>
                <option value="google-to-app">Google Calendar → AeroTodo</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono">Default Calendar</Label>
              <select
                defaultValue="primary"
                className="px-3 py-1.5 bg-background border border-border rounded text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="primary">Primary Calendar</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

