import type { User } from '@supabase/supabase-js';

const STATIC_ADMIN_EMAILS = [
  'rmfpdlxm2005@naver.com',
  'sadjkasdn@proton.me',
];

const ADMIN_EMAILS = Array.from(
  new Set([
    ...STATIC_ADMIN_EMAILS,
    ...(process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ])
);

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

const ADMIN_STATUS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-status`
  : '';
const ADMIN_API_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function invokeAdminStatus(accessToken?: string | null) {
  if (!ADMIN_STATUS_URL || !ADMIN_API_KEY || !accessToken) {
    return {
      ok: false,
      response: null as Response | null,
      data: null as any,
      errorBody: null as any,
      error: new Error('Missing admin function request prerequisites.'),
    };
  }

  try {
    const response = await fetch(ADMIN_STATUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ADMIN_API_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    const contentType = response.headers.get('Content-Type') ?? '';
    const parsed = contentType.includes('application/json')
      ? await response.clone().json().catch(() => null)
      : null;

    return {
      ok: response.ok,
      response,
      data: response.ok ? parsed : null,
      errorBody: response.ok ? null : parsed,
      error: response.ok ? null : new Error((parsed as any)?.error ?? `Admin request failed with ${response.status}`),
    };
  } catch (error) {
    return {
      ok: false,
      response: null as Response | null,
      data: null as any,
      errorBody: null as any,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
