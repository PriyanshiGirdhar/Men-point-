'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import type { Gender, Paginated, ProductCard, ProductFilters } from '@/lib/types';
import { ProductGrid, ProductGridSkeleton } from './ProductGrid';
import { FilterSidebar, type ListingFilters } from './FilterSidebar';
import { Pagination } from '@/components/ui/Pagination';

const LIMIT = 20;

interface ProductListingProps {
  gender?: Gender;
  categorySlug?: string;
  title: string;
}

export function ProductListing(props: ProductListingProps) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductListingInner {...props} />
    </Suspense>
  );
}

function ProductListingInner({ gender, categorySlug, title }: ProductListingProps) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || undefined;
  const category = categorySlug && categorySlug !== 'all' ? categorySlug : undefined;

  const [facets, setFacets] = useState<ProductFilters | null>(null);
  const [products, setProducts] = useState<ProductCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListingFilters>({ sizes: [], colors: [], sort: 'newest' });

  useEffect(() => {
    setFacets(null);
    apiGet<ProductFilters>('/products/filters', { category, gender })
      .then(setFacets)
      .catch(() => setFacets(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, gender]);

  useEffect(() => {
    setPage(1);
  }, [gender, category, q, filters.sizes, filters.colors, filters.minPrice, filters.maxPrice, filters.sort]);

  useEffect(() => {
    setProducts(null);
    apiGet<Paginated<ProductCard>>('/products', {
      gender,
      category,
      q,
      size: filters.sizes,
      color: filters.colors,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      page,
      limit: LIMIT,
    })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, category, q, filters, page]);

  return (
    <div className="container py-10">
      <h1 className="section-heading mb-1">{q ? `Results for "${q}"` : title}</h1>
      <p className="text-sm text-charcoal-400 mb-8">
        {products ? `${total} product${total === 1 ? '' : 's'}` : 'Loading products…'}
      </p>

      <div className="flex flex-col lg:flex-row gap-10">
        <FilterSidebar facets={facets} value={filters} onChange={setFilters} />

        <div className="flex-1">
          {products === null ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid products={products} emptyMessage="No products match these filters." />
              <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
