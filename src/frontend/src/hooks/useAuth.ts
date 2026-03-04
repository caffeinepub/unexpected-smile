/**
 * Admin auth hook — pure localStorage session.
 * The II identity is still used internally by useActor for anonymous reads,
 * but the admin UI gate is purely the hardcoded credential check + localStorage flag.
 */

const ADMIN_SESSION_KEY = "us_admin_session";

export function useAuth() {
  // Check if admin session is active
  const isAuthenticated = localStorage.getItem(ADMIN_SESSION_KEY) === "true";

  const login = () => {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  return {
    login,
    logout,
    isAuthenticated,
    isLoading: false,
    loginStatus: isAuthenticated ? ("success" as const) : ("idle" as const),
    identity: null,
  };
}
