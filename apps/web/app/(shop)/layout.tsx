import { UtilityBar } from '@/components/storefront/UtilityBar';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { fetchCategoriesServer } from '@/lib/server-api';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await fetchCategoriesServer();

  return (
    <div className="flex min-h-screen flex-col">
      <UtilityBar />
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
