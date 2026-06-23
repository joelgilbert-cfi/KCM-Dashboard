import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    const {
      data: { user: requestingAuthUser },
    } = await authClient.auth.getUser();

    if (!requestingAuthUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = (await request.json()) as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === requestingAuthUser.id) {
      return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: requestingProfile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', requestingAuthUser.id)
      .is('deleted_at', null)
      .single();

    if (profileError || requestingProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can remove users' }, { status: 403 });
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: markDeletedError } = await adminClient
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (markDeletedError) {
      return NextResponse.json({ error: markDeletedError.message }, { status: 500 });
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      await adminClient.from('users').update({ deleted_at: null }).eq('id', userId);
      return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}
