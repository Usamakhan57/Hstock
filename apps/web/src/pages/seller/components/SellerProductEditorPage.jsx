import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  PackageCheck,
  Save,
  Tag,
  Info,
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { createSellerProduct, getSellerProduct, updateSellerProduct } from '../api/sellerProducts';
import { MAX_IMAGE_UPLOAD_MB, uploadProductImage, validateImageFile } from '../../../lib/imageUpload';
import CategorySearchSelect from '../../../components/CategorySearchSelect';
import InventoryImportSection from './InventoryImportSection';
import {
  DELIVERY_OPTIONS,
  countReadyInventory,
  getDeliveryLabel,
  isInventoryRequired,
  isManualDelivery,
} from '../lib/sellerDelivery';

const defaultDraft = {
  title: '',
  shortDescription: '',
  description: '',
  category: '',
  categoryId: null,
  price: '',
  salePrice: '',
  stock: 100,
  lowStockThreshold: 5,
  deliveryType: 'automatic',
  marketplaceType: 'account',
  listingType: 'social-account',
  status: 'draft',
  visibility: 'public',
  thumbnail: '',
  gallery: [],
  whatsIncluded: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
  tagsText: '',
};

function parseOptionalNumber(value) {
  if (value === '' || value == null) return '';
  const next = Number(value);
  return Number.isFinite(next) ? next : '';
}

