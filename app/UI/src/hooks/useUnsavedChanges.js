/**
 * useUnsavedChanges Hook
 * Manages unsaved changes state, auto-save, and unload warnings
 *
 * Features:
 * - Auto-save with debounce
 * - beforeunload warning
 * - Loading/saving state tracking
 * - Last saved timestamp
 *
 * Usage:
 * const { isSaving, lastSaved } = useUnsavedChanges(
 *   isDirty,
 *   async () => {
 *     await apiClient.put('/api/content', { ...data });
 *   },
 *   30000 // 30 second auto-save interval
 * );
 */

import { useEffect, useRef, useState } from 'react';

export function useUnsavedChanges(
  isDirty,
  onSave = async () => {},
  autosaveInterval = 30000,
  warningMessage = 'You have unsaved changes. Are you sure you want to leave?'
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const timerRef = useRef(null);

  // Auto-save logic
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsSaving(true);

    // Debounce the save
    timerRef.current = setTimeout(async () => {
      try {
        await onSave();
        setLastSaved(new Date());
        setSaveError(null);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveError(error.message || 'Failed to auto-save');
      } finally {
        setIsSaving(false);
      }
    }, autosaveInterval);

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, onSave, autosaveInterval]);

  // beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && isSaving === false) {
        e.preventDefault();
        e.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSaving, warningMessage]);

  return {
    isSaving,
    lastSaved,
    saveError,
    hasSaveError: !!saveError
  };
}

export default useUnsavedChanges;
