'use client';

import { useEffect } from 'react';
import { applyTheme, getCurrentTheme } from '@/lib/utils/themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved theme on mount
    const savedTheme = getCurrentTheme();
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(savedTheme, isDark ? 'dark' : 'light');

    // Listen for theme changes (light/dark mode toggle)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          const currentTheme = getCurrentTheme();
          applyTheme(currentTheme, isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}

