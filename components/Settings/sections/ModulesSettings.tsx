'use client';

import { useState, useEffect } from 'react';
import { SettingsSection } from '../SettingsSection';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleConfig } from '@/types/modules';
import { getAllModuleDefinitions, getModuleDefinition } from '@/lib/modules/moduleRegistry';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { GripVertical, Edit2, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export function ModulesSettings() {
  const { moduleConfigs: contextModuleConfigs, setModuleConfigs: saveModuleConfigs } = useSettings();
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>([]);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    // Ensure all modules from registry are in configs (migration for new modules)
    const allModuleIds = getAllModuleDefinitions().map(def => def.id);
    const existingIds = new Set(contextModuleConfigs.map(c => c.id));
    const missingModules = allModuleIds
      .filter(id => !existingIds.has(id))
      .map((id, index) => ({
        id: id as ModuleConfig['id'],
        enabled: false,
        order: contextModuleConfigs.length + index,
      }));
    
    if (missingModules.length > 0) {
      const updated = [...contextModuleConfigs, ...missingModules];
      setModuleConfigs(updated);
      saveModuleConfigs(updated);
    } else {
      // Filter out any modules that no longer exist in registry
      const validConfigs = contextModuleConfigs.filter(c => allModuleIds.includes(c.id));
      setModuleConfigs(validConfigs);
    }
  }, [contextModuleConfigs, saveModuleConfigs]);

  const handleToggleModule = (moduleId: string) => {
    const updated = moduleConfigs.map(config => 
      config.id === moduleId 
        ? { ...config, enabled: !config.enabled }
        : config
    );
    setModuleConfigs(updated);
    saveModuleConfigs(updated);
  };

  const handleStartEditing = (moduleId: string) => {
    const config = moduleConfigs.find(c => c.id === moduleId);
    if (config) {
      setEditingModule(moduleId);
      setEditingName(config.customName || getModuleDefinition(moduleId as any)?.name || '');
    }
  };

  const handleSaveEdit = (moduleId: string) => {
    const updated = moduleConfigs.map(config => 
      config.id === moduleId 
        ? { ...config, customName: editingName.trim() || undefined }
        : config
    );
    setModuleConfigs(updated);
    saveModuleConfigs(updated);
    setEditingModule(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingModule(null);
    setEditingName('');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...moduleConfigs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((config, i) => {
      config.order = i;
    });
    setModuleConfigs(updated);
    saveModuleConfigs(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === moduleConfigs.length - 1) return;
    const updated = [...moduleConfigs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((config, i) => {
      config.order = i;
    });
    setModuleConfigs(updated);
    saveModuleConfigs(updated);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(moduleConfigs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((config, index) => {
      config.order = index;
    });

    setModuleConfigs(items);
    saveModuleConfigs(items);
  };

  const sortedConfigs = [...moduleConfigs].sort((a, b) => a.order - b.order);

  return (
    <SettingsSection
      title="Modules"
      description="Customize which productivity modules are visible and their order."
    >
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground font-mono mb-4">
          Drag modules to reorder, or use the arrows to move them up/down. Enabled modules appear in the productivity section.
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {sortedConfigs.map((config, index) => {
                  const definition = getModuleDefinition(config.id);
                  if (!definition) return null;

                  const displayName = config.customName || definition.name;
                  const isEditing = editingModule === config.id;

                  return (
                    <Draggable key={config.id} draggableId={config.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'flex items-center gap-3 p-3 border border-border rounded-lg bg-background',
                            snapshot.isDragging && 'shadow-lg opacity-90',
                            !config.enabled && 'opacity-60'
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(config.id);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="h-8 text-sm font-mono"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveEdit(config.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {definition.defaultIcon && (
                                  <definition.defaultIcon className="w-4 h-4 text-muted-foreground" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-medium">{displayName}</span>
                                    {definition.comingSoon && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                                        Coming Soon
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {definition.description}
                                  </div>
                                </div>
                                {definition.canRename && !definition.comingSoon && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleStartEditing(config.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="h-7 w-7 p-0"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === sortedConfigs.length - 1}
                              className="h-7 w-7 p-0"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Switch
                              checked={config.enabled}
                              onCheckedChange={() => handleToggleModule(config.id)}
                              disabled={!definition.canDisable || definition.comingSoon}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </SettingsSection>
  );
}
