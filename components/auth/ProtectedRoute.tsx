'use client';

import { useAuth } from '@/lib/contexts/AuthContext';

// Auth is now optional - users can use the app without signing up
// but they'll be warned that tasks won't be saved permanently

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  // Allow access regardless of auth state
  if (!loading) {
    return <>{children}</>;
  }

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
