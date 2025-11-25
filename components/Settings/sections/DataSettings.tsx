'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/utils/storage';
import { SettingsSection } from '../SettingsSection';
import { Download, Upload, Trash2 } from 'lucide-react';

export function DataSettings() {
  const handleExport = () => {
    const tasks = storage.getTasks();
    const projects = storage.get<Array<any>>('aerotodo_projects', []);
    const data = {
      tasks,
      projects,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aerotodo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.tasks) {
            storage.saveTasks(data.tasks);
          }
          if (data.projects) {
            storage.set('aerotodo_projects', data.projects);
          }
          window.alert('Data imported successfully! Please refresh the page.');
        } catch (error) {
          window.alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all tasks, projects, and settings. Type "DELETE" to confirm.')) {
        storage.clearAll();
        window.alert('All data has been cleared. The page will reload.');
        window.location.reload();
      }
    }
  };

  return (
    <SettingsSection
      title="Data & Privacy"
      description="Manage your data, export, import, and privacy settings"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-mono font-medium">Data Management</h3>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-mono font-medium">Export Data</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Download all your tasks and projects as a JSON file
                </div>
              </div>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="font-mono">
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-mono font-medium">Import Data</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Restore tasks and projects from a backup file
                </div>
              </div>
            </div>
            <Button onClick={handleImport} variant="outline" size="sm" className="font-mono">
              Import
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-mono font-medium mb-3">Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono">Data Storage</Label>
              <span className="text-xs text-muted-foreground font-mono">Local Only</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-mono">Analytics</Label>
              <select
                defaultValue="off"
                className="px-3 py-1.5 bg-background border border-border rounded text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-mono font-medium mb-3 text-destructive">Danger Zone</h3>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div>
                <div className="text-sm font-mono font-medium text-destructive">Clear All Data</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Permanently delete all tasks, projects, and settings
                </div>
              </div>
            </div>
            <Button onClick={handleClearAll} variant="destructive" size="sm" className="font-mono">
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

