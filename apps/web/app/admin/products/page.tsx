'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Paginated, ProductCard } from '@/lib/types';
import { Pagination } from '@/components/ui/Pagination';

const LIMIT = 20;

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [data, setData] = useState<Paginated<ProductCard> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    apiGet<Paginated<ProductCard>>('/admin/products', { page, limit: LIMIT, q })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load products'));
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/admin/products/${id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete product');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl uppercase tracking-wide">Products</h1>
        <Link href="/admin/products/new" className="btn-gold">
          Add Product
        </Link>
      </div>

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
          placeholder="Search products…"
          className="input-field"
        />
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white border border-charcoal-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wider text-charcoal-400">
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!data && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-charcoal-400">
                  Loading…
                </td>
              </tr>
            )}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-charcoal-400">
                  No products found.
                </td>
              </tr>
            )}
            {data?.items.map((product) => (
              <tr key={product.id} className="border-b border-charcoal-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="relative w-12 h-14 bg-charcoal-100">
                    {product.image && (
                      <Image src={product.image} alt={product.title} fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{product.title}</td>
                <td className="px-4 py-3 text-charcoal-500">{product.brand}</td>
                <td className="px-4 py-3 text-charcoal-500">{product.gender}</td>
                <td className="px-4 py-3">
                  {formatPrice(product.discountPrice ?? product.basePrice)}
                  {product.discountPrice && (
                    <span className="ml-2 text-xs text-charcoal-400 line-through">
                      {formatPrice(product.basePrice)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/admin/products/${product.id}/edit`} className="text-mustard-700 hover:underline mr-4">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.title)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
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
