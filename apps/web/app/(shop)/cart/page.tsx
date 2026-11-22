'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthGuard } from '@/lib/use-auth-guard';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { ready } = useAuthGuard();
  const { cart, loading, updateItem, removeItem } = useCart();

  if (!ready || loading || !cart) {
    return <div className="container py-24 text-center text-charcoal-400">Loading your cart…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <h1 className="section-heading mb-3">Your cart is empty</h1>
        <p className="text-charcoal-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/men" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="section-heading mb-8">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 divide-y divide-charcoal-200">
          {cart.items.map((item) => {
            const price = item.variant.product.discountPrice ?? item.variant.product.basePrice;
            return (
              <div key={item.id} className="flex gap-4 py-6">
                <Link href={`/product/${item.variant.product.slug}`} className="relative w-24 h-32 shrink-0 bg-charcoal-100">
                  <Image
                    src={item.variant.product.image}
                    alt={item.variant.product.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <Link href={`/product/${item.variant.product.slug}`} className="font-medium hover:underline">
                    {item.variant.product.title}
                  </Link>
                  <p className="text-sm text-charcoal-400 mt-1">
                    Size: {item.variant.size} &middot; Color: {item.variant.color}
                  </p>
                  <p className="font-semibold mt-2">{formatPrice(price)}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="inline-flex items-center border border-charcoal-300">
                      <button
                        className="w-8 h-8 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        className="w-8 h-8 disabled:opacity-30"
                        disabled={item.quantity >= item.variant.stock}
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs underline text-charcoal-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="font-semibold">{formatPrice(price * item.quantity)}</p>
              </div>
            );
          })}
        </div>

        <aside className="w-full lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 border border-charcoal-200 p-6">
            <h2 className="font-display text-lg uppercase tracking-wide mb-4">Order Summary</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-charcoal-500">Subtotal</span>
              <span className="font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-charcoal-400 mb-4">Shipping and taxes calculated at checkout.</p>
            <Link href="/checkout" className="btn-primary w-full">
              Proceed to Checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
