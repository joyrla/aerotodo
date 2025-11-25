'use client';

import { useState, useEffect } from 'react';
import { SettingsSection } from '../SettingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { profileStorage } from '@/lib/utils/storage';
import type { Profile, TaskColor } from '@/types';
import { cn } from '@/lib/utils';

const PROFILE_ICONS = ['◯', '◻', '△', '◇', '◈', '⬡', '⬢', '⬣', '★', '☆', '♠', '♣', '♥', '♦'];
const PROFILE_COLORS: { id: TaskColor; label: string; class: string }[] = [
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'green', label: 'Green', class: 'bg-green-500' },
  { id: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { id: 'red', label: 'Red', class: 'bg-red-500' },
  { id: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { id: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { id: 'teal', label: 'Teal', class: 'bg-teal-500' },
];

export function ProfilesSettings() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    icon: string;
    color: TaskColor;
  }>({
    name: '',
    icon: '◯',
    color: 'blue',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    setProfiles(profileStorage.getProfiles());
    setCurrentProfileId(profileStorage.getCurrentProfile());
  };

  const handleAddProfile = () => {
    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      createdAt: new Date().toISOString(),
    };

    profileStorage.addProfile(newProfile);
    loadProfiles();
    setIsAddDialogOpen(false);
    setFormData({ name: '', icon: '◯', color: 'blue' });
  };

  const handleEditProfile = () => {
    if (!editingProfile) return;

    profileStorage.updateProfile(editingProfile.id, {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
    });

    loadProfiles();
    setIsEditDialogOpen(false);
    setEditingProfile(null);
    setFormData({ name: '', icon: '◯', color: 'blue' });
  };

  const handleDeleteProfile = () => {
    if (!deletingProfile) return;

    profileStorage.deleteProfile(deletingProfile.id);
    loadProfiles();
    setIsDeleteDialogOpen(false);
    setDeletingProfile(null);
  };

  const openEditDialog = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      icon: profile.icon,
      color: profile.color,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (profile: Profile) => {
    setDeletingProfile(profile);
    setIsDeleteDialogOpen(true);
  };

  const handleSetCurrentProfile = (profileId: string) => {
    profileStorage.setCurrentProfile(profileId);
    setCurrentProfileId(profileId);
    // Optionally reload to apply changes
    window.location.reload();
  };

  return (
    <>
      <SettingsSection
        title="Profile Management"
        description="Create and manage multiple profiles for different contexts (work, personal, school, etc.)"
      >
        <div className="space-y-4">
          {/* Add Profile Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-mono">
              {profiles.length} profile{profiles.length !== 1 ? 's' : ''} created
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Profile
            </Button>
          </div>

          {/* Profiles List */}
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                  'hover:border-foreground/20 hover:shadow-sm',
                  currentProfileId === profile.id
                    ? 'border-primary bg-accent/50'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">{profile.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-medium flex items-center gap-2">
                      {profile.name}
                      {currentProfileId === profile.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Created {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {currentProfileId !== profile.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetCurrentProfile(profile.id)}
                      className="h-8 px-3 text-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Switch
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(profile)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {profiles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(profile)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              💡 Tip: Each profile can have its own tasks, projects, and settings. Use profiles to separate work, personal, and other contexts.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Add Profile Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-mono">Create New Profile</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Create a new profile for a different context or workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-xs">Profile Name</Label>
              <Input
                id="name"
                placeholder="e.g., Work, Personal, School"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Icon</Label>
              <div className="grid grid-cols-7 gap-2">
                {PROFILE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      'aspect-square rounded-lg border-2 transition-all duration-200',
                      'hover:border-foreground/40 hover:scale-110',
                      'flex items-center justify-center text-xl',
                      formData.icon === icon
                        ? 'border-primary bg-accent shadow-sm scale-105'
                        : 'border-border'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setFormData({ ...formData, color: color.id })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200',
                      'hover:border-foreground/40',
                      formData.color === color.id
                        ? 'border-primary bg-accent shadow-sm'
                        : 'border-border'
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded-full', color.class)} />
                    <span className="text-xs font-mono">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormData({ name: '', icon: '◯', color: 'blue' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProfile}
              disabled={!formData.name.trim()}
            >
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Profile</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Modify the profile name, icon, or color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-mono text-xs">Profile Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Work, Personal, School"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Icon</Label>
              <div className="grid grid-cols-7 gap-2">
                {PROFILE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      'aspect-square rounded-lg border-2 transition-all duration-200',
                      'hover:border-foreground/40 hover:scale-110',
                      'flex items-center justify-center text-xl',
                      formData.icon === icon
                        ? 'border-primary bg-accent shadow-sm scale-105'
                        : 'border-border'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs">Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setFormData({ ...formData, color: color.id })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200',
                      'hover:border-foreground/40',
                      formData.color === color.id
                        ? 'border-primary bg-accent shadow-sm'
                        : 'border-border'
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded-full', color.class)} />
                    <span className="text-xs font-mono">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingProfile(null);
                setFormData({ name: '', icon: '◯', color: 'blue' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProfile}
              disabled={!formData.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Profile Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-mono">Delete Profile</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Are you sure you want to delete the profile "{deletingProfile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
              <div className="text-2xl">{deletingProfile?.icon}</div>
              <div>
                <div className="font-mono font-medium">{deletingProfile?.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Created {deletingProfile && new Date(deletingProfile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingProfile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
            >
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
