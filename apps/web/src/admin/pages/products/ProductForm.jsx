import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ImageUploadInput from '../../components/ImageUploadInput';
import FileUploadInput, { FileVideo, FileArchive } from '../../components/FileUploadInput';
import TagsInput from '../../components/TagsInput';
import { inputClass, textareaClass } from '../../components/FormSheet';
import RichTextEditorPlaceholder from '../../../components/blog/RichTextEditorPlaceholder';
import FaqRepeater from '../../components/FaqRepeater';
import FormTabs from '../../components/product-editor/FormTabs';
import LicensingEditor from '../../components/product-editor/LicensingEditor';
import VariationsEditor from '../../components/product-editor/VariationsEditor';
import { EMPTY_EXTENDED_PRODUCT, DEFAULT_COMMISSION_RATE, CURRENCIES, TAX_CLASSES } from '../../components/product-editor/productSchema';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { getProduct, createProduct, updateProduct } from '../../api/products';
import { getCategories } from '../../api/categories';
import { getCategoryTree, flattenCategories } from '../../../services/categoryTree';
import { getBrands } from '../../api/brands';
import { useToast } from '../../../hooks/use-toast';

const TABS = ['Basic Info', 'Pricing', 'Digital Files', 'Licensing', 'Inventory', 'SEO', 'Options'];

