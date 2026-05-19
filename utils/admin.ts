import type { User } from '@supabase/supabase-js';

const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function hasAdminConfig() {
  return ADMIN_EMAILS.length > 0;
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function canAccessAdmin(user: Pick<User, 'email'> | null | undefined) {
  return isAdminEmail(user?.email ?? null);
}
