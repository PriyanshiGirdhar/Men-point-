'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/lib/types';
import { cn, discountPercent, formatPrice } from '@/lib/utils';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Product>(`/products/${params.slug}`)
      .then((p) => {
        setProduct(p);
        const firstColor = p.variants[0]?.color ?? null;
        setSelectedColor(firstColor);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      });
  }, [params.slug]);

  const colors = useMemo(() => {
    if (!product) return [];
    const seen = new Map<string, string>();
    product.variants.forEach((v) => {
      if (!seen.has(v.color)) seen.set(v.color, v.colorHex);
    });
    return Array.from(seen.entries()).map(([color, hex]) => ({ color, hex }));
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map((v) => v.size)));
  }, [product]);

  function isSizeInStock(size: string) {
    if (!product) return false;
    return product.variants.some(
      (v) => v.size === size && (!selectedColor || v.color === selectedColor) && v.stock > 0
    );
  }

  const matchedVariant = useMemo(() => {
    if (!product || !selectedSize || !selectedColor) return null;
    return (
      product.variants.find((v) => v.size === selectedSize && v.color === selectedColor) ?? null
    );
  }, [product, selectedSize, selectedColor]);

  useEffect(() => {
    setQuantity(1);
    setAdded(false);
    setAddError(null);
  }, [selectedSize, selectedColor]);

  async function handleAddToCart() {
    if (!product) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    if (!matchedVariant) {
      setAddError('Please select a size and color.');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await addItem(matchedVariant.id, quantity);
      setAdded(true);
    } catch {
      setAddError('Could not add this item to your cart.');
    } finally {
      setAdding(false);
    }
  }

  if (notFound) {
    return (
      <div className="container py-24 text-center">
        <h1 className="section-heading mb-2">Product not found</h1>
        <p className="text-charcoal-500">This item may have been removed or is no longer available.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-24 text-center text-charcoal-400">Loading…</div>
    );
  }

  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const pct = discountPercent(product.basePrice, product.discountPrice);

  return (
    <div className="container py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <div className="relative aspect-[3/4] bg-charcoal-100 overflow-hidden">
          {images[activeImage] && (
            <Image
              src={images[activeImage].url}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
              priority
            />
          )}
          {pct > 0 && (
            <span className="absolute top-3 left-3 bg-mustard-400 text-charcoal-900 text-xs font-bold px-2 py-1">
              -{pct}%
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-3 mt-4">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'relative w-16 h-20 overflow-hidden border-2',
                  i === activeImage ? 'border-charcoal-900' : 'border-transparent'
                )}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-charcoal-400 font-semibold mb-1">
          {product.brand}
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide mb-3">{product.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-semibold">
            {formatPrice(product.discountPrice ?? product.basePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-charcoal-400 line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>

        {colors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
              Color{selectedColor ? `: ${selectedColor}` : ''}
            </h3>
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  key={c.color}
                  onClick={() => {
                    setSelectedColor(c.color);
                    setSelectedSize(null);
                  }}
                  title={c.color}
                  className={cn(
                    'w-9 h-9 rounded-full border-2',
                    selectedColor === c.color ? 'border-mustard-500' : 'border-transparent ring-1 ring-charcoal-200'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const inStock = isSizeInStock(size);
                return (
                  <button
                    key={size}
                    disabled={!inStock}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'w-12 h-11 text-sm font-medium border',
                      !inStock && 'opacity-30 cursor-not-allowed line-through',
                      selectedSize === size
                        ? 'bg-charcoal-900 text-cream border-charcoal-900'
                        : 'border-charcoal-300 hover:border-charcoal-900'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Quantity</h3>
          <div className="inline-flex items-center border border-charcoal-300">
            <button
              className="w-10 h-10 text-lg disabled:opacity-30"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="w-10 text-center text-sm">{quantity}</span>
            <button
              className="w-10 h-10 text-lg disabled:opacity-30"
              disabled={!!matchedVariant && quantity >= matchedVariant.stock}
              onClick={() =>
                setQuantity((q) => (matchedVariant ? Math.min(matchedVariant.stock, q + 1) : q + 1))
              }
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || (!!selectedSize && !!selectedColor && !matchedVariant)}
          className="btn-gold w-full sm:w-auto"
        >
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>

        {!matchedVariant && !addError && (
          <p className="text-xs text-charcoal-400 mt-2">Select a size and color to continue.</p>
        )}
        {addError && <p className="text-sm text-red-600 mt-2">{addError}</p>}
        {added && <p className="text-sm text-green-700 mt-2">Added to your cart.</p>}

        <div className="mt-10 pt-8 border-t border-charcoal-200">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Description</h3>
          <p className="text-sm text-charcoal-600 whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}
