'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsSection } from '../SettingsSection';
import { Bell, Smartphone, Mail } from 'lucide-react';

export function NotificationSettings() {
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationSound, setNotificationSound] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');

  useEffect(() => {
    setBrowserNotifications(localStorage.getItem('aerotodo_browser_notifications') === 'true');
    setEmailNotifications(localStorage.getItem('aerotodo_email_notifications') === 'true');
    setNotificationSound(localStorage.getItem('aerotodo_notification_sound') !== 'false');
    setNotificationTime(localStorage.getItem('aerotodo_notification_time') || '09:00');
  }, []);

  const handleToggle = (key: string, value: boolean) => {
    localStorage.setItem(key, value.toString());
  };

  return (
    <SettingsSection
      title="Notifications"
      description="Configure how and when you receive notifications"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="browser-notifications"
            checked={browserNotifications}
            onCheckedChange={(checked) => {
              setBrowserNotifications(checked as boolean);
              handleToggle('aerotodo_browser_notifications', checked as boolean);
            }}
            className="mt-1"
          />
          <div className="space-y-1 flex-1">
            <Label htmlFor="browser-notifications" className="text-sm font-mono cursor-pointer flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Browser Notifications
            </Label>
            <p className="text-xs text-muted-foreground font-mono">
              Receive browser notifications for reminders and important updates
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={(checked) => {
              setEmailNotifications(checked as boolean);
              handleToggle('aerotodo_email_notifications', checked as boolean);
            }}
            className="mt-1"
          />
          <div className="space-y-1 flex-1">
            <Label htmlFor="email-notifications" className="text-sm font-mono cursor-pointer flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Notifications
            </Label>
            <p className="text-xs text-muted-foreground font-mono">
              Receive email summaries and important updates
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="notification-sound"
            checked={notificationSound}
            onCheckedChange={(checked) => {
              setNotificationSound(checked as boolean);
              handleToggle('aerotodo_notification_sound', checked as boolean);
            }}
            className="mt-1"
          />
          <div className="space-y-1 flex-1">
            <Label htmlFor="notification-sound" className="text-sm font-mono cursor-pointer">
              Notification Sound
            </Label>
            <p className="text-xs text-muted-foreground font-mono">
              Play a sound when notifications arrive
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-mono">Daily Digest Time</Label>
          <input
            type="time"
            value={notificationTime}
            onChange={(e) => {
              setNotificationTime(e.target.value);
              localStorage.setItem('aerotodo_notification_time', e.target.value);
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground font-mono">
            Time to receive daily task summary
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-mono font-medium mb-3">Notification Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono">Reminder Notifications</Label>
              <select
                defaultValue="all"
                className="px-3 py-1.5 bg-background border border-border rounded text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Reminders</option>
                <option value="important">Important Only</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono">Overdue Alerts</Label>
              <select
                defaultValue="daily"
                className="px-3 py-1.5 bg-background border border-border rounded text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Summary</option>
                <option value="weekly">Weekly Summary</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

