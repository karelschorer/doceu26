import { useState, useEffect } from 'react';

/**
 * Reactive mobile breakpoint hook.
 * Replaces the static `window.innerWidth < 768` check with a proper
 * resize-aware hook that updates on window size changes.
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { isMobile };
}
