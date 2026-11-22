'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiPost } from '@/lib/api';
import type { Gender, User } from '@/lib/types';
import { cn } from '@/lib/utils';

const TILES: { label: string; gender: Gender }[] = [
  { label: 'Men', gender: 'MEN' },
  { label: 'Women', gender: 'WOMEN' },
  { label: 'Kids', gender: 'KIDS' },
  { label: 'Everyone', gender: 'UNISEX' },
];

export default function OnboardingPage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Gender | null>(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  async function choose(gender: Gender) {
    setSelected(gender);
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiPost<User>('/auth/onboarding', {
        gender,
        phone: phone.trim() || undefined,
      });
      setUser(updated);
      setStep(2);
    } catch {
      setError('Could not save your preference. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="w-full max-w-lg text-center">
      {step === 1 ? (
        <>
          <h1 className="section-heading text-2xl mb-2">Who are you shopping for?</h1>
          <p className="text-sm text-charcoal-500 mb-8">
            We&apos;ll tailor your homepage to match — you can always browse everything either way.
          </p>

          <div className="mb-6 max-w-xs mx-auto text-left">
            <label className="label-text" htmlFor="phone">
              Phone (optional)
            </label>
            <input
              id="phone"
              type="tel"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {TILES.map((tile) => (
              <button
                key={tile.gender}
                disabled={submitting}
                onClick={() => choose(tile.gender)}
                className={cn(
                  'aspect-square flex items-center justify-center border-2 font-display text-xl uppercase tracking-wider transition-colors',
                  selected === tile.gender
                    ? 'border-mustard-500 bg-mustard-50'
                    : 'border-charcoal-200 hover:border-charcoal-900',
                  submitting && 'opacity-50'
                )}
              >
                {tile.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-mustard-400 text-charcoal-900 flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
            ✓
          </div>
          <h1 className="section-heading text-2xl mb-2">You&apos;re all set!</h1>
          <p className="text-sm text-charcoal-500 mb-8">
            Your Men's point homepage is ready. Let&apos;s find something you&apos;ll love.
          </p>
          <Link href="/" className="btn-primary">
            Start Shopping
          </Link>
        </>
      )}
    </div>
  );
}
