import { useEffect, useState } from 'react';

/** Winziger Router: reicht für die vier Seiten und spart eine Abhängigkeit. */
export function navigate(path: string, replace = false) {
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function getQueryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}
