import { getSession } from "../../storage/storage";

/**
 * Renders `children` only when a valid session exists.
 * Otherwise renders `fallback` (the auth screens).
 * Re-checks localStorage on every render so manual session
 * deletion is caught without a full page reload.
 */
export function ProtectedRoute({ children, fallback }) {
  const session = getSession();
  if (!session) return fallback;
  return children;
}
