import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Pencil, Trash2, Plus } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../hooks/use-toast';
import { buildDefaultReviews, loadLS, saveLS, uid } from '../../services/buyerDashboard';

const KEY = 'pm_buyer_reviews';
const RATINGS = [5, 4, 3, 2, 1];

const StarRow = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange?.(n)} aria-label={`${n} star`} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
        <Star className={`w-5 h-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
      </button>
    ))}
  </div>
);

const ReviewModal = ({ open, onOpenChange, orders, onSave, editing }) => {
  const purchasedProducts = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => map.set(o.product.id, o.product));
    return Array.from(map.values());
  }, [orders]);

  const [productId, setProductId] = useState(editing?.productId || purchasedProducts[0]?.id || '');
  const [rating, setRating] = useState(editing?.rating || 5);
  const [text, setText] = useState(editing?.text || '');

  const submit = (e) => {
    e.preventDefault();
    const product = purchasedProducts.find((p) => p.id === Number(productId)) || purchasedProducts[0];
    onSave({
      id: editing?.id || uid('rev'),
      productId: product?.id,
      productTitle: product?.title || editing?.productTitle,
      productImg: product?.img || editing?.productImg,
      rating,
      text,
      date: editing?.date || new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogTitle>{editing ? 'Edit Review' : 'Write a Review'}</DialogTitle>
        <DialogDescription className="sr-only">Share your feedback on a purchased product.</DialogDescription>
        <form onSubmit={submit} className="space-y-4 mt-2">
          {!editing && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Product</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary">
                {purchasedProducts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Your rating</label>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Your review</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary resize-none" placeholder="What did you think?" />
          </div>
          <button type="submit" className="brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all w-full">
            {editing ? 'Save Changes' : 'Submit Review'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ReviewsPage = () => {
  const { orders } = useStore();
  const { toast } = useToast();
  const [reviews, setReviews] = useState(() => loadLS(KEY, null) || buildDefaultReviews());
  const [ratingFilter, setRatingFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const persist = (next) => { setReviews(next); saveLS(KEY, next); };

  const filtered = ratingFilter === 'All' ? reviews : reviews.filter((r) => r.rating === ratingFilter);

  const handleSave = (review) => {
    const exists = reviews.some((r) => r.id === review.id);
    persist(exists ? reviews.map((r) => (r.id === review.id ? review : r)) : [review, ...reviews]);
    toast({ title: exists ? 'Review updated' : 'Review submitted', description: review.productTitle });
    setEditing(null);
  };

  const handleDelete = (id) => {
    persist(reviews.filter((r) => r.id !== id));
    toast({ title: 'Review deleted' });
  };

  return (
    <>
      <Seo title="My Reviews" description="Reviews you've written for products you've purchased." noIndex />
      <AccountLayout title="Reviews" subtitle="Products you've purchased and the feedback you've shared.">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button onClick={() => setRatingFilter('All')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${ratingFilter === 'All' ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}>All</button>
            {RATINGS.map((r) => (
              <button key={r} onClick={() => setRatingFilter(r)} className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${ratingFilter === r ? 'brand-gradient text-white' : 'bg-white border border-border hover:bg-secondary'}`}>
                {r} <Star className="w-3.5 h-3.5 fill-current" />
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold hover:opacity-95 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" /> Write Review
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No reviews yet" message="Once you review a purchase, it'll show up here." actionLabel="Browse the Shop" actionTo="/shop" />
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-3xl border border-border soft-shadow p-5 flex gap-4">
                <Link to={`/product/${r.productId}`} className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                  <img src={r.productImg} alt={r.productTitle} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/product/${r.productId}`} className="text-sm font-semibold hover:text-primary transition-colors">{r.productTitle}</Link>
                    <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  <StarRow value={r.rating} />
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.text}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => { setEditing(r); setModalOpen(true); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ReviewModal open={modalOpen} onOpenChange={setModalOpen} orders={orders} onSave={handleSave} editing={editing} />
      </AccountLayout>
    </>
  );
};

export default ReviewsPage;
