'use client';

import { Button } from '@/components/ui/button';
import { SettingsSection } from '../SettingsSection';
import { Link2, CalendarCheck, Mail, Slack, Workflow } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  comingSoon?: boolean;
}

const integrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync tasks with Google Calendar',
    icon: CalendarCheck,
    connected: false,
    comingSoon: true,
  },
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

export function IntegrationsSettings() {
  return (
    <SettingsSection
      title="Integrations"
      description="Connect with your favorite tools and services"
    >
      <div className="space-y-3">
        {integrations.map((integration) => {
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
  );
}

