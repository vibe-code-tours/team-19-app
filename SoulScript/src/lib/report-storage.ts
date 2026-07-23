const STORAGE_KEY_PREFIX = "soulscript_moment_";

/**
 * Save the moment reflection for a given month to localStorage.
 */
export function saveMomentReflection(month: string, reflection: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + month, reflection);
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Load the cached moment reflection for a given month from localStorage.
 * Returns null if nothing found.
 */
export function loadMomentReflection(month: string): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + month);
  } catch {
    return null;
  }
}
