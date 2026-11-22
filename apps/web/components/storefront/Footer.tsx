'use client';

import Link from 'next/link';
import { useState } from 'react';

const COLUMNS = [
  {
    heading: 'Shop',
    links: [
      { label: 'Men', href: '/men' },
      { label: 'Women', href: '/women' },
      { label: 'Kids', href: '/kids' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Customer Service', href: '#' },
      { label: 'Track Order', href: '/account' },
      { label: 'Returns', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: "About Men's point", href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Sustainability', href: '#' },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="bg-charcoal-900 text-cream/90 mt-20">
      <div className="container py-14 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl uppercase tracking-widest mb-3">Men's point</h3>
          <p className="text-sm text-cream/60 max-w-xs mb-5">
            Style for every wardrobe — men, women and kids. Join our list for first access to new
            drops and exclusive offers.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="flex max-w-sm"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 bg-charcoal-800 border border-charcoal-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mustard-400"
            />
            <button type="submit" className="bg-mustard-400 text-charcoal-900 font-semibold px-5 text-sm uppercase">
              Join
            </button>
          </form>
          {submitted && <p className="text-xs text-mustard-300 mt-2">Thanks for subscribing!</p>}
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-4">
              {col.heading}
            </h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-cream/80 hover:text-mustard-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-charcoal-800">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/50">
          <p>&copy; {new Date().getFullYear()} Men's point. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>Pinterest</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
