import { useRef, useCallback, useEffect } from 'react';

/**
 * Smart auto-scroll hook — scrolls to bottom when user is near the end,
 * but does NOT force scroll when user is reading older messages.
 */
export function useSmartScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const THRESHOLD = 120; // px from bottom to consider "near end"

  const checkIfNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Whenever deps change, auto-scroll only if user was near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      // Small delay to let DOM update
      requestAnimationFrame(() => scrollToBottom('smooth'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Force scroll (e.g., when user sends a message)
  const forceScrollToBottom = useCallback(() => {
    isNearBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [scrollToBottom]);

  return {
    containerRef,
    checkIfNearBottom,
    forceScrollToBottom,
    scrollToBottom,
  };
}
