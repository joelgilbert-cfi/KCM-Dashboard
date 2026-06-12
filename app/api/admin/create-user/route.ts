import { createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body as {
      name: string;
      email: string;
      password: string;
      role: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (!['finance', 'expansion', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    // Insert into users table
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role,
    });

    if (dbError) {
      // Rollback: delete auth user if DB insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
