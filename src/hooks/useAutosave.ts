import { useCallback, useEffect, useRef } from 'react';

type AutosaveOptions = {
  onUpdateContent: (content: string) => void;
  onSave: () => Promise<void> | void;
  countWords: (content: string) => number;
  onWordCount?: (count: number) => void;
  onLastSaved?: (date: Date) => void;
  delayMs?: number;
};

export function useAutosave({
  onUpdateContent,
  onSave,
  countWords,
  onWordCount,
  onLastSaved,
  delayMs = 2000,
}: AutosaveOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentChange = useCallback(
    (content: string) => {
      onUpdateContent(content);
      if (onWordCount) {
        onWordCount(countWords(content));
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        await onSave();
        if (onLastSaved) {
          onLastSaved(new Date());
        }
      }, delayMs);
    },
    [countWords, delayMs, onLastSaved, onSave, onUpdateContent, onWordCount]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { handleContentChange };
}
