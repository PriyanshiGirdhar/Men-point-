import { cn } from '@/lib/utils';

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
      <button
        className="px-3 py-2 text-sm disabled:opacity-30"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-charcoal-300">…</span>}
          <button
            onClick={() => onPageChange(p)}
            className={cn(
              'w-9 h-9 text-sm',
              p === page ? 'bg-charcoal-900 text-cream' : 'hover:bg-charcoal-100'
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        className="px-3 py-2 text-sm disabled:opacity-30"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
