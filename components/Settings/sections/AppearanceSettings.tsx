'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { themes, applyTheme, getCurrentTheme, saveTheme, ThemeName, applyRadius, getCurrentShape, saveShape, ThemeShape, themeShapes } from '@/lib/utils/themes';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { SettingsSection } from '../SettingsSection';

export function AppearanceSettings() {
  const { preferences, updatePreferences } = useSettings();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('default');
  const [selectedShape, setSelectedShape] = useState<ThemeShape>('squared');

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
    setSelectedShape(getCurrentShape());
  }, []);

  const handleThemeChange = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
    saveTheme(themeName);
    
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(themeName, isDark ? 'dark' : 'light');
  };

  const handleShapeChange = (value: ThemeShape) => {
    setSelectedShape(value);
    saveShape(value);
    applyRadius(value);
  };

  const handleDefaultViewChange = (value: string) => {
    updatePreferences({ defaultView: value as 'day' | 'week' | 'month' });
  };

  const handleWeekStartsOnChange = (value: string) => {
    updatePreferences({ weekStartsOn: parseInt(value) as 0 | 1 });
  };

  return (
    <SettingsSection
      title="Appearance"
      description="Customize the look and feel of your calendar"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme-select" className="text-sm font-mono">
            Color Theme
          </Label>
          <Select value={selectedTheme} onValueChange={handleThemeChange}>
            <SelectTrigger id="theme-select" className="font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(themes).map((theme) => (
                <SelectItem key={theme.name} value={theme.name} className="font-mono">
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground font-mono">
            Choose your preferred color scheme. More themes coming soon.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shape-select" className="text-sm font-mono">
            Theme Shape
          </Label>
          <Select value={selectedShape} onValueChange={handleShapeChange}>
            <SelectTrigger id="shape-select" className="font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(themeShapes).map(([key, config]) => (
                <SelectItem key={key} value={key} className="font-mono">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground font-mono">
            Choose between squared, squircle, or pill-shaped UI elements.
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-base font-mono font-semibold mb-4">View Settings</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-mono">Default View</Label>
              <Select value={preferences.defaultView} onValueChange={handleDefaultViewChange}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day" className="font-mono">Day</SelectItem>
                  <SelectItem value="week" className="font-mono">Week</SelectItem>
                  <SelectItem value="month" className="font-mono">Month</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-mono">
                The view that opens when you first load the calendar
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-mono">Week Starts On</Label>
              <Select value={String(preferences.weekStartsOn)} onValueChange={handleWeekStartsOnChange}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="font-mono">Monday</SelectItem>
                  <SelectItem value="0" className="font-mono">Sunday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground font-mono">
                Choose which day your week begins
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
