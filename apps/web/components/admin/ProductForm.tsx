'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import type { Category, Gender, Product, ProductImage, ProductVariant } from '@/lib/types';

type VariantRow = Omit<ProductVariant, 'id'>;
type ImageRow = Omit<ProductImage, 'id'> & { uploading?: boolean; previewUrl?: string };

const GENDERS: Gender[] = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];

const emptyVariant: VariantRow = { size: '', color: '', colorHex: '#000000', sku: '', stock: 0 };

export function ProductForm({
  initialProduct,
  onSaved,
}: {
  initialProduct?: Product;
  onSaved?: (product: Product) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initialProduct?.title ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [brand, setBrand] = useState(initialProduct?.brand ?? '');
  const [gender, setGender] = useState<Gender>(initialProduct?.gender ?? 'MEN');
  const [categoryId, setCategoryId] = useState(initialProduct?.category?.id ?? '');
  const [basePrice, setBasePrice] = useState(initialProduct?.basePrice?.toString() ?? '');
  const [discountPrice, setDiscountPrice] = useState(
    initialProduct?.discountPrice != null ? String(initialProduct.discountPrice) : ''
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    initialProduct?.variants?.length
      ? initialProduct.variants.map(({ id, ...rest }) => rest)
      : [{ ...emptyVariant }]
  );
  const [images, setImages] = useState<ImageRow[]>(
    initialProduct?.images?.map(({ id, ...rest }) => rest) ?? []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Category[]>('/admin/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeVariant(index: number) {
    setVariants((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      setImages((rows) => [...rows, { url: '', key: '', sortOrder: rows.length, uploading: true, previewUrl }]);

      try {
        const presign = await apiPost<{ uploadUrl: string; publicUrl: string; key: string }>(
          '/uploads/presign',
          { fileName: file.name, contentType: file.type }
        );
        await fetch(presign.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        setImages((rows) =>
          rows.map((row) =>
            row.previewUrl === previewUrl
              ? { ...row, url: presign.publicUrl, key: presign.key, uploading: false }
              : row
          )
        );
      } catch {
        setImages((rows) => rows.filter((row) => row.previewUrl !== previewUrl));
        setError(`Failed to upload ${file.name}`);
      }
    }
  }

  function removeImage(index: number) {
    setImages((rows) => rows.filter((_, i) => i !== index).map((row, i) => ({ ...row, sortOrder: i })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (images.some((img) => img.uploading)) {
      setError('Please wait for all images to finish uploading.');
      return;
    }

    const payload = {
      title,
      description,
      brand,
      gender,
      categoryId,
      basePrice: Number(basePrice),
      discountPrice: discountPrice === '' ? null : Number(discountPrice),
      variants: variants.map(({ size, color, colorHex, sku, stock }) => ({
        size,
        color,
        colorHex,
        sku,
        stock: Number(stock),
      })),
      images: images.map(({ url, key, sortOrder }) => ({ url, key, sortOrder })),
    };

    setSubmitting(true);
    try {
      const result = initialProduct
        ? await apiPatch<Product>(`/admin/products/${initialProduct.id}`, payload)
        : await apiPost<Product>('/admin/products', payload);
      if (onSaved) onSaved(result);
      else router.push('/admin/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="bg-white border border-charcoal-200 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Details</h2>
        <div>
          <label className="label-text">Title</label>
          <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label-text">Description</label>
          <textarea
            className="input-field"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Brand</label>
            <input className="input-field" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          </div>
          <div>
            <label className="label-text">Gender</label>
            <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label-text">Category</label>
          <select
            className="input-field"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">Base Price (₹)</label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text">Discount Price (₹, optional)</label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-charcoal-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Variants</h2>
          <button
            type="button"
            className="text-xs font-semibold text-mustard-700 hover:underline"
            onClick={() => setVariants((rows) => [...rows, { ...emptyVariant }])}
          >
            + Add row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-400">
                <th className="py-2 pr-2">Size</th>
                <th className="py-2 pr-2">Color</th>
                <th className="py-2 pr-2">Hex</th>
                <th className="py-2 pr-2">SKU</th>
                <th className="py-2 pr-2">Stock</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((row, i) => (
                <tr key={i} className="border-t border-charcoal-100">
                  <td className="py-2 pr-2">
                    <input
                      className="input-field"
                      value={row.size}
                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                      placeholder="M"
                      required
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className="input-field"
                      value={row.color}
                      onChange={(e) => updateVariant(i, { color: e.target.value })}
                      placeholder="Olive"
                      required
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="color"
                      className="w-12 h-10 border border-charcoal-200"
                      value={row.colorHex}
                      onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className="input-field"
                      value={row.sku}
                      onChange={(e) => updateVariant(i, { sku: e.target.value })}
                      placeholder="SKU-001"
                      required
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      className="input-field w-24"
                      value={row.stock}
                      onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                      required
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      disabled={variants.length === 1}
                      className="text-red-600 text-xs hover:underline disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-charcoal-200 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Images</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="text-sm"
        />
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-24 bg-charcoal-100 border border-charcoal-200">
              {(img.url || img.previewUrl) && (
                <Image
                  src={img.url || img.previewUrl || ''}
                  alt=""
                  fill
                  unoptimized={!!img.previewUrl && !img.url}
                  className="object-cover"
                  sizes="80px"
                />
              )}
              {img.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white">
                  Uploading…
                </div>
              )}
              {!img.uploading && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-charcoal-900 text-cream text-xs rounded-full"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <button type="submit" disabled={submitting} className="btn-gold">
        {submitting ? 'Saving…' : initialProduct ? 'Save Changes' : 'Create Product'}
      </button>
    </form>
  );
}
