'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import type { Paginated, User } from '@/lib/types';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';

const LIMIT = 20;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    apiGet<Paginated<User>>('/admin/users', { page, limit: LIMIT, q })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load users'));
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-wide mb-6">Users</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(queryInput);
        }}
        className="mb-4 max-w-sm"
      >
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search users…"
          className="input-field"
        />
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white border border-charcoal-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wider text-charcoal-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Onboarded</th>
            </tr>
          </thead>
          <tbody>
            {!data && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-charcoal-400">
                  Loading…
                </td>
              </tr>
            )}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-charcoal-400">
                  No users found.
                </td>
              </tr>
            )}
            {data?.items.map((user) => (
              <tr key={user.id} className="border-b border-charcoal-100 last:border-0">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-charcoal-500">{user.email}</td>
                <td className="px-4 py-3 text-charcoal-500">{user.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-semibold uppercase',
                      user.role === 'ADMIN' ? 'bg-mustard-100 text-mustard-800' : 'bg-charcoal-100 text-charcoal-600'
                    )}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{user.onboarded ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />}
    </div>
  );
}
