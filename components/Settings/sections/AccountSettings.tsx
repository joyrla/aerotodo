'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsSection } from '../SettingsSection';
import { User, Lock, Globe, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export function AccountSettings() {
  const { user, signOut, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // Get name from various possible metadata fields (Google, email signup, etc.)
      const name = user.user_metadata?.full_name 
        || user.user_metadata?.name 
        || user.user_metadata?.display_name
        || user.email?.split('@')[0] // Fallback to email username
        || '';
      setDisplayName(name);
    } else {
      // Reset if no user (logged out)
      setEmail('');
      setDisplayName('');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
      
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <SettingsSection
        title="Account"
        description="Manage your account settings and preferences"
      >
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Account"
      description="Manage your account settings and preferences"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-mono font-medium">Profile</h3>
          
          <div className="space-y-2">
            <Label className="text-sm font-mono">Display Name</Label>
            <div className="flex gap-2">
            <Input
                placeholder={user ? "Your name" : "Not logged in"}
              className="font-mono"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!user}
              />
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isLoading || !displayName || displayName === (user?.user_metadata?.full_name || '') || !user}
                size="sm"
                variant="outline"
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              This name appears in your calendar
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-mono">Email</Label>
            <Input
              type="email"
              placeholder={user ? "your@email.com" : "Not logged in"}
              className="font-mono"
              value={email}
              readOnly
              disabled
            />
            <p className="text-xs text-muted-foreground font-mono">
              Used for notifications and account recovery
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-mono font-medium mb-3">Security</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start font-mono" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Change Password (Coming soon)
            </Button>
            <Button variant="outline" className="w-full justify-start font-mono" disabled>
              <Globe className="w-4 h-4 mr-2" />
              Two-Factor Authentication (Coming soon)
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-mono font-medium mb-3">Account Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start font-mono" disabled>
              <Bell className="w-4 h-4 mr-2" />
              Manage Subscriptions
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start font-mono text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut()}
              disabled={!user}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
