import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Plus, Trash2, Sparkles, PackageCheck } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { createSellerProduct, getSellerProduct, updateSellerProduct } from '../api/sellerProducts';

const DELIVERY_OPTIONS = [
  { value: 'automatic', label: 'Automatic Delivery' },
  { value: 'manual', label: 'Manual Delivery' },
];

const defaultDraft = {
  title: '',
  shortDescription: '',
  description: '',
  category: 'Social Accounts',
  price: 199,
  salePrice: 149,
  stock: 100,
  lowStockThreshold: 5,
  deliveryType: 'automatic',
  marketplaceType: 'account',
  listingType: 'social-account',
  status: 'draft',
  promoted: false,
  featured: false,
  promotion: null,
  bulkDiscounts: [],
  thumbnail: '',
  gallery: [],
};

const SellerProductEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(defaultDraft);
  const [saving, setSaving] = useState(false);
  const [imageFileName, setImageFileName] = useState('');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getSellerProduct(id).then((product) => {
      if (!mounted || !product) return;
      setForm({
        ...defaultDraft,
        ...product,
        bulkDiscounts: Array.isArray(product.bulkDiscounts) ? product.bulkDiscounts : [],
        promotion: product.promotion || null,
      });
      setImageFileName(product.thumbnail ? 'Current image set' : '');
    });
    return () => { mounted = false; };
  }, [id]);

  const isEditing = Boolean(id);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({ ...prev, thumbnail: result, gallery: prev.gallery.includes(result) ? prev.gallery : [result, ...prev.gallery].slice(0, 4) }));
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addDiscount = () => {
    setForm((prev) => ({ ...prev, bulkDiscounts: [...prev.bulkDiscounts, { minQuantity: 5, percentage: 10, label: 'Bundle deal' }] }));
  };

  const updateDiscount = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      bulkDiscounts: prev.bulkDiscounts.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeDiscount = (index) => {
    setForm((prev) => ({ ...prev, bulkDiscounts: prev.bulkDiscounts.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const handleSubmit = async (publish = false) => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', description: 'Add a clear product title before saving.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        status: publish ? 'pending' : 'draft',
        promoted: Boolean(form.promoted),
        featured: Boolean(form.featured),
        promotion: form.promoted ? form.promotion || { label: 'Featured Launch', discount: 10 } : null,
        bulkDiscounts: form.bulkDiscounts.filter(Boolean),
        stock: Number(form.stock || 0),
        price: Number(form.price || 0),
        salePrice: Number(form.salePrice || 0),
      };

      const saved = isEditing ? await updateSellerProduct(id, payload) : await createSellerProduct(payload);
      toast({ title: publish ? 'Product published' : 'Product saved', description: publish ? 'You can upload accounts and make it live.' : 'Your draft is now available in My Products.' });
      if (publish) {
        navigate(`/seller/upload-accounts/${saved.id}`);
      } else {
        navigate('/seller/products');
      }
    } catch (error) {
      toast({ title: 'Could not save product', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const price = Number(form.price || 0);
    const sale = Number(form.salePrice || 0);
    return {
      savings: price > sale ? price - sale : 0,
      deliveryLabel: form.deliveryType === 'manual' ? 'Manual handover' : 'Instant unlock',
    };
  }, [form.price, form.salePrice, form.deliveryType]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <Link to="/seller/products" className="inline-flex items-center gap-1 text-primary hover:opacity-80"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
            </div>
            <h2 className="mt-2 text-2xl font-black">{isEditing ? 'Edit product' : 'Upload product'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create a polished listing with delivery options, promotional pricing, and instant account import.</p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> HStock-ready listing</div>
            <p className="mt-1">Publish into the new seller workflow in one pass.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Listing details</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Title</span>
                <input value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" placeholder="e.g. Premium Instagram growth account" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Category</span>
                <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Price</span>
                <input type="number" value={form.price} onChange={(e) => updateField('price', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Sale price</span>
                <input type="number" value={form.salePrice} onChange={(e) => updateField('salePrice', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
            </div>

            <label className="mt-4 block space-y-2 text-sm font-medium text-foreground">
              <span>Short description</span>
              <textarea value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} rows={3} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" placeholder="Add a concise buyer-facing summary." />
            </label>

            <label className="mt-4 block space-y-2 text-sm font-medium text-foreground">
              <span>Description</span>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={6} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" placeholder="Describe what buyers receive, the handover, and the value proposition." />
            </label>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">Delivery and stock</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{summary.deliveryLabel}</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Delivery Type</span>
                <select value={form.deliveryType} onChange={(e) => updateField('deliveryType', e.target.value)} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none">
                  {DELIVERY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Initial stock</span>
                <input type="number" value={form.stock} onChange={(e) => updateField('stock', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Low stock threshold</span>
                <input type="number" value={form.lowStockThreshold} onChange={(e) => updateField('lowStockThreshold', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={Boolean(form.promoted)} onChange={(e) => updateField('promoted', e.target.checked)} className="h-4 w-4 rounded border-border" />
                Promote listing
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => updateField('featured', e.target.checked)} className="h-4 w-4 rounded border-border" />
                Feature on store
              </label>
            </div>
            {form.promoted && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">A promotion badge will be shown on cards and in seller analytics.</div>}
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">Bulk discounts</h3>
              <button type="button" onClick={addDiscount} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary">
                <Plus className="h-4 w-4" /> Add tier
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {form.bulkDiscounts.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">No bulk discounts yet. Add tiers for quantity-based offers.</p> : form.bulkDiscounts.map((discount, index) => (
                <div key={`${discount.label}-${index}`} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Tier {index + 1}</p>
                    <button type="button" onClick={() => removeDiscount(index)} className="rounded-full p-2 text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      <span>Minimum quantity</span>
                      <input type="number" value={discount.minQuantity || 0} onChange={(e) => updateDiscount(index, 'minQuantity', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      <span>Percentage off</span>
                      <input type="number" value={discount.percentage || 0} onChange={(e) => updateDiscount(index, 'percentage', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      <span>Label</span>
                      <input value={discount.label || ''} onChange={(e) => updateDiscount(index, 'label', e.target.value)} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Media</h3>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
              <ImagePlus className="mb-3 h-8 w-8 text-primary" />
              <span className="font-semibold text-foreground">Upload product image</span>
              <span className="mt-1">PNG, JPG, WEBP supported</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {imageFileName ? <p className="mt-3 text-sm text-muted-foreground">Selected: {imageFileName}</p> : null}
            {form.thumbnail ? <img src={form.thumbnail} alt={form.title || 'Product preview'} className="mt-4 h-40 w-full rounded-[1rem] object-cover" /> : null}
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Quick summary</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Starting price</span><span className="font-semibold text-foreground">${Number(form.price || 0).toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Discount</span><span className="font-semibold text-foreground">${summary.savings.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Stock</span><span className="font-semibold text-foreground">{Number(form.stock || 0)}</span></div>
              <div className="flex items-center justify-between"><span>Delivery</span><span className="font-semibold text-foreground">{form.deliveryType === 'manual' ? 'Manual' : 'Automatic'}</span></div>
            </div>
            <div className="mt-5 rounded-2xl border border-primary/10 bg-primary/[0.05] p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground"><PackageCheck className="h-4 w-4 text-primary" /> After publish, inventory uploads become the next step.</div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <button type="button" onClick={() => handleSubmit(false)} disabled={saving} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60">{saving ? 'Saving...' : 'Save draft'}</button>
        <button type="button" onClick={() => handleSubmit(true)} disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">{saving ? 'Publishing...' : 'Publish product'}</button>
      </div>
    </div>
  );
};

export default SellerProductEditorPage;
