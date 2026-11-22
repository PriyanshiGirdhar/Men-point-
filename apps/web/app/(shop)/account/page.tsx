'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPatch, apiPost, apiDelete, ApiError } from '@/lib/api';
import type { Address, OrderSummary, User } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/StatusBadge';

type Tab = 'profile' | 'settings' | 'orders';

export default function AccountPage() {
  const { ready } = useAuthGuard();
  const [tab, setTab] = useState<Tab>('profile');

  if (!ready) {
    return <div className="container py-24 text-center text-charcoal-400">Loading your account…</div>;
  }

  return (
    <div className="container py-10">
      <h1 className="section-heading mb-8">My Account</h1>
      <div className="flex gap-2 mb-10 border-b border-charcoal-200">
        {(['profile', 'settings', 'orders'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 -mb-px',
              tab === t ? 'border-charcoal-900 text-charcoal-900' : 'border-transparent text-charcoal-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'orders' && <OrdersTab />}
    </div>
  );
}

function ProfileTab() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await apiPatch<User>('/users/me', { name, phone: phone || undefined });
      setUser(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div>
        <label className="label-text">Email</label>
        <input disabled className="input-field opacity-60" value={user?.email ?? ''} readOnly />
      </div>
      <div>
        <label className="label-text" htmlFor="name">
          Full name
        </label>
        <input id="name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label-text" htmlFor="phone">
          Phone
        </label>
        <input id="phone" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <p className="text-sm text-green-700">Profile updated.</p>}
    </form>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-14 max-w-lg">
      <PasswordForm />
      <AddressManager />
    </div>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiPatch('/users/me/password', { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-lg uppercase tracking-wide mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder="Current password"
          className="input-field"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="New password"
          className="input-field"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Confirm new password"
          className="input-field"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">Password updated.</p>}
        <button type="submit" disabled={saving} className="btn-secondary">
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </section>
  );
}

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

function AddressManager() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Address[]>('/addresses')
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, []);

  function startEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    });
  }

  function startNew() {
    setEditingId('new');
    setForm(emptyAddress);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId === 'new') {
        const created = await apiPost<Address>('/addresses', form);
        setAddresses((prev) => [...(prev ?? []), created]);
      } else if (editingId) {
        const updated = await apiPatch<Address>(`/addresses/${editingId}`, form);
        setAddresses((prev) => (prev ?? []).map((a) => (a.id === editingId ? updated : a)));
      }
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await apiDelete(`/addresses/${id}`);
    setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id));
  }

  return (
    <section>
      <h2 className="font-display text-lg uppercase tracking-wide mb-4">Addresses</h2>
      <div className="space-y-3 mb-4">
        {addresses?.map((addr) => (
          <div key={addr.id} className="border border-charcoal-200 p-4 text-sm">
            <p className="font-medium">
              {addr.fullName} — {addr.phone}
            </p>
            <p className="text-charcoal-500">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
            </p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => startEdit(addr)} className="text-xs underline">
                Edit
              </button>
              <button onClick={() => remove(addr.id)} className="text-xs underline text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
        {addresses?.length === 0 && <p className="text-sm text-charcoal-400">No saved addresses yet.</p>}
      </div>

      {editingId ? (
        <form onSubmit={save} className="grid grid-cols-2 gap-3 border border-charcoal-200 p-4">
          <input required placeholder="Full name" className="input-field col-span-2" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input required placeholder="Phone" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input required placeholder="Postal code" className="input-field" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          <input required placeholder="Address line 1" className="input-field col-span-2" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <input placeholder="Address line 2" className="input-field col-span-2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <input required placeholder="City" className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input required placeholder="State" className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input required placeholder="Country" className="input-field col-span-2" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <div className="col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={startNew} className="text-sm underline">
          + Add a new address
        </button>
      )}
    </section>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    apiGet<OrderSummary[]>('/orders')
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) return <p className="text-charcoal-400">Loading orders…</p>;
  if (orders.length === 0) return <p className="text-charcoal-400">You haven&apos;t placed any orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block border border-charcoal-200 p-5 hover:border-charcoal-900 transition-colors"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold">{order.orderNumber}</p>
              <p className="text-xs text-charcoal-400">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
          <ul className="text-sm text-charcoal-500 space-y-1 mb-3">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.productTitle} ({item.size}/{item.color}) &times; {item.quantity}
              </li>
            ))}
          </ul>
          <p className="font-semibold">{formatPrice(order.total)}</p>
        </Link>
      ))}
    </div>
  );
}
