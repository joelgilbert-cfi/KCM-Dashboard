'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    const isRecovery = hash.get('type') === 'recovery';
    const recoveryError =
      hash.get('error_description') ||
      search.get('error_description') ||
      search.get('error_code');

    if (recoveryError) {
      router.replace('/login?error=recovery_link_expired');
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (isRecovery && session)) {
        router.replace('/update-password');
      }
    });

    async function routeFromSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isRecovery && session) {
        router.replace('/update-password');
        return;
      }

      if (!isRecovery) {
        router.replace(session ? '/dashboard' : '/login');
      }
    }

    routeFromSession();

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  );
}
