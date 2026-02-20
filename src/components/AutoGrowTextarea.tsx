import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AutoGrowTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  onSubmit?: () => void;
}

/**
 * A textarea that auto-grows with content up to maxRows,
 * and submits on Enter (Shift+Enter for new line).
 */
export const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
  ({ className, maxRows = 4, onSubmit, onChange, value, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref]
    );

    // Resize on value change
    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
      const maxHeight = lineHeight * maxRows + 16; // 16px padding
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    }, [value, maxRows]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
      }
    };

    return (
      <textarea
        ref={setRef}
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto',
          className
        )}
        {...props}
      />
    );
  }
);

AutoGrowTextarea.displayName = 'AutoGrowTextarea';
