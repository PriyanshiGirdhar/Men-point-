import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <div className="py-6 text-center">
        <Link href="/" className="font-display text-2xl font-bold tracking-widest uppercase">
          Clothify
        </Link>
      </div>
      <main className="flex-1 flex items-start justify-center px-4 pb-16">{children}</main>
    </div>
  );
}
