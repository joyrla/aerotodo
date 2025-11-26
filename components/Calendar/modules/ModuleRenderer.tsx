'use client';

import { useCalendar } from '@/lib/contexts/CalendarContext';
import { ModuleConfig, ModuleComponentProps } from '@/types/modules';
import { getModuleDefinition } from '@/lib/modules/moduleRegistry';
import { BaseModule } from './BaseModule';
import { OverdueModule } from './OverdueModule';
import { InboxModule } from './InboxModule';
import { UpcomingModule } from './UpcomingModule';
import { RecentActivityModule } from './RecentActivityModule';

interface ModuleRendererProps {
  config: ModuleConfig;
  enableDragDrop?: boolean;
}

export function ModuleRenderer({ config, enableDragDrop = false }: ModuleRendererProps) {
  const { tasks, projects, currentProfileId } = useCalendar();
  const definition = getModuleDefinition(config.id);
  
  if (!definition || !config.enabled) {
    return null;
  }

  const filteredTasks = definition.filterTasks(tasks, projects, config.config, currentProfileId);
  const taskCount = definition.getTaskCount 
    ? definition.getTaskCount(tasks, projects, config.config, currentProfileId)
    : filteredTasks.length;

  const moduleProps: ModuleComponentProps = {
    tasks: filteredTasks,
    projects,
    enableDragDrop,
    config: config.config,
  };

  switch (config.id) {
    case 'overdue':
      return <OverdueModule {...moduleProps} config={config} />;
    case 'inbox':
      return <InboxModule {...moduleProps} config={config} />;
    case 'upcoming':
      return <UpcomingModule {...moduleProps} config={config} />;
    case 'recent-activity':
      return <RecentActivityModule {...moduleProps} config={config} />;
    default:
      // Fallback to generic module
      const Icon = definition.defaultIcon;
      return (
        <BaseModule
          title={config.customName || definition.name}
          titleIcon={Icon}
          tasks={filteredTasks}
          droppableId={config.id}
          enableDragDrop={enableDragDrop}
          borderColor={config.borderColor || definition.defaultBorderColor}
          taskCount={taskCount}
        />
      );
  }
}
