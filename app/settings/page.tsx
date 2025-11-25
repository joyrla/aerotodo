'use client';

import { Suspense } from 'react';
import { CalendarProvider } from '@/lib/contexts/CalendarContext';
import { SettingsPage } from '@/components/Settings/SettingsPage';

export default function Settings() {
  return (
    <CalendarProvider>
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-sm font-mono text-muted-foreground">Loading settings...</div></div>}>
        <SettingsPage />
      </Suspense>
    </CalendarProvider>
  );
}

