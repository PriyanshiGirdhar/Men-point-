import type { Category } from './types';
import { resolveApiUrl } from './api';

const API_URL = resolveApiUrl();

/** Best-effort server-side fetch for public data used in layouts (e.g. nav categories). */
export async function fetchCategoriesServer(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()) as Category[];
  } catch {
    return [];
  }
}
