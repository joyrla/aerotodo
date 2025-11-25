'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      const isInput = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Allow some shortcuts even in inputs (like Escape, Cmd+K, Cmd+F)
      const allowedInInputs = ['Escape', 'k', 'f', 'K', 'F'];
      const isAllowedInInput = allowedInInputs.includes(event.key) && (event.metaKey || event.ctrlKey || event.key === 'Escape');

      if (isInput && !isAllowedInInput) {
        return;
      }

      for (const shortcut of shortcuts) {
        const cmdMatch = shortcut.cmd ? (event.metaKey || event.ctrlKey) : !event.metaKey && !event.ctrlKey;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && cmdMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Hook for detecting key combinations dynamically
export function useKeyPress(targetKey: string, callback: () => void, options?: {
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
}) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger in inputs unless it's a special key
      const target = event.target as HTMLElement;
      const isInput = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      if (isInput && !['Escape'].includes(event.key)) {
        return;
      }

      const keyMatch = event.key.toLowerCase() === targetKey.toLowerCase();
      const cmdMatch = options?.cmd ? (event.metaKey || event.ctrlKey) : true;
      const ctrlMatch = options?.ctrl ? event.ctrlKey : true;
      const shiftMatch = options?.shift ? event.shiftKey : true;
      const altMatch = options?.alt ? event.altKey : true;

      if (keyMatch && cmdMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [targetKey, callback, options]);
}

