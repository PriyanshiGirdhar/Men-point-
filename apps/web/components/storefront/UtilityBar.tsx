const LINKS = ['Best Sellers', 'Gift Ideas', 'New Releases', "Today's Deals", 'Customer Service'];

export function UtilityBar() {
  return (
    <div className="hidden md:block bg-charcoal-900 text-cream/80 text-xs">
      <div className="container flex items-center justify-between py-2">
        <ul className="flex items-center gap-6">
          {LINKS.map((link) => (
            <li key={link} className="hover:text-mustard-300 transition-colors cursor-pointer">
              {link}
            </li>
          ))}
        </ul>
        <p className="tracking-wide">Free shipping on orders over ₹1,999</p>
      </div>
    </div>
  );
}
