import React, { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import EmptyState from '../../../admin/components/EmptyState';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const RatingStars = ({ value }) => (
  <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} className={`text-sm ${n <= value ? 'text-amber-400' : 'text-border'}`}>★</span>
    ))}
  </span>
);

const SellerReviewsTab = ({ reviews: initialReviews }) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openReplyId, setOpenReplyId] = useState(null);

  const overallRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;

  const breakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
    return counts;
  }, [reviews]);

  const filtered = ratingFilter === 'all' ? reviews : reviews.filter((r) => String(r.rating) === ratingFilter);

  const submitReply = (id) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text) return;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: text } : r)));
    setOpenReplyId(null);
  };

  return (
    <div>
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 text-center">
          <p className="text-5xl font-black tracking-tight">{overallRating.toFixed(1)}</p>
          <div className="flex justify-center mt-2"><RatingStars value={Math.round(overallRating)} /></div>
          <p className="text-xs text-muted-foreground mt-1.5">Based on {reviews.length} reviews</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-border soft-shadow p-6 space-y-2.5">
          <h3 className="font-bold mb-1">Rating Breakdown</h3>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0;
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-10 shrink-0 font-medium">{star} star</span>
                <Progress value={pct} className="flex-1" />
                <span className="w-6 shrink-0 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Customer Reviews</h3>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[160px] rounded-full text-sm"><SelectValue placeholder="Filter by rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} Star</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
        {filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No reviews here" description="Reviews matching this rating will show up here." />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li key={r.id} className="py-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <img src={r.productImg} alt="" className="w-9 h-9 rounded-lg object-cover bg-secondary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{r.product}</p>
                    <p className="text-xs text-muted-foreground">{r.buyer} · {fmtDate(r.date)}</p>
                  </div>
                  <RatingStars value={r.rating} />
                </div>
                <p className="text-sm text-foreground/80 mt-2">"{r.text}"</p>

                {r.reply ? (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-border">
                    <p className="text-xs font-semibold text-primary mb-0.5">Your reply</p>
                    <p className="text-sm text-muted-foreground">{r.reply}</p>
                  </div>
                ) : openReplyId === r.id ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={replyDrafts[r.id] || ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Write a reply…"
                      className="flex-1 rounded-xl border border-border px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button onClick={() => submitReply(r.id)} className="px-4 py-2 rounded-full brand-gradient text-white text-xs font-semibold">Send</button>
                    <button onClick={() => setOpenReplyId(null)} className="px-3 py-2 rounded-full border border-border text-xs font-semibold hover:bg-secondary transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setOpenReplyId(r.id)} className="mt-3 text-xs font-semibold text-primary hover:underline">
                    Reply
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SellerReviewsTab;
