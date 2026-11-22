import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function discountPercent(base: number, discount: number | null) {
  if (!discount || discount >= base) return 0;
  return Math.round(((base - discount) / base) * 100);
}
