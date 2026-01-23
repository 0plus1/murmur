import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '@/hooks/useAutosave';
import { countWords } from '@/lib/markdown';

describe('useAutosave', () => {
  it('debounces saves and calls persistence after delay', async () => {
    vi.useFakeTimers();
    const onUpdateContent = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onWordCount = vi.fn();
    const onLastSaved = vi.fn();

    const { result } = renderHook(() =>
      useAutosave({
        onUpdateContent,
        onSave,
        countWords,
        onWordCount,
        onLastSaved,
        delayMs: 2000,
      })
    );

    act(() => {
      result.current.handleContentChange('Hello world');
      result.current.handleContentChange('Hello world again');
    });

    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onUpdateContent).toHaveBeenCalled();
    expect(onWordCount).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onLastSaved).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
