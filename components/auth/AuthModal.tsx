'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Mail, Lock, Chrome, ArrowRight, Calendar, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/supabase/client';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'signup';
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Update mode when defaultMode prop changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await auth.signInWithGoogle();
      
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google');
        setIsLoading(false);
      } else {
        toast.success('Redirecting to Google...');
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        const { error } = await auth.signUp(email, password);
        
        if (error) {
          toast.error(error.message || 'Failed to create account');
        } else {
          toast.success('Account created! Check your email to confirm.');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setTimeout(() => {
            setMode('login');
          }, 2000);
        }
      } else {
        const { error } = await auth.signIn(email, password);
        
        if (error) {
          toast.error(error.message || 'Failed to sign in');
        } else {
          toast.success('Signed in successfully');
          onOpenChange(false);
          router.push('/calendar');
        }
      }
    } catch (error) {
      toast.error(mode === 'signup' ? 'Failed to create account' : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }

    try {
      const { error } = await auth.resetPassword(email);
      
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' 
                ? 'Sign in to continue' 
                : 'Start organizing your tasks today'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-medium text-foreground">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-10 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              )}
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-10 text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-sm font-medium group"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className={cn(
              "w-full h-10 text-sm font-medium",
              "bg-background hover:bg-accent",
              "border-2 border-border hover:border-primary/50",
              "text-foreground",
              "transition-all duration-200",
              "group"
            )}
            variant="outline"
          >
            <Chrome className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
            Continue with Google
          </Button>

          {mode === 'signup' && (
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-primary font-medium">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-primary font-medium">Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

