'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestWarningBannerProps {
  onSignUpClick: () => void;
}

export function GuestWarningBanner({ onSignUpClick }: GuestWarningBannerProps) {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show if user is logged in, banner dismissed, or auth still loading
  if (!mounted || loading || user || dismissed) {
    return null;
  }

  return (
    <div className={cn(
      "border-b border-border/50 bg-muted/30 backdrop-blur-sm",
      "animate-in fade-in slide-in-from-top duration-300"
    )}>
      <div className="max-w-7xl mx-auto px-6 py-2.5">
        <div className="flex items-center justify-center gap-4 relative">
          <div className="flex items-center justify-center gap-2.5">
            <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Guest mode</span>
              <span className="mx-1.5">•</span>
              <span>Tasks are stored locally only</span>
              <span className="mx-1.5">•</span>
              <button
                onClick={onSignUpClick}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
              {' '}to sync across devices
            </p>
          </div>
          
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

