'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';

/**
 * Hook to get the current authenticated user and their role.
 * Returns user data from the `users` table (not just auth).
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch full user record from the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email!)
        .single();

      if (error || !data) {
        // If user doesn't exist in our users table yet, create a basic record
        console.warn('User not found in users table:', authUser.email);
        setUser({
          id: authUser.id,
          name: authUser.email?.split('@')[0] || 'Unknown',
          email: authUser.email || '',
          role: 'expansion', // Default role
          created_at: new Date().toISOString(),
        });
      } else {
        setUser(data as User);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUser, supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signOut, refetch: fetchUser };
}
