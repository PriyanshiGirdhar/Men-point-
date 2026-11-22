import Image from 'next/image';
import Link from 'next/link';
import type { ProductCard as ProductCardType } from '@/lib/types';
import { discountPercent, formatPrice } from '@/lib/utils';

export function ProductCard({ product }: { product: ProductCardType }) {
  const pct = discountPercent(product.basePrice, product.discountPrice);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-charcoal-100">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {pct > 0 && (
          <span className="absolute top-2 left-2 bg-mustard-400 text-charcoal-900 text-xs font-bold px-2 py-1">
            -{pct}%
          </span>
        )}
      </div>
      <div className="pt-3 pb-1">
        <p className="text-xs uppercase tracking-wider text-charcoal-400 font-semibold">
          {product.brand}
        </p>
        <h3 className="text-sm font-medium text-charcoal-800 truncate">{product.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-charcoal-900">
            {formatPrice(product.discountPrice ?? product.basePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-xs text-charcoal-400 line-through">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
