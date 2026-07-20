/**
 * Single source of truth for backend API configuration.
 * Never hardcode the backend URL in components — import from here.
 */
const DEFAULT_BASE_URL = "http://localhost:8000";

/** Base URL of the Python FastAPI backend (no trailing slash). */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL
).replace(/\/+$/, "");

/**
 * When "true", the app uses built-in demo data instead of calling the backend.
 * Useful for demonstrating the UI without running the Python service.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** Build a full API URL for a given path. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
