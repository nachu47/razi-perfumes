'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import a from './admin.module.css';
import { ImageUploader, PageHeader, useAdminApi } from './ui';
import { useAdminToast } from './AdminShell';

interface Variant {
  id?: string;
  label: string;
  sizeMl: number | '' | null;
  sku: string;
  priceKWD: number | '';
  compareAtPriceKWD: number | '' | null;
  stock: number | '';
}
interface ProductState {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  notesTopAr: string;
  notesHeartAr: string;
  notesBaseAr: string;
  ingredientsEn: string;
  ingredientsAr: string;
  noteTags: string[];
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  collectionId: string;
  images: string[];
  isFeatured: boolean;
  isRecommended: boolean;
  isActive: boolean;
  variants: Variant[];
}

const NOTE_TAGS = ['woody', 'oud', 'spicy', 'sweet', 'fruity', 'floral', 'musky'];

const blank: ProductState = {
  slug: '', nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
  notesTop: '', notesHeart: '', notesBase: '', notesTopAr: '', notesHeartAr: '', notesBaseAr: '',
  ingredientsEn: '', ingredientsAr: '', noteTags: [], gender: 'UNISEX', collectionId: '', images: [],
  isFeatured: false, isRecommended: false, isActive: true,
  variants: [{ label: '100 Ml', sizeMl: 100, sku: '', priceKWD: '', compareAtPriceKWD: '', stock: 0 }],
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function ProductForm({ id }: { id?: string }) {
  const call = useAdminApi();
  const toast = useAdminToast();
  const router = useRouter();
  const [p, setP] = useState<ProductState | null>(id ? null : blank);
  const [collections, setCollections] = useState<{ id: string; nameEn: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    void call<{ id: string; nameEn: string }[]>('/api/admin/resources/collections').then((c) => c && setCollections(c));
    if (id) {
      void call<Record<string, unknown>>(`/api/admin/products/${id}`).then((row) => {
        if (!row) return;
        const s = (k: string) => (row[k] as string | null) ?? '';
        setP({
          ...blank,
          ...Object.fromEntries(Object.keys(blank).map((k) => [k, typeof blank[k as keyof ProductState] === 'string' ? s(k) : row[k]])),
          collectionId: s('collectionId'),
          variants: (row.variants as Variant[]).map((v) => ({ ...v, compareAtPriceKWD: v.compareAtPriceKWD ?? '', sizeMl: v.sizeMl ?? '' })),
        } as ProductState);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!p) return <div className="spinner" />;

  const set = <K extends keyof ProductState>(k: K, v: ProductState[K]) => setP({ ...p, [k]: v });
  const text = (k: keyof ProductState) => ({ value: p[k] as string, onChange: (e: { target: { value: string } }) => set(k, e.target.value as never) });
  const setVariant = (i: number, patch: Partial<Variant>) => set('variants', p.variants.map((v, j) => (i === j ? { ...v, ...patch } : v)));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...p,
      collectionId: p.collectionId || null,
      variants: p.variants.map((v) => ({
        ...v,
        sizeMl: v.sizeMl === '' ? null : v.sizeMl,
        compareAtPriceKWD: v.compareAtPriceKWD === '' ? null : v.compareAtPriceKWD,
        sku: v.sku || `RZ-${p.slug.toUpperCase()}-${v.label.toUpperCase().replace(/[^A-Z0-9]+/g, '')}`,
      })),
    };
    const res = await call<{ id: string }>(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PUT' : 'POST', body });
    setSaving(false);
    if (res) {
      toast(id ? 'Product saved' : 'Product created');
      if (!id) router.push(`/admin/products/${res.id}`);
      else router.refresh();
    }
  };

  const remove = async () => {
    if (!id || !confirm(`Delete “${p.nameEn}”? Past orders keep their own copy of the product details.`)) return;
    if (await call(`/api/admin/products/${id}`, { method: 'DELETE' })) {
      toast('Product deleted');
      router.push('/admin/products');
    }
  };

  const field = (label: string, el: React.ReactNode, opts: { full?: boolean; help?: string } = {}) => (
    <div className={`${a.field} ${opts.full ? a.full : ''}`}>
      <span className={a.label}>{label}</span>
      {el}
      {opts.help && <span className={a.help}>{opts.help}</span>}
    </div>
  );

  return (
    <form onSubmit={save}>
      <PageHeader
        title={id ? p.nameEn || 'Edit product' : 'New product'}
        actions={
          <>
            {id && (
              <a href={`/product/${p.slug}`} target="_blank" rel="noopener" className={a.btnGhost}>
                View in store ↗
              </a>
            )}
            <Link href="/admin/products" className={a.btnGhost}>
              Back
            </Link>
            <button className={a.btnGold} disabled={saving}>
              {saving ? 'Saving…' : 'Save product'}
            </button>
          </>
        }
      />

      <div className={a.panel}>
        <div className={a.panelTitle}>Basics</div>
        <div className={a.form}>
          {field('Name (English) *', <input className={a.input} required value={p.nameEn} onChange={(e) => setP({ ...p, nameEn: e.target.value, slug: slugTouched ? p.slug : slugify(e.target.value) })} />)}
          {field('Name (Arabic) *', <input className={a.input} required dir="rtl" {...text('nameAr')} />)}
          {field('URL slug *', <input className={a.input} required value={p.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />, { help: `/product/${p.slug || '…'}` })}
          {field(
            'Collection',
            <select className={a.select} value={p.collectionId} onChange={(e) => set('collectionId', e.target.value)}>
              <option value="">— None —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>,
          )}
          {field(
            'Gender',
            <select className={a.select} value={p.gender} onChange={(e) => set('gender', e.target.value as ProductState['gender'])}>
              <option value="UNISEX">Unisex</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>,
          )}
          <div className={a.field}>
            <span className={a.label}>Visibility</span>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', paddingTop: 6 }}>
              <label className={a.check}><input type="checkbox" checked={p.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
              <label className={a.check}><input type="checkbox" checked={p.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured (Luxury Line)</label>
              <label className={a.check}><input type="checkbox" checked={p.isRecommended} onChange={(e) => set('isRecommended', e.target.checked)} /> Recommended</label>
            </div>
          </div>
          {field('Description (English)', <textarea className={a.textarea} {...text('descriptionEn')} />, { full: true })}
          {field('Description (Arabic)', <textarea className={a.textarea} dir="rtl" {...text('descriptionAr')} />, { full: true })}
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>Images</div>
        <div className={a.imageGrid}>
          {p.images.map((src, i) => (
            <div key={src + i} className={a.imageTile}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              {i === 0 && <span className="first">MAIN</span>}
              <button type="button" onClick={() => set('images', p.images.filter((_, j) => j !== i))} aria-label="Remove image">
                ✕
              </button>
              {i > 0 && (
                <button type="button" style={{ top: 'auto', bottom: 4 }} title="Make main image" onClick={() => set('images', [src, ...p.images.filter((_, j) => j !== i)])}>
                  ★
                </button>
              )}
            </div>
          ))}
          <ImageUploader onUploaded={(urls) => set('images', [...p.images, ...urls])} />
        </div>
        <div className={a.toolbar} style={{ marginTop: 12 }}>
          <input
            className={a.input}
            style={{ flex: 1 }}
            placeholder="…or paste an image URL and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) set('images', [...p.images, v]);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>
          Sizes, prices &amp; stock (KWD)
          <button type="button" className={a.btnGhost} onClick={() => set('variants', [...p.variants, { label: '', sizeMl: '', sku: '', priceKWD: '', compareAtPriceKWD: '', stock: 0 }])}>
            + Add size
          </button>
        </div>
        <div className={a.tableWrap} style={{ border: 'none' }}>
          <table className={a.table}>
            <thead>
              <tr>
                <th>Label *</th>
                <th>Size (ml)</th>
                <th>SKU</th>
                <th>Price (KWD) *</th>
                <th>Compare-at</th>
                <th>Stock *</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.variants.map((v, i) => (
                <tr key={v.id ?? `new-${i}`}>
                  <td><input className={a.input} required value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="200 Ml" style={{ width: 110 }} /></td>
                  <td><input className={a.input} type="number" min={0} value={v.sizeMl ?? ''} onChange={(e) => setVariant(i, { sizeMl: e.target.value === '' ? '' : Number(e.target.value) })} style={{ width: 80 }} /></td>
                  <td><input className={a.input} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} placeholder="auto" style={{ width: 170 }} /></td>
                  <td><input className={a.input} type="number" step="0.001" min={0} required value={v.priceKWD} onChange={(e) => setVariant(i, { priceKWD: e.target.value === '' ? '' : Number(e.target.value) })} style={{ width: 100 }} /></td>
                  <td><input className={a.input} type="number" step="0.001" min={0} value={v.compareAtPriceKWD ?? ''} onChange={(e) => setVariant(i, { compareAtPriceKWD: e.target.value === '' ? '' : Number(e.target.value) })} style={{ width: 100 }} /></td>
                  <td><input className={a.input} type="number" min={0} required value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value === '' ? '' : Number(e.target.value) })} style={{ width: 80 }} /></td>
                  <td>
                    {p.variants.length > 1 && (
                      <button type="button" className={a.btnDanger} onClick={() => set('variants', p.variants.filter((_, j) => j !== i))}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>Fragrance</div>
        <div className={a.form}>
          {field('Top notes (English)', <input className={a.input} {...text('notesTop')} />)}
          {field('Top notes (Arabic)', <input className={a.input} dir="rtl" {...text('notesTopAr')} />)}
          {field('Heart notes (English)', <input className={a.input} {...text('notesHeart')} />)}
          {field('Heart notes (Arabic)', <input className={a.input} dir="rtl" {...text('notesHeartAr')} />)}
          {field('Base notes (English)', <input className={a.input} {...text('notesBase')} />)}
          {field('Base notes (Arabic)', <input className={a.input} dir="rtl" {...text('notesBaseAr')} />)}
          {field('Ingredients (English)', <textarea className={a.textarea} {...text('ingredientsEn')} />)}
          {field('Ingredients (Arabic)', <textarea className={a.textarea} dir="rtl" {...text('ingredientsAr')} />)}
          <div className={`${a.field} ${a.full}`}>
            <span className={a.label}>Scent families (used by the “Scent type” filter)</span>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {Array.from(new Set([...NOTE_TAGS, ...p.noteTags])).map((tag) => (
                <label key={tag} className={a.check}>
                  <input type="checkbox" checked={p.noteTags.includes(tag)} onChange={(e) => set('noteTags', e.target.checked ? [...p.noteTags, tag] : p.noteTags.filter((t) => t !== tag))} />
                  {tag}
                </label>
              ))}
              <input
                className={a.input}
                placeholder="+ custom tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.toLowerCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tagInput.trim() && !p.noteTags.includes(tagInput.trim())) set('noteTags', [...p.noteTags, tagInput.trim()]);
                    setTagInput('');
                  }
                }}
                style={{ width: 140 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={a.formActions}>
        {id && (
          <button type="button" className={a.btnDanger} onClick={remove} style={{ marginInlineEnd: 'auto' }}>
            Delete product
          </button>
        )}
        <button className={a.btnGold} disabled={saving}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>
    </form>
  );
}
