'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { apiGet } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';
import { PaymentStatusBadge } from '@/components/ui/StatusBadge';

const STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { ready } = useAuthGuard();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!ready) return;
    apiGet<Order>(`/orders/${params.id}`)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [ready, params.id]);

  if (!ready || !order) {
    return <div className="container py-24 text-center text-charcoal-400">Loading order…</div>;
  }

  const currentStepIndex = STEPS.indexOf(order.status);

  return (
    <div className="container py-10 max-w-3xl">
      <Link href="/account" className="text-sm underline text-charcoal-500">
        &larr; Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-8">
        <div>
          <h1 className="section-heading">{order.orderNumber}</h1>
          <p className="text-sm text-charcoal-400">
            Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      {order.status === 'CANCELLED' ? (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-10 text-sm font-semibold uppercase tracking-wide">
          Order Cancelled
        </div>
      ) : (
        <div className="flex items-center mb-12">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    i <= currentStepIndex ? 'bg-charcoal-900 text-cream' : 'bg-charcoal-100 text-charcoal-400'
                  )}
                >
                  {i + 1}
                </div>
                <span className="text-xs mt-2 uppercase tracking-wide text-charcoal-500">{step}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2', i < currentStepIndex ? 'bg-charcoal-900' : 'bg-charcoal-100')} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-sm">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Delivery Address</h3>
          <p>{order.address.fullName}</p>
          <p className="text-charcoal-500">
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city}, {order.address.state}{' '}
            {order.address.postalCode}, {order.address.country}
          </p>
          <p className="text-charcoal-500">{order.address.phone}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Payment</h3>
          <p>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}</p>
        </div>
      </div>

      <div className="divide-y divide-charcoal-200 border-t border-b border-charcoal-200 mb-8">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 text-sm">
            <div>
              <p className="font-medium">{item.productTitle}</p>
              <p className="text-charcoal-400">
                Size: {item.size} &middot; Color: {item.color} &middot; Qty: {item.quantity}
              </p>
            </div>
            <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <p className="font-display text-xl">Total: {formatPrice(order.total)}</p>
      </div>
    </div>
  );
}
