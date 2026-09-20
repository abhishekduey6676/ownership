import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/** Session credentials never enter browser JavaScript. No privileged key is used. */
export async function sessionClient(allowNewSession: boolean) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Configure Supabase in web/.env.local and enable anonymous sign-ins for AI usage checks.');
  if (!key.startsWith('sb_publishable_')) throw new Error('Use a Supabase publishable key (sb_publishable_), never a secret or service-role key.');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const jar = await cookies();
  const access = jar.get('ownership-access')?.value;
  const refresh = jar.get('ownership-refresh')?.value;
  const result = access && refresh
    ? await client.auth.setSession({ access_token: access, refresh_token: refresh })
    : allowNewSession && !access && !refresh
      ? await client.auth.signInAnonymously()
      : null;
  if (!result || result.error || !result.data.session) {
    throw new Error('Could not restore your analysis session. Retry or check Supabase Auth settings.');
  }
  const session = result.data.session;
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 };
  jar.set('ownership-access', session.access_token, options);
  jar.set('ownership-refresh', session.refresh_token, options);
  return { client, ownerId: session.user.id };
}
