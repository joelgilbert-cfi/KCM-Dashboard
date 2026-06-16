import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';

interface ContactSuggestion {
  label: string;
  value: string;
  name: string;
  email: string;
  source: 'user' | 'contact';
}

const normalize = (value: string) => value.trim().toLowerCase();

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // This read-only route does not need to refresh auth cookies.
        },
      },
    }
  );

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = normalize(url.searchParams.get('q') || '');

  if (query.length === 0) {
    return NextResponse.json({ contacts: [] });
  }

  const supabase = createAdminClient();
  const pattern = `%${query}%`;

  const [{ data: users }, { data: contacts }] = await Promise.all([
    supabase
      .from('users')
      .select('name, email')
      .or(`name.ilike.${pattern},email.ilike.${pattern}`)
      .order('name', { ascending: true })
      .limit(15),
    supabase
      .from('email_contacts')
      .select('name, email')
      .or(`name.ilike.${pattern},email.ilike.${pattern}`)
      .order('name', { ascending: true })
      .limit(15),
  ]);

  const deduped = new Map<string, ContactSuggestion>();

  for (const contact of users ?? []) {
    if (!contact.email) continue;
    const email = normalize(contact.email);
    deduped.set(email, {
      label: contact.name ? `${contact.name} <${contact.email}>` : contact.email,
      value: contact.email,
      name: contact.name || contact.email,
      email: contact.email,
      source: 'user',
    });
  }

  for (const contact of contacts ?? []) {
    if (!contact.email) continue;
    const email = normalize(contact.email);
    if (deduped.has(email)) continue;
    deduped.set(email, {
      label: contact.name ? `${contact.name} <${contact.email}>` : contact.email,
      value: contact.email,
      name: contact.name || contact.email,
      email: contact.email,
      source: 'contact',
    });
  }

  return NextResponse.json({ contacts: Array.from(deduped.values()).slice(0, 15) });
}

