// Roles come from the central auth service (auth.aboutselphy.com), which
// derives them from the user's Discord server roles on every sign-in -- this
// app never assigns them:
//   - "admin": the site owner. Full access, incl. Profile (public
//     display name/bio/avatar) and Twitch diagnostics.
//   - "moderator": can manage Links, but not Profile.
// Both roles get dashboard access; only "admin" gets Profile.
export const ADMIN_ROLE = "admin";
export const MODERATOR_ROLE = "moderator";

export type StaffRole = typeof ADMIN_ROLE | typeof MODERATOR_ROLE;

export function canAccessDashboard(role: string | null | undefined) {
  return role === ADMIN_ROLE || role === MODERATOR_ROLE;
}

export function isAdmin(role: string | null | undefined) {
  return role === ADMIN_ROLE;
}
