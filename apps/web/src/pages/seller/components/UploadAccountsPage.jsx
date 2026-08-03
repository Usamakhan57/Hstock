import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { getSellerProduct, updateSellerProduct, replaceSellerInventory } from '../api/sellerProducts';
import InventoryImportSection from './InventoryImportSection';
import {
  countReadyInventory,
  getDeliveryLabel,
  isInventoryRequired,
  isManualDelivery,
} from '../lib/sellerDelivery';

const UploadAccountsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return undefined;
    let mounted = true;
    setLoading(true);
    getSellerProduct(productId)
      .then((item) => {
        if (!mounted) return;
        setProduct(item);
        if (item && isManualDelivery(item.deliveryType)) {
          toast({
            title: 'Inventory import not required',
            description: 'Manual Delivery products manage stock without account imports.',
          });
          navigate(`/seller/products/${productId}/edit`, { replace: true });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [productId, navigate, toast]);

  const saveAndPublish = async () => {
    if (!productId || !product) return;

    if (isInventoryRequired(product.deliveryType) && countReadyInventory(accounts) < 1) {
      toast({
        title: 'Inventory required',
        description: 'Import and validate at least one account before publishing Instant Access stock.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const liveStock = countReadyInventory(accounts);
      await replaceSellerInventory(productId, accounts, { sourceFormat: 'paste' });
      await updateSellerProduct(productId, {
        ...product,
        status: 'live',
        stock: liveStock,
        stockType: 'limited',
        inventoryType: 'tracked',
      }, { publish: true });
      toast({ title: 'Product is live', description: `${liveStock} accounts are ready for delivery inventory.` });
      navigate('/seller/products');
    } catch (error) {
      toast({ title: 'Could not publish stock', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
        Loading inventory tools…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Product not found.</p>
        <Link to="/seller/products" className="mt-3 inline-flex text-sm font-semibold text-primary">Back to products</Link>
      </div>
    );
  }

  if (isManualDelivery(product.deliveryType)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <Link to="/seller/products" className="inline-flex items-center gap-1 text-primary hover:opacity-80">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
            </div>
            <h2 className="mt-2 text-2xl font-black">Upload accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.title || 'Product'} · {getDeliveryLabel(product.deliveryType)} inventory workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Stock validation
            </div>
            <p className="mt-1">Support for duplicate detection, bulk actions, and live counters.</p>
          </div>
        </div>
      </div>

      <InventoryImportSection
        productId={productId}
        accounts={accounts}
        onAccountsChange={setAccounts}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={saveAndPublish}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          Save stock & go live
        </button>
      </div>
    </div>
  );
};

export default UploadAccountsPage;
