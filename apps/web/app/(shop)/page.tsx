'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/storefront/Hero';
import { CategoryGrid } from '@/components/storefront/CategoryGrid';
import { ProductGrid, ProductGridSkeleton } from '@/components/storefront/ProductGrid';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Paginated, ProductCard } from '@/lib/types';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductCard[] | null>(null);

  useEffect(() => {
    if (!loading && user && !user.onboarded) {
      router.replace('/onboarding');
    }
  }, [loading, user, router]);

  useEffect(() => {
    apiGet<Paginated<ProductCard>>('/products', { sort: 'newest', limit: 8 })
      .then((res) => setProducts(res.items))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div>
      <Hero />
      <CategoryGrid />
      <section className="container pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="section-heading">Man &amp; Woman Fashion</h2>
          <p className="text-sm text-charcoal-400 hidden sm:block">Fresh picks from the new collection</p>
        </div>
        {products === null ? (
          <ProductGridSkeleton />
        ) : (
          <ProductGrid products={products} emptyMessage="New arrivals are on their way." />
        )}
      </section>
    </div>
  );
}
