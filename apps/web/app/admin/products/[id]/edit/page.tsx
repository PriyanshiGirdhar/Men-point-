'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductForm } from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Product>(`/admin/products/${params.id}`)
      .then(setProduct)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load product'));
  }, [params.id]);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-wide mb-6">Edit Product</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!product && !error && <p className="text-sm text-charcoal-400">Loading…</p>}
      {product && <ProductForm initialProduct={product} />}
    </div>
  );
}
