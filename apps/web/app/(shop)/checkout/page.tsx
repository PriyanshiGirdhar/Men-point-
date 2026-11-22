'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useCart } from '@/lib/cart-context';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import type { Address, Order, PaymentMethod } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export default function CheckoutPage() {
  const { ready } = useAuthGuard();
  const { cart, refresh } = useCart();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!ready) return;
    apiGet<Address[]>('/addresses')
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setSelectedAddressId(def.id);
        else setShowNewAddress(true);
      })
      .catch(() => setAddresses([]));
  }, [ready]);

  async function saveNewAddress(e: React.FormEvent) {
    e.preventDefault();
    setSavingAddress(true);
    setError(null);
    try {
      const created = await apiPost<Address>('/addresses', newAddress);
      setAddresses((prev) => [...(prev ?? []), created]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      setNewAddress(emptyAddress);
    } catch {
      setError('Could not save this address. Please check the details and try again.');
    } finally {
      setSavingAddress(false);
    }
  }

  async function placeOrder() {
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const created = await apiPost<Order>('/orders/checkout', {
        addressId: selectedAddressId,
        paymentMethod,
      });
      setOrder(created);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order.');
    } finally {
      setPlacing(false);
    }
  }

  if (!ready || !cart) {
    return <div className="container py-24 text-center text-charcoal-400">Loading checkout…</div>;
  }

  if (order) {
    return (
      <div className="container py-24 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-mustard-400 text-charcoal-900 flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
          ✓
        </div>
        <h1 className="section-heading mb-2">Order Placed!</h1>
        <p className="text-charcoal-500 mb-1">Your order number is</p>
        <p className="font-display text-2xl mb-8">{order.orderNumber}</p>
        <div className="flex gap-4 justify-center">
          <Link href="/account" className="btn-secondary">
            View Orders
          </Link>
          <Link href="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <h1 className="section-heading mb-3">Your cart is empty</h1>
        <Link href="/men" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="section-heading mb-8">Checkout</h1>
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-10">
          <section>
            <h2 className="font-display text-lg uppercase tracking-wide mb-4">Delivery Address</h2>
            <div className="space-y-3">
              {addresses?.map((addr) => (
                <label
                  key={addr.id}
                  className={cn(
                    'block border p-4 cursor-pointer',
                    selectedAddressId === addr.id ? 'border-charcoal-900' : 'border-charcoal-200'
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mr-2"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                  />
                  <span className="font-medium">{addr.fullName}</span> — {addr.phone}
                  <p className="text-sm text-charcoal-500 ml-6">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode},{' '}
                    {addr.country}
                  </p>
                </label>
              ))}
            </div>

            {showNewAddress ? (
              <form onSubmit={saveNewAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border border-charcoal-200 p-4">
                <input required placeholder="Full name" className="input-field sm:col-span-2" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
                <input required placeholder="Phone" className="input-field" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                <input required placeholder="Postal code" className="input-field" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} />
                <input required placeholder="Address line 1" className="input-field sm:col-span-2" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                <input placeholder="Address line 2 (optional)" className="input-field sm:col-span-2" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
                <input required placeholder="City" className="input-field" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                <input required placeholder="State" className="input-field" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                <input required placeholder="Country" className="input-field" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} />
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" disabled={savingAddress} className="btn-primary">
                    {savingAddress ? 'Saving…' : 'Save Address'}
                  </button>
                  {addresses && addresses.length > 0 && (
                    <button type="button" onClick={() => setShowNewAddress(false)} className="btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <button onClick={() => setShowNewAddress(true)} className="text-sm underline mt-4">
                + Add a new address
              </button>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wide mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className={cn('flex items-center gap-2 border p-4 cursor-pointer', paymentMethod === 'COD' ? 'border-charcoal-900' : 'border-charcoal-200')}>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                Cash on Delivery
              </label>
              <label className={cn('flex items-center gap-2 border p-4 cursor-pointer', paymentMethod === 'CARD' ? 'border-charcoal-900' : 'border-charcoal-200')}>
                <input type="radio" name="payment" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                Credit / Debit Card
              </label>
              {paymentMethod === 'CARD' && (
                <div className="grid grid-cols-2 gap-4 border border-charcoal-200 p-4">
                  <input placeholder="Card number" maxLength={19} className="input-field col-span-2" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                  <input placeholder="MM/YY" maxLength={5} className="input-field" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                  <input placeholder="CVV" maxLength={4} className="input-field" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                  <p className="col-span-2 text-xs text-charcoal-400">Demo card form — no real payment is processed.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="w-full lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 border border-charcoal-200 p-6">
            <h2 className="font-display text-lg uppercase tracking-wide mb-4">Order Summary</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-charcoal-500">Subtotal</span>
              <span className="font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <button onClick={placeOrder} disabled={placing} className="btn-primary w-full mt-4">
              {placing ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
