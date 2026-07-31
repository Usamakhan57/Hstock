import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../hooks/use-toast';
import { getFollowedSellers, unfollowSeller } from '../../services/buyerDashboard';

const FollowingPage = () => {
  const { toast } = useToast();
  const [following, setFollowing] = useState(() => getFollowedSellers());

  const unfollow = (slug, name) => {
    setFollowing(unfollowSeller(slug));
    toast({ title: 'Unfollowed', description: name });
  };

  return (
    <>
      <Seo title="Followed Sellers" description="Sellers you follow on ApnaStore." noIndex />
      <AccountLayout title="Following" subtitle="Sellers you follow — get notified when they publish something new.">
        {following.length === 0 ? (
          <EmptyState title="You're not following anyone yet" message="Follow a seller from their store page to see their new products here." actionLabel="Browse the Shop" actionTo="/shop" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {following.map((s) => (
              <div key={s.slug} className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
                <div className="h-16 brand-gradient" />
                <div className="p-5 -mt-8">
                  <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white grid place-items-center font-black text-primary soft-shadow shrink-0">
                    {s.initials}
                  </div>
                  <Link to={`/seller/${s.slug}`} className="block mt-3 font-bold text-sm hover:text-primary transition-colors">{s.name}</Link>
                  <p className="text-xs text-muted-foreground">{s.specialty}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {s.productsCount} products</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {s.followers.toLocaleString()} followers</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Link to={`/seller/${s.slug}`} className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full brand-gradient text-white hover:opacity-95 transition-opacity">
                      Visit Store
                    </Link>
                    <button onClick={() => unfollow(s.slug, s.name)} className="text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors">
                      Unfollow
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default FollowingPage;
