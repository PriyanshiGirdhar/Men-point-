'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus, OrderSummary, Paginated } from '@/lib/types';
import { Pagination } from '@/components/ui/Pagination';
import { OrderStatusBadge, PaymentStatusBadge, ORDER_STATUS_OPTIONS } from '@/components/ui/StatusBadge';

const LIMIT = 20;

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [data, setData] = useState<Paginated<OrderSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    apiGet<Paginated<OrderSummary>>('/admin/orders', {
      page,
      limit: LIMIT,
      status: status === 'ALL' ? undefined : status,
    })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load orders'));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    setUpdating(orderId);
    try {
      await apiPatch(`/admin/orders/${orderId}/status`, { status: nextStatus });
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)) }
          : prev
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl uppercase tracking-wide">Orders</h1>
        <select
          className="input-field w-48"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as OrderStatus | 'ALL');
          }}
        >
          <option value="ALL">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white border border-charcoal-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wider text-charcoal-400">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
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
                  No orders found.
                </td>
              </tr>
            )}
            {data?.items.map((order) => (
              <tr key={order.id} className="border-b border-charcoal-100 last:border-0">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3 text-charcoal-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <select
                      className="text-xs border border-charcoal-200 px-1.5 py-1"
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={setPage} />}
    </div>
  );
}
