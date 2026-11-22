import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-mustard-400 via-mustard-300 to-mustard-500">
      <div className="container relative grid grid-cols-1 lg:grid-cols-2 items-center gap-8 py-14 md:py-20 min-h-[480px]">
        <div className="relative z-10 text-charcoal-900">
          <p className="uppercase tracking-[0.3em] text-xs font-semibold mb-4">New Season Edit</p>
          <h1 className="font-display font-bold uppercase leading-[0.95] text-5xl sm:text-6xl lg:text-7xl mb-6">
            Get Started
            <br />
            Your Favorite
            <br />
            Shopping
          </h1>
          <p className="max-w-md text-charcoal-800/80 mb-8 text-sm sm:text-base">
            Fresh arrivals for men, women and kids — editorial style, everyday comfort, prices
            that don&apos;t cost a season&apos;s wardrobe.
          </p>
          <Link href="/category/all" className="btn-primary">
            Buy Now
          </Link>
        </div>

        <div className="relative z-10 flex justify-center lg:justify-end">
          <div className="relative w-64 sm:w-80 md:w-96 aspect-[3/4] rounded-t-full overflow-hidden shadow-2xl border-4 border-cream/40">
            <Image
              src="https://images.unsplash.com/photo-1732464517792-7385024242a6?auto=format&fit=crop&w=600&h=800&q=80"
              alt="Model wearing a Clothify outfit"
              fill
              sizes="(min-width: 1024px) 24rem, 20rem"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <button
          aria-label="Previous"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream/70 items-center justify-center hover:bg-cream z-10"
        >
          ‹
        </button>
        <button
          aria-label="Next"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream/70 items-center justify-center hover:bg-cream z-10"
        >
          ›
        </button>
      </div>
    </section>
  );
}
