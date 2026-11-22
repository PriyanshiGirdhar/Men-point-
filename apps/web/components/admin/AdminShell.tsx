'use client';

import { useAdminGuard } from '@/lib/use-auth-guard';
import { AdminSidebar } from './AdminSidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready } = useAdminGuard();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-sm text-charcoal-400">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-cream">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
