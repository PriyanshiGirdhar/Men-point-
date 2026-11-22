'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Users', href: '/admin/users' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <aside className="w-60 shrink-0 bg-charcoal-900 text-cream flex flex-col">
      <div className="px-5 py-6 border-b border-charcoal-700">
        <span className="font-display text-lg uppercase tracking-widest">Clothify Admin</span>
      </div>

      <nav className="flex-1 py-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-5 py-2.5 text-sm font-medium tracking-wide',
              isActive(item.href)
                ? 'bg-mustard-400 text-charcoal-900'
                : 'text-cream/70 hover:bg-charcoal-800 hover:text-cream'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-charcoal-700 space-y-2">
        <p className="text-xs text-cream/50 truncate">{user?.name}</p>
        <Link href="/" className="block text-xs text-cream/70 hover:text-mustard-300">
          ← Back to store
        </Link>
        <button onClick={handleLogout} className="text-xs text-cream/70 hover:text-mustard-300">
          Log out
        </button>
      </div>
    </aside>
  );
}
