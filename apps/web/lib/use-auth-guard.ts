'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';

/** Redirects to /login?next=<current path> when not authenticated. */
export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
    }
  }, [loading, user, router, pathname]);

  return { user, loading, ready: !loading && !!user };
}

/** Redirects non-admins away from /admin/*. */
export function useAdminGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  return { user, loading, ready: !loading && !!user && user.role === 'ADMIN' };
}