function Section({ title, subtitle, children, badge = null }) {
  return (
    <section className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint = null, required = false }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <span className="inline-flex items-center gap-1.5">
        {label}
        {required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">required</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const inputClass = 'w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10';

const SellerProductEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(defaultDraft);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [imageFileName, setImageFileName] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [inventoryAccounts, setInventoryAccounts] = useState([]);

  useEffect(() => {
    if (!id) return undefined;
    let mounted = true;
    setLoading(true);
    getSellerProduct(id)
      .then((product) => {
        if (!mounted || !product) return;
        const keywords = Array.isArray(product.seoKeywords) ? product.seoKeywords : [];
        setForm({
          ...defaultDraft,
          ...product,
          categoryId: product.categoryId || null,
          category: product.category || '',
          price: product.price == null || product.price === '' ? '' : Number(product.price),
          salePrice: product.salePrice == null || product.salePrice === '' ? '' : Number(product.salePrice),
          visibility: product.visibility || 'public',
          whatsIncluded: product.whatsIncluded || '',
          seoTitle: product.seoTitle || '',
          seoDescription: product.seoDescription || '',
          seoKeywords: keywords,
          tagsText: keywords.join(', '),
        });
        setImageFileName(product.thumbnail ? 'Current image set' : '');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  const isEditing = Boolean(id);
  const manualDelivery = isManualDelivery(form.deliveryType);
  const inventoryRequired = isInventoryRequired(form.deliveryType);
  const readyInventoryCount = countReadyInventory(inventoryAccounts);
  const descriptionCount = String(form.description || '').length;

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImageUploading(true);
    try {
      validateImageFile(file);
      const uploaded = await uploadProductImage(file);
      const url = uploaded.url;
      setForm((prev) => ({
        ...prev,
        thumbnail: url,
        gallery: prev.gallery.includes(url) ? prev.gallery : [url, ...prev.gallery].slice(0, 4),
      }));
      setImageFileName(file.name);
      toast({ title: 'Image uploaded', description: `${file.name} ready to save with this product.` });
    } catch (error) {
      toast({
        title: 'Image upload failed',
        description: error?.message || `Use JPG, PNG, or WEBP up to ${MAX_IMAGE_UPLOAD_MB} MB.`,
        variant: 'destructive',
      });
    } finally {
      setImageUploading(false);
    }
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleDeliveryTypeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      deliveryType: value,
      ...(isManualDelivery(value) ? { salePrice: 0 } : {}),
    }));
    if (isManualDelivery(value)) {
      setInventoryAccounts([]);
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', description: 'Add a clear product title before saving.', variant: 'destructive' });
      return;
    }

    if (publish && inventoryRequired && readyInventoryCount < 1 && !isEditing) {
      toast({
        title: 'Inventory required',
        description: 'Import and validate at least one account before publishing an Instant Access product.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const keywords = String(form.tagsText || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const stockValue = publish && inventoryRequired && readyInventoryCount > 0
        ? readyInventoryCount
        : Number(form.stock || 0);

      const payload = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        category: form.category,
        categoryId: form.categoryId,
        price: Number(form.price || 0),
        salePrice: manualDelivery ? 0 : Number(form.salePrice || 0),
        stock: stockValue,
        lowStockThreshold: Number(form.lowStockThreshold || 0),
        deliveryType: form.deliveryType,
        marketplaceType: form.marketplaceType,
        listingType: form.listingType,
        productType: form.productType,
        thumbnail: form.thumbnail,
        gallery: form.gallery,
        status: publish ? (manualDelivery ? 'pending' : form.status === 'live' ? 'live' : 'pending') : 'draft',
        visibility: form.visibility || 'public',
        whatsIncluded: form.whatsIncluded,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoKeywords: keywords,
        tagsText: form.tagsText,
        inventoryType: inventoryRequired ? 'tracked' : (form.inventoryType || 'manual'),
        stockType: form.stockType || 'limited',
        inventorySourceFormat: 'paste',
        ...(inventoryRequired && readyInventoryCount > 0
          ? { inventoryAccounts }
          : {}),
      };

      await (isEditing
        ? updateSellerProduct(id, payload, {
          publish,
          inventoryAccounts: inventoryRequired && readyInventoryCount > 0 ? inventoryAccounts : null,
        })
        : createSellerProduct(payload, {
          publish,
          inventoryAccounts: inventoryRequired ? inventoryAccounts : [],
        }));

      toast({
        title: publish ? 'Product published' : 'Product saved',
        description: publish
          ? (manualDelivery
            ? 'Manual Delivery listing submitted for the ApnaStore workflow.'
            : readyInventoryCount > 0
              ? `${readyInventoryCount} Instant Access accounts are ready.`
              : 'Listing saved. Manage inventory anytime from My Products.')
          : 'Your draft is now available in My Products.',
      });
      navigate('/seller/products');
    } catch (error) {
      toast({ title: 'Could not save product', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const price = Number(form.price || 0);
    const sale = Number(form.salePrice || 0);
    const showDiscount = !isManualDelivery(form.deliveryType);
    return {
      savings: showDiscount && price > sale && sale > 0 ? price - sale : 0,
      showDiscount,
      deliveryLabel: getDeliveryLabel(form.deliveryType),
    };
  }, [form.price, form.salePrice, form.deliveryType]);

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
        Loading product editor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 px-4 py-8 sm:px-6 lg:px-10">
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/seller/products"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary hover:opacity-80"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
            </Link>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
              {isEditing ? 'Edit Product' : 'Add Product'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Professional listing workflow — same fields for create and edit.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <PackageCheck className="h-4 w-4 text-primary" />
              {summary.deliveryLabel}
            </div>
            <p className="mt-1">
              {manualDelivery
                ? 'Manual delivery — set stock without account import.'
                : 'Instant Access — import inventory before going live.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-6">
          <Section title="Basic Information" subtitle="Title and buyer-facing copy.">
            <div className="grid gap-4">
              <Field label="Product Title" required>
                <input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Premium Instagram growth account"
                  maxLength={200}
                />
              </Field>
              <Field label="Short description" hint={`${String(form.shortDescription || '').length}/500`}>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value.slice(0, 500))}
                  rows={2}
                  className={inputClass}
                  placeholder="Concise summary shown on cards and search."
                />
              </Field>
              <Field label="Description" hint={`${descriptionCount}/500 characters recommended for mobile clarity`}>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={6}
                  className={inputClass}
                  placeholder="Describe what buyers receive, handover steps, and value."
                />
              </Field>
            </div>
          </Section>

          <Section title="Pricing" subtitle="List price and optional sale price for Instant Access.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Price ($)" required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.price === '' || form.price == null ? '' : form.price}
                  onChange={(e) => updateField('price', parseOptionalNumber(e.target.value))}
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>
              {!manualDelivery ? (
                <Field label="Sale Price ($)" hint="Optional display discount. Leave blank to hide.">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.salePrice === '' || form.salePrice == null ? '' : form.salePrice}
                    onChange={(e) => updateField('salePrice', parseOptionalNumber(e.target.value))}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </Field>
              ) : (
                <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  Sale price is not used for Manual Delivery listings.
                </div>
              )}
            </div>
          </Section>

          <Section title="Category" subtitle="Helps buyers discover your listing.">
            <Field label="Category">
              <CategorySearchSelect
                value={form.categoryId}
                placeholder="Select category"
                onChange={({ categoryId, category }) => {
                  setForm((prev) => ({
                    ...prev,
                    categoryId,
                    category,
                  }));
                }}
              />
            </Field>
          </Section>

          <Section
            title="Delivery Method"
            subtitle="Controls Instant Access inventory vs Manual Delivery stock."
            badge={(
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {summary.deliveryLabel}
              </span>
            )}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Delivery Type" required>
                <select
                  value={form.deliveryType}
                  onChange={(e) => handleDeliveryTypeChange(e.target.value)}
                  className={inputClass}
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Initial Stock" hint={manualDelivery ? 'Set manually for Manual Delivery.' : 'Synced from inventory when Instant Access publishes.'}>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => updateField('stock', Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Low Stock Threshold" hint="Used for seller alerts in the dashboard.">
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => updateField('lowStockThreshold', Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {manualDelivery
                ? 'Auto: System delivers instantly. Manual: You deliver within your deadline.'
                : 'Auto: System delivers instantly. Manual: You deliver within your deadline.'}
            </p>
          </Section>

          <Section
            title="Bulk Discount (optional)"
            subtitle="Future-ready pricing tiers for larger Instant Access orders."
            badge={<Tag className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950">
              <p>
                Lower the price per unit when buyers order more. Example: 50+ = $5.00 each, 100+ = $4.00 each.
                Each tier must be cheaper than the base price. Instant Access only.
              </p>
              <button
                type="button"
                disabled
                className="mt-3 inline-flex cursor-not-allowed items-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 opacity-70"
              >
                + Add discount tier
              </button>
              <p className="mt-2 text-xs text-sky-800/80">Coming soon — checkout still uses your base price.</p>
            </div>
          </Section>

          <Section
            title="How To Login"
            subtitle="Buyers see this after purchase — login URL, 2FA app, IP/region notes, etc."
            badge={<span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">required for delivery</span>}
          >
            <Field label="Delivery instructions / what’s included">
              <textarea
                value={form.whatsIncluded}
                onChange={(e) => updateField('whatsIncluded', e.target.value)}
                rows={5}
                className={inputClass}
                placeholder="High quality accounts with 2FA key included. All accounts are fully verified and secure."
              />
            </Field>
          </Section>

          <Section title="SEO" subtitle="Optional search metadata for your listing page.">
            <div className="grid gap-4">
              <Field label="SEO Title">
                <input
                  value={form.seoTitle}
                  onChange={(e) => updateField('seoTitle', e.target.value)}
                  className={inputClass}
                  placeholder="Defaults to product title when empty"
                  maxLength={200}
                />
              </Field>
              <Field label="SEO Description">
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => updateField('seoDescription', e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Short meta description for search engines"
                  maxLength={500}
                />
              </Field>
            </div>
          </Section>

          <Section title="Tags" subtitle="Comma-separated keywords stored with SEO keywords.">
            <Field label="Tags" hint="Example: gmail, aged, 2fa">
              <input
                value={form.tagsText}
                onChange={(e) => updateField('tagsText', e.target.value)}
                className={inputClass}
                placeholder="tag1, tag2, tag3"
              />
            </Field>
          </Section>

          <Section title="Visibility & Publishing" subtitle="Control storefront visibility and publish state.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Visibility">
                <select
                  value={form.visibility || 'public'}
                  onChange={(e) => updateField('visibility', e.target.value)}
                  className={inputClass}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </Field>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Save Draft keeps the listing private to your seller portal.
                    Publish submits Instant Access live (or Manual Delivery for review) using existing ApnaStore rules.
                  </p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Section title="Images" subtitle="Primary thumbnail shown on cards and product pages.">
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground ${imageUploading ? 'pointer-events-none opacity-70' : ''}`}>
              {imageUploading ? <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="mb-3 h-8 w-8 text-primary" />}
              <span className="font-semibold text-foreground">{imageUploading ? 'Uploading…' : 'Upload product image'}</span>
              <span className="mt-1">JPG, PNG, WEBP · max {MAX_IMAGE_UPLOAD_MB} MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageUploading}
              />
            </label>
            {imageFileName ? <p className="mt-3 text-sm text-muted-foreground">Selected: {imageFileName}</p> : null}
            {form.thumbnail ? (
              <img
                src={form.thumbnail}
                alt={form.title || 'Product preview'}
                className="mt-4 h-44 w-full rounded-[1rem] object-cover"
              />
            ) : null}
          </Section>

          <Section title="Quick summary">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Starting price</span><span className="font-semibold text-foreground">${Number(form.price || 0).toFixed(2)}</span></div>
              {summary.showDiscount && summary.savings > 0 ? (
                <div className="flex items-center justify-between"><span>Discount</span><span className="font-semibold text-foreground">${summary.savings.toFixed(2)}</span></div>
              ) : null}
              <div className="flex items-center justify-between"><span>Stock</span><span className="font-semibold text-foreground">{inventoryRequired && readyInventoryCount > 0 ? readyInventoryCount : Number(form.stock || 0)}</span></div>
              <div className="flex items-center justify-between"><span>Delivery</span><span className="font-semibold text-foreground">{summary.deliveryLabel}</span></div>
              <div className="flex items-center justify-between"><span>Visibility</span><span className="font-semibold capitalize text-foreground">{form.visibility || 'public'}</span></div>
              {inventoryRequired ? (
                <div className="flex items-center justify-between"><span>Inventory ready</span><span className="font-semibold text-foreground">{readyInventoryCount}</span></div>
              ) : null}
            </div>
          </Section>
        </div>
      </div>

      {inventoryRequired ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-black text-foreground">Inventory Upload & Preview</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste or upload accounts for Instant Access. Validate before publishing.
            </p>
          </div>
          <InventoryImportSection
            productId={id}
            accounts={inventoryAccounts}
            onAccountsChange={setInventoryAccounts}
          />
          {isEditing ? (
            <p className="text-sm text-muted-foreground">
              Prefer managing live stock separately?{' '}
              <Link to={`/seller/upload-accounts/${id}`} className="font-semibold text-primary hover:underline">
                Open Inventory Management
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-end gap-3 rounded-[1.5rem] border border-border bg-white/95 p-4 shadow-lg backdrop-blur lg:bottom-6">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Publishing…' : isEditing ? 'Update Product' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default SellerProductEditorPage;
