'use client';

import type { ProductFilters, SortOption } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

export interface ListingFilters {
  sizes: string[];
  colors: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
}

export function FilterSidebar({
  facets,
  value,
  onChange,
}: {
  facets: ProductFilters | null;
  value: ListingFilters;
  onChange: (next: ListingFilters) => void;
}) {
  if (!facets) {
    return <div className="w-full lg:w-64 shrink-0" />;
  }

  function toggleSize(size: string) {
    const sizes = value.sizes.includes(size)
      ? value.sizes.filter((s) => s !== size)
      : [...value.sizes, size];
    onChange({ ...value, sizes });
  }

  function toggleColor(color: string) {
    const colors = value.colors.includes(color)
      ? value.colors.filter((c) => c !== color)
      : [...value.colors, color];
    onChange({ ...value, colors });
  }

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Sort by</h3>
        <select
          className="input-field"
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as SortOption })}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {facets.sizes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Size</h3>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={cn(
                  'w-10 h-10 text-xs font-medium border',
                  value.sizes.includes(size)
                    ? 'bg-charcoal-900 text-cream border-charcoal-900'
                    : 'border-charcoal-300 hover:border-charcoal-900'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.colors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Color</h3>
          <div className="flex flex-wrap gap-3">
            {facets.colors.map((color) => (
              <button
                key={color.name}
                onClick={() => toggleColor(color.name)}
                title={color.name}
                className={cn(
                  'w-8 h-8 rounded-full border-2',
                  value.colors.includes(color.name) ? 'border-mustard-500' : 'border-transparent ring-1 ring-charcoal-200'
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Price</h3>
        <div className="flex items-center gap-2 text-sm text-charcoal-500 mb-2">
          <span>{formatPrice(value.minPrice ?? facets.minPrice)}</span>
          <span>—</span>
          <span>{formatPrice(value.maxPrice ?? facets.maxPrice)}</span>
        </div>
        <input
          type="range"
          min={facets.minPrice}
          max={facets.maxPrice}
          value={value.maxPrice ?? facets.maxPrice}
          onChange={(e) => onChange({ ...value, maxPrice: Number(e.target.value) })}
          className="w-full accent-mustard-500"
        />
      </div>

      {(value.sizes.length > 0 || value.colors.length > 0 || value.maxPrice) && (
        <button
          onClick={() => onChange({ sizes: [], colors: [], sort: value.sort })}
          className="text-xs underline text-charcoal-500 hover:text-charcoal-900"
        >
          Clear filters
        </button>
      )}
    </aside>
  );
}
