'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Men', href: '/men', gender: 'MEN' },
  { label: 'Women', href: '/women', gender: 'WOMEN' },
  { label: 'Kids', href: '/kids', gender: 'KIDS' },
];

export function Header({ categories }: { categories: Category[] }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');

  async function handleLogout() {
    setAccountOpen(false);
    await logout();
    router.push('/');
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/category/all?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const byGender = (gender: string) =>
    categories.filter((c) => !c.gender || c.gender === gender || c.gender === 'UNISEX');

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-charcoal-200">
      <div className="container flex items-center gap-4 py-4">
        <button
          className="lg:hidden p-2 -ml-2"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <BarsIcon />
        </button>

        <Link href="/" className="font-display text-2xl md:text-3xl font-bold tracking-widest uppercase shrink-0">
          Clothify
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {NAV.map((item) => (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => setOpenMenu(item.href)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                href={item.href}
                className="px-3 py-2 text-sm font-semibold uppercase tracking-wider hover:text-mustard-600 transition-colors"
              >
                {item.label}
              </Link>
              {openMenu === item.href && byGender(item.gender).length > 0 && (
                <div className="absolute left-0 top-full w-64 bg-white shadow-xl border border-charcoal-100 py-3 z-50">
                  {byGender(item.gender).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-mustard-50 hover:text-mustard-700"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands..."
            className="w-full border border-charcoal-200 bg-white pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mustard-400"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Search">
            <SearchIcon />
          </button>
        </form>

        <div className="flex items-center gap-4 ml-auto">
          <select
            className="hidden md:block text-xs border-none bg-transparent font-medium cursor-pointer focus:outline-none"
            defaultValue="en"
            aria-label="Language"
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
          </select>
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <button
                className="p-1"
                aria-label="Account menu"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <UserIcon />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full w-48 bg-white shadow-xl border border-charcoal-100 py-2 z-50">
                  <div className="px-4 py-2 text-xs text-charcoal-500 truncate">{user.name}</div>
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm hover:bg-mustard-50 hover:text-mustard-700"
                    onClick={() => setAccountOpen(false)}
                  >
                    My Account
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm hover:bg-mustard-50 hover:text-mustard-700"
                      onClick={() => setAccountOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-mustard-50 hover:text-mustard-700"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="p-1" aria-label="Account">
              <UserIcon />
            </Link>
          )}
          <Link href="/cart" className="relative p-1" aria-label="Cart">
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-mustard-400 text-charcoal-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className={cn('lg:hidden border-t border-charcoal-200', mobileOpen ? 'block' : 'hidden')}>
        <form onSubmit={submitSearch} className="px-4 pt-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="input-field"
          />
        </form>
        <nav className="flex flex-col py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2.5 text-sm font-semibold uppercase tracking-wider"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function BarsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h9.2a2 2 0 002-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
