import Image from 'next/image';
import Link from 'next/link';

const SHOWCASE = [
  {
    label: 'Men',
    href: '/men',
    image: 'https://images.unsplash.com/photo-1619603364937-8d7af41ef206?auto=format&fit=crop&w=600&h=750&q=80',
  },
  {
    label: 'Women',
    href: '/women',
    image: 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?auto=format&fit=crop&w=600&h=750&q=80',
  },
  {
    label: 'Kids',
    href: '/kids',
    image: 'https://images.unsplash.com/photo-1670014541811-9b0ec280ed60?auto=format&fit=crop&w=600&h=750&q=80',
  },
];

export function CategoryGrid() {
  return (
    <section className="container py-16">
      <h2 className="section-heading text-center mb-10">Shop by Category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {SHOWCASE.map((cat) => (
          <Link key={cat.href} href={cat.href} className="group relative block aspect-[4/5] overflow-hidden">
            <Image
              src={cat.image}
              alt={`${cat.label} fashion`}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/70 via-transparent to-transparent" />
            <span className="absolute bottom-5 left-5 font-display text-2xl uppercase tracking-wider text-cream">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
