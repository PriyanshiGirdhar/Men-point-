'use client';

import { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { AdminStats } from '@/lib/types';
import { StatCard } from '@/components/admin/StatCard';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/StatusBadge';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<AdminStats>('/admin/stats')
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load stats'));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-wide mb-6">Dashboard</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {!stats && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-charcoal-200 animate-pulse" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Orders" value={String(stats.totalOrders)} />
            <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} />
            <StatCard label="Total Users" value={String(stats.totalUsers)} />
            <StatCard label="Total Products" value={String(stats.totalProducts)} />
          </div>

          <h2 className="font-display text-xl uppercase tracking-wide mb-4">Recent Orders</h2>
          <div className="bg-white border border-charcoal-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wider text-charcoal-400">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-charcoal-400">
                      No orders yet.
                    </td>
                  </tr>
                )}
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-charcoal-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-charcoal-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