const EMPTY = {
  title: '', slug: '', sku: '', categoryId: '', brandId: '',
  price: '', salePrice: '', cost: '',
  stock: '', lowStockThreshold: '10', status: 'draft', featured: false,
  thumbnail: '', gallery: [], previewImages: [], previewVideos: [], zipFile: null,
  tags: [], description: '', whatsIncluded: '', faq: [], metaTitle: '', metaDescription: '',
  ...EMPTY_EXTENDED_PRODUCT,
};

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState(TABS[0]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCategories().then(setCategories);
    getBrands().then(setBrands);
  }, []);

  // Indented, depth-first list so the dropdown reflects the category
  // tree (unlimited nesting) instead of a flat alphabetical dump.
  const categoryOptions = useMemo(
    () => flattenCategories(getCategoryTree(categories)),
    [categories]
  );

  const subCategoryOptions = useMemo(
    () => categories.filter((c) => c.parentId === form.categoryId),
    [categories, form.categoryId]
  );

  useEffect(() => {
    if (!isEdit) return;
    getProduct(id).then((p) => {
      if (p) {
        setForm({
          ...EMPTY, ...p,
          price: String(p.price ?? ''),
          salePrice: p.salePrice != null ? String(p.salePrice) : '',
          cost: String(p.cost ?? ''),
          stock: String(p.stock ?? ''),
          lowStockThreshold: String(p.lowStockThreshold ?? '10'),
          tags: p.tags || [],
          faq: Array.isArray(p.faq) ? p.faq : [],
          licenses: p.licenses || EMPTY_EXTENDED_PRODUCT.licenses,
          variations: p.variations || EMPTY_EXTENDED_PRODUCT.variations,
        });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.categoryId) errs.categoryId = 'Select a category';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Enter a valid price';
    if (form.salePrice && Number(form.salePrice) >= Number(form.price)) errs.salePrice = 'Sale price must be lower than price';
    if (!form.thumbnail) errs.thumbnail = 'Add a thumbnail image';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (overrides = {}) => ({
    ...form,
    slug: form.slug || slugify(form.title),
    price: Number(form.price),
    salePrice: form.salePrice ? Number(form.salePrice) : null,
    cost: form.cost ? Number(form.cost) : 0,
    stock: Number(form.stock || 0),
    lowStockThreshold: Number(form.lowStockThreshold || 10),
    faq: form.faq.filter((item) => item.question && item.question.trim()),
    ...overrides,
  });

  const persist = async (payload, successMsg) => {
    setSaving(true);
    try {
      if (isEdit) await updateProduct(id, payload);
      else await createProduct(payload);
      toast({ title: successMsg, description: form.title });
      navigate('/admin/products');
    } catch (err) {
      toast({ title: 'Something went wrong', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await persist(buildPayload(), isEdit ? 'Product updated' : 'Product created');
  };

  const handlePublishToggle = async () => {
    if (!validate()) return;
    const isPublished = form.status === 'active';
    const nextStatus = isPublished ? 'draft' : 'active';
    setForm((f) => ({ ...f, status: nextStatus }));
    await persist(
      buildPayload({
        status: nextStatus,
        ...(nextStatus === 'active'
          ? { approvalStatus: 'approved', visibility: 'public' }
          : {}),
      }),
      nextStatus === 'active' ? 'Product published' : 'Product unpublished',
    );
  };

  const handleFeatureToggle = async () => {
    if (!isEdit) { setForm((f) => ({ ...f, featured: !f.featured })); return; }
    const next = !form.featured;
    setForm((f) => ({ ...f, featured: next }));
    await updateProduct(id, { featured: next });
    toast({ title: next ? 'Product featured' : 'Product unfeatured', description: form.title });
  };

  const effectivePrice = form.salePrice ? Number(form.salePrice) : Number(form.price || 0);
  const commissionAmount = Math.round(effectivePrice * DEFAULT_COMMISSION_RATE * 100) / 100;
  const sellerNet = Math.round((effectivePrice - commissionAmount) * 100) / 100;

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Product' : 'Add Product'}
        backTo="/admin/products"
        backLabel="Products"
        actions={
          isEdit && (
            <>
              <button
                type="button"
                onClick={handleFeatureToggle}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors ${form.featured ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border hover:bg-secondary'}`}
              >
                <Star className={`w-4 h-4 ${form.featured ? 'fill-amber-400 text-amber-400' : ''}`} /> {form.featured ? 'Featured' : 'Feature'}
              </button>
              <button
                type="button"
                onClick={handlePublishToggle}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {form.status === 'active' ? 'Unpublish' : 'Publish'}
              </button>
            </>
          )
        }
      />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border p-5">
            <FormTabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === 'Basic Info' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Product Title</label>
                  <input value={form.title} onChange={set('title')} className={inputClass} placeholder="e.g. Boho Arch Wall Art Set" />
                  {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Slug</label>
                  <input value={form.slug} onChange={set('slug')} className={inputClass} placeholder="auto-generated from title if left blank" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Short Description</label>
                  <textarea value={form.shortDescription} onChange={set('shortDescription')} className={`${textareaClass} min-h-[60px]`} placeholder="One or two sentences shown in listings and search…" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Description</label>
                  <textarea value={form.description} onChange={set('description')} className={textareaClass} placeholder="Describe this product…" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">What's Included</h3>
                  <RichTextEditorPlaceholder
                    value={form.whatsIncluded}
                    onChange={(v) => setForm((f) => ({ ...f, whatsIncluded: v }))}
                    placeholder="Describe everything the buyer receives with this product…"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">FAQ</h3>
                  <FaqRepeater value={form.faq} onChange={(v) => setForm((f) => ({ ...f, faq: v }))} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Category</label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v, subCategoryId: '' }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{'\u2014 '.repeat(c.depth)}{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Sub Category</label>
                    <Select value={form.subCategoryId} onValueChange={set('subCategoryId')} disabled={!subCategoryOptions.length}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder={subCategoryOptions.length ? 'Select sub category' : 'No sub categories'} /></SelectTrigger>
                      <SelectContent>
                        {subCategoryOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tags</label>
                  <TagsInput value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} placeholder="e.g. printable, wall-art…" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brand</label>
                  <Select value={form.brandId} onValueChange={set('brandId')}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Product Status</label>
                  <Select value={form.status} onValueChange={set('status')}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Published</SelectItem>
                      <SelectItem value="draft">Draft (Unpublished)</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: !!v }))} /> Featured Product
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.trending} onCheckedChange={(v) => setForm((f) => ({ ...f, trending: !!v }))} /> Trending
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.bestSeller} onCheckedChange={(v) => setForm((f) => ({ ...f, bestSeller: !!v }))} /> Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.newArrival} onCheckedChange={(v) => setForm((f) => ({ ...f, newArrival: !!v }))} /> New Arrival
                  </label>
                </div>
              </div>
            )}

            {tab === 'Pricing' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Regular Price</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} className={inputClass} />
                    {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Sale Price</label>
                    <input type="number" step="0.01" min="0" value={form.salePrice} onChange={set('salePrice')} className={inputClass} placeholder="Optional" />
                    {errors.salePrice && <p className="text-xs text-red-600 mt-1">{errors.salePrice}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Discount (%)</label>
                    <input type="number" step="1" min="0" max="100" value={form.discountPercent} onChange={set('discountPercent')} className={inputClass} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tax Class</label>
                    <Select value={form.taxClass} onValueChange={set('taxClass')}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAX_CLASSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Currency</label>
                    <Select value={form.currency} onValueChange={set('currency')}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cost ($)</label>
                  <input type="number" step="0.01" min="0" value={form.cost} onChange={set('cost')} className={inputClass} />
                </div>
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
                  <h4 className="text-sm font-semibold mb-2">Commission Preview</h4>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Sale price</span><span className="font-semibold">${effectivePrice.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between text-sm mt-1"><span className="text-muted-foreground">Platform commission ({(DEFAULT_COMMISSION_RATE * 100).toFixed(0)}%)</span><span className="font-semibold text-destructive">-${commissionAmount.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-border"><span className="font-semibold">Seller earns</span><span className="font-bold">${sellerNet.toFixed(2)}</span></div>
                  <p className="text-xs text-muted-foreground mt-2">Preview only — the real commission rate is set per category/seller in Commission Rules.</p>
                </div>
              </div>
            )}

            {tab === 'Digital Files' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Thumbnail</label>
                  <ImageUploadInput value={form.thumbnail} onChange={(v) => setForm((f) => ({ ...f, thumbnail: v }))} />
                  {errors.thumbnail && <p className="text-xs text-red-600 mt-1">{errors.thumbnail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Gallery Images</label>
                  <ImageUploadInput value={form.gallery} onChange={(v) => setForm((f) => ({ ...f, gallery: v }))} multiple />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Preview Images</label>
                  <ImageUploadInput value={form.previewImages} onChange={(v) => setForm((f) => ({ ...f, previewImages: v }))} multiple />
                </div>
                <FileUploadInput
                  label="Preview Video"
                  icon={FileVideo}
                  accept="video/*"
                  multiple
                  value={form.previewVideos}
                  onChange={(v) => setForm((f) => ({ ...f, previewVideos: v }))}
                  hint="Short clips showing the product in use."
                />
                <FileUploadInput
                  label="Main Download File"
                  icon={FileArchive}
                  accept=".zip,application/zip"
                  value={form.zipFile}
                  onChange={(v) => setForm((f) => ({ ...f, zipFile: v }))}
                  hint="The primary source file a customer receives after purchase."
                />
                <FileUploadInput
                  label="Additional Download Files"
                  icon={FileArchive}
                  multiple
                  value={form.additionalFiles}
                  onChange={(v) => setForm((f) => ({ ...f, additionalFiles: v }))}
                  hint="Bonus files, alternate formats, or extras bundled with the main file."
                />
                <FileUploadInput
                  label="Documentation PDF"
                  accept="application/pdf"
                  value={form.documentationPdf}
                  onChange={(v) => setForm((f) => ({ ...f, documentationPdf: v }))}
                  hint="Usage instructions or a license PDF, if applicable."
                />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Live Demo URL</label>
                  <input value={form.liveDemoUrl} onChange={set('liveDemoUrl')} className={inputClass} placeholder="https://…" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Version Number</label>
                    <input value={form.version} onChange={set('version')} className={inputClass} placeholder="1.0.0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">File Size</label>
                    <input value={form.fileSize} onChange={set('fileSize')} className={inputClass} placeholder="e.g. 42 MB" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Changelog</label>
                  <textarea value={form.changelog} onChange={set('changelog')} className={`${textareaClass} min-h-[70px]`} placeholder="What changed in this version…" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Supported Software</label>
                  <TagsInput value={form.supportedSoftware} onChange={(v) => setForm((f) => ({ ...f, supportedSoftware: v }))} placeholder="e.g. photoshop, canva, procreate…" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Compatible Versions</label>
                  <TagsInput value={form.compatibleVersions} onChange={(v) => setForm((f) => ({ ...f, compatibleVersions: v }))} placeholder="e.g. cc-2023, cc-2024…" />
                </div>
              </div>
            )}

            {tab === 'Licensing' && (
              <LicensingEditor value={form.licenses} onChange={(v) => setForm((f) => ({ ...f, licenses: v }))} />
            )}

            {tab === 'Inventory' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">SKU</label>
                    <input value={form.sku} onChange={set('sku')} className={inputClass} placeholder="e.g. PM-WA-001" />
                    {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Barcode</label>
                    <input value={form.barcode} onChange={set('barcode')} className={inputClass} placeholder="Optional" />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox checked={form.unlimitedStock} onCheckedChange={(v) => setForm((f) => ({ ...f, unlimitedStock: !!v }))} />
                  <span className="text-sm font-semibold">Unlimited Stock</span>
                </label>
                {!form.unlimitedStock && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
                      <input type="number" min="0" value={form.stock} onChange={set('stock')} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Low Stock Alert At</label>
                      <input type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'SEO' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">SEO Title</label>
                  <input value={form.seoTitle} onChange={set('seoTitle')} className={inputClass} placeholder="Defaults to product title if left blank" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                  <textarea value={form.metaDescription} onChange={set('metaDescription')} className={textareaClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Keywords</label>
                  <TagsInput value={form.keywords} onChange={(v) => setForm((f) => ({ ...f, keywords: v }))} placeholder="e.g. wall art, printable decor…" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Open Graph Image</label>
                  <ImageUploadInput value={form.ogImage} onChange={(v) => setForm((f) => ({ ...f, ogImage: v }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Canonical URL</label>
                  <input value={form.canonicalUrl} onChange={set('canonicalUrl')} className={inputClass} placeholder="https://apnastore.org/product/…" />
                </div>
              </div>
            )}

            {tab === 'Options' && (
              <VariationsEditor value={form.variations} onChange={(v) => setForm((f) => ({ ...f, variations: v }))} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <button type="submit" disabled={saving} className="w-full px-5 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')} className="w-full px-5 py-3 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
