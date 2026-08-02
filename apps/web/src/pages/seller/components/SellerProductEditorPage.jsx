import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2, Sparkles, PackageCheck } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { createSellerProduct, getSellerProduct, updateSellerProduct } from '../api/sellerProducts';
import { MAX_IMAGE_UPLOAD_MB, uploadProductImage, validateImageFile } from '../../../lib/imageUpload';
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
  category: 'Social Accounts',
  price: 199,
  salePrice: 149,
  stock: 100,
  lowStockThreshold: 5,
  deliveryType: 'automatic',
  marketplaceType: 'account',
  listingType: 'social-account',
  status: 'draft',
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
  const [imageUploading, setImageUploading] = useState(false);
  const [inventoryAccounts, setInventoryAccounts] = useState([]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getSellerProduct(id).then((product) => {
      if (!mounted || !product) return;
      setForm({
        ...defaultDraft,
        ...product,
      });
      setImageFileName(product.thumbnail ? 'Current image set' : '');
    });
    return () => { mounted = false; };
  }, [id]);

  const isEditing = Boolean(id);
  const manualDelivery = isManualDelivery(form.deliveryType);
  const inventoryRequired = isInventoryRequired(form.deliveryType);
  const readyInventoryCount = countReadyInventory(inventoryAccounts);

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
    updateField('deliveryType', value);
    if (isManualDelivery(value)) {
      setInventoryAccounts([]);
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', description: 'Add a clear product title before saving.', variant: 'destructive' });
      return;
    }

    if (publish && inventoryRequired && readyInventoryCount < 1) {
      toast({
        title: 'Inventory required',
        description: 'Import and validate at least one account before publishing an Instant Access product.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const stockValue = publish && inventoryRequired
        ? readyInventoryCount
        : Number(form.stock || 0);

      const payload = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        category: form.category,
        categoryId: form.categoryId,
        price: Number(form.price || 0),
        salePrice: Number(form.salePrice || 0),
        stock: stockValue,
        lowStockThreshold: Number(form.lowStockThreshold || 0),
        deliveryType: form.deliveryType,
        marketplaceType: form.marketplaceType,
        listingType: form.listingType,
        productType: form.productType,
        thumbnail: form.thumbnail,
        gallery: form.gallery,
        status: publish ? (manualDelivery ? 'pending' : 'live') : 'draft',
        whatsIncluded: form.whatsIncluded,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoKeywords: form.seoKeywords,
        inventoryType: inventoryRequired ? 'tracked' : (form.inventoryType || 'manual'),
        stockType: form.stockType || 'limited',
      };

      await (isEditing
        ? updateSellerProduct(id, payload, { publish })
        : createSellerProduct(payload, { publish }));

      toast({
        title: publish ? 'Product published' : 'Product saved',
        description: publish
          ? (manualDelivery
            ? 'Manual Delivery listing is ready — inventory import is not required.'
            : `${readyInventoryCount} Instant Access accounts are ready.`)
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
    return {
      savings: price > sale ? price - sale : 0,
      deliveryLabel: getDeliveryLabel(form.deliveryType),
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
            <p className="mt-1 text-sm text-muted-foreground">
              Create a clear listing with pricing, delivery options, and media — then publish into the ApnaStore workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> ApnaStore-ready listing</div>
            <p className="mt-1">Delivery type controls whether inventory import is required.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Product Details</h3>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black">Delivery and stock</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{summary.deliveryLabel}</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Delivery Type</span>
                <select
                  value={form.deliveryType}
                  onChange={(e) => handleDeliveryTypeChange(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none"
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Initial Stock</span>
                <input type="number" value={form.stock} onChange={(e) => updateField('stock', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Low Stock Threshold</span>
                <input type="number" value={form.lowStockThreshold} onChange={(e) => updateField('lowStockThreshold', Number(e.target.value))} className="w-full rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 outline-none" />
              </label>
            </div>
            {manualDelivery ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Manual Delivery does not use inventory import. Set stock manually and publish when the listing details are ready.
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Instant Access requires inventory import before publishing. Use the section below to paste or upload accounts.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Product Image</h3>
            <label className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground ${imageUploading ? 'opacity-70 pointer-events-none' : ''}`}>
              {imageUploading ? <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="mb-3 h-8 w-8 text-primary" />}
              <span className="font-semibold text-foreground">{imageUploading ? 'Uploading…' : 'Upload product image'}</span>
              <span className="mt-1">JPG, PNG, WEBP · max {MAX_IMAGE_UPLOAD_MB} MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
            </label>
            {imageFileName ? <p className="mt-3 text-sm text-muted-foreground">Selected: {imageFileName}</p> : null}
            {form.thumbnail ? <img src={form.thumbnail} alt={form.title || 'Product preview'} className="mt-4 h-40 w-full rounded-[1rem] object-cover" /> : null}
          </section>

          <section className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black">Quick summary</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Starting price</span><span className="font-semibold text-foreground">${Number(form.price || 0).toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Discount</span><span className="font-semibold text-foreground">${summary.savings.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Stock</span><span className="font-semibold text-foreground">{inventoryRequired && readyInventoryCount > 0 ? readyInventoryCount : Number(form.stock || 0)}</span></div>
              <div className="flex items-center justify-between"><span>Delivery</span><span className="font-semibold text-foreground">{summary.deliveryLabel}</span></div>
              {inventoryRequired ? (
                <div className="flex items-center justify-between"><span>Inventory ready</span><span className="font-semibold text-foreground">{readyInventoryCount}</span></div>
              ) : null}
            </div>
            <div className="mt-5 rounded-2xl border border-primary/10 bg-primary/[0.05] p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <PackageCheck className="h-4 w-4 text-primary" />
                {manualDelivery
                  ? 'Manual Delivery: publish with product details and stock only.'
                  : 'Instant Access: import inventory below, then publish.'}
              </div>
            </div>
          </section>
        </div>
      </div>

      {inventoryRequired ? (
        <InventoryImportSection
          productId={id}
          accounts={inventoryAccounts}
          onAccountsChange={setInventoryAccounts}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <button type="button" onClick={() => handleSubmit(false)} disabled={saving} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60">
          {saving ? 'Saving...' : 'Save draft'}
        </button>
        <button type="button" onClick={() => handleSubmit(true)} disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
          {saving ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default SellerProductEditorPage;
