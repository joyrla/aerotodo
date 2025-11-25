'use client';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-mono font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground font-mono mt-1">{description}</p>
      </div>
      <div className="bg-background border border-border rounded-lg p-6">
        {children}
      </div>
    </div>
  );
}

