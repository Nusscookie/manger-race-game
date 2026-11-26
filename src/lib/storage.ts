/** localStorage kann in privaten Fenstern o. Ä. fehlen oder werfen – darum alles in try/catch. */

export function loadJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* egal – dann eben ohne Wiedereinstieg */
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignorieren */
  }
}

/** Pro Browser-Tab (übersteht Neuladen, aber nicht das Schließen des Tabs). */
export function loadSessionJSON<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveSessionJSON(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignorieren */
  }
}

export function removeSessionKey(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignorieren */
  }
}
