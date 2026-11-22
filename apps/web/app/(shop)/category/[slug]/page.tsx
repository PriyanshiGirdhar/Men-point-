'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { Category } from '@/lib/types';
import { ProductListing } from '@/components/storefront/ProductListing';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [title, setTitle] = useState(() =>
    slug === 'all' ? 'All Products' : slug.replace(/-/g, ' ')
  );

  useEffect(() => {
    if (slug === 'all') return;
    apiGet<Category>(`/categories/${slug}`)
      .then((cat) => setTitle(cat.name))
      .catch(() => {
        /* keep the slug-derived fallback title */
      });
  }, [slug]);

  return <ProductListing categorySlug={slug} title={title} />;
}
