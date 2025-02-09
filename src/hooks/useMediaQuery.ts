import { useState, useEffect } from 'react';

type MediaQueryKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'portrait' | 'landscape';

const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)'
};

export function useMediaQuery(query: MediaQueryKey | string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(BREAKPOINTS[query as MediaQueryKey] || query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy API
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}