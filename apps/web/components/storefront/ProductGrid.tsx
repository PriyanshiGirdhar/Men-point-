import type { ProductCard as ProductCardType } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  emptyMessage = 'No products found.',
}: {
  products: ProductCardType[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-charcoal-400 border border-dashed border-charcoal-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-charcoal-100" />
          <div className="h-3 bg-charcoal-100 mt-3 w-1/2" />
          <div className="h-4 bg-charcoal-100 mt-2 w-3/4" />
          <div className="h-4 bg-charcoal-100 mt-2 w-1/3" />
        </div>
      ))}
    </div>
  );
}
