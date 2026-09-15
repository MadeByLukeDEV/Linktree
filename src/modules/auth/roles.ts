// Two roles exist beyond BetterAuth's admin-plugin default ("user", which
// nothing here ever creates -- there's no public sign-up path):
//   - "admin": the site owner. Full access, incl. Profile (public
//     display name/bio/avatar).
//   - "moderator": can manage Links, and their own passkeys (inherently
//     scoped per-session by BetterAuth already -- see PasskeyManager), but
//     not Profile.
// Both roles get dashboard access; only "admin" gets Profile.
export const ADMIN_ROLE = "admin";
export const MODERATOR_ROLE = "moderator";

export function canAccessDashboard(role: string | null | undefined) {
  return role === ADMIN_ROLE || role === MODERATOR_ROLE;
}

export function isAdmin(role: string | null | undefined) {
  return role === ADMIN_ROLE;
}
