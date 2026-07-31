import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import EmptyState from '../../components/EmptyState';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../hooks/use-toast';
import { usersApi } from '../../services/usersApi';

const Field = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-medium block mb-1.5">{label}</label>
    <input {...props} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
  </div>
);

const ProfilePage = () => {
  const { user, profiles, refreshProfile } = useStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [details, setDetails] = useState({
    username: '',
    phone: user?.phone || '',
    country: user?.country || '',
    address: '',
    city: '',
    postalCode: '',
    bio: '',
    instagram: '',
    twitter: '',
    website: '',
    avatar: user?.avatar || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const buyer = profiles?.buyer || {};
    setName(user?.name || '');
    setDetails((prev) => ({
      ...prev,
      username: buyer.username || prev.username || '',
      phone: user?.phone || buyer.phone || '',
      country: user?.country || buyer.country || '',
      bio: buyer.bio || '',
      address: buyer.address?.line1 || buyer.address || '',
      city: buyer.address?.city || buyer.city || '',
      postalCode: buyer.address?.postalCode || buyer.postalCode || '',
      instagram: buyer.social?.instagram || '',
      twitter: buyer.social?.twitter || '',
      website: buyer.social?.website || '',
      avatar: user?.avatar || buyer.avatar || '',
    }));
  }, [user, profiles]);

  const set = (k) => (e) => setDetails({ ...details, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateMe({
        name: name.trim(),
        phone: details.phone || undefined,
        country: details.country || undefined,
        avatar: details.avatar || undefined,
      });
      await usersApi.updateBuyerProfile({
        username: details.username || undefined,
        bio: details.bio || undefined,
        avatar: details.avatar || undefined,
        address: {
          line1: details.address || undefined,
          city: details.city || undefined,
          postalCode: details.postalCode || undefined,
          country: details.country || undefined,
        },
        social: {
          instagram: details.instagram || undefined,
          twitter: details.twitter || undefined,
          website: details.website || undefined,
        },
      });
      await refreshProfile();
      toast({ title: 'Profile saved', description: 'Your account details were updated.' });
    } catch (err) {
      toast({
        title: 'Could not save profile',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <>
      <Seo title="My Profile" description="Manage your ApnaStore account details." noIndex />
      <AccountLayout title="Profile" subtitle="Manage your personal account details.">
        {!user ? (
          <EmptyState title="You're not signed in" message="Sign in to view and edit your profile." actionLabel="Sign In" actionTo="/login" />
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            <form onSubmit={save} className="md:col-span-2 space-y-5">
              <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
                <div className="h-28 brand-gradient relative">
                  <button type="button" className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors">
                    <Camera className="w-3.5 h-3.5" /> Change Cover
                  </button>
                </div>
                <div className="px-6 pb-6">
                  <div className="-mt-10 flex items-end gap-3">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white soft-shadow grid place-items-center text-2xl font-black text-primary overflow-hidden">
                        {details.avatar ? (
                          <img src={details.avatar} alt="" className="w-full h-full object-cover" />
                        ) : initials}
                      </div>
                      <button type="button" aria-label="Change profile photo" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full brand-gradient text-white grid place-items-center soft-shadow">
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
                <h3 className="font-bold text-sm">Basic Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Field label="Username" value={details.username} onChange={set('username')} placeholder="@handle" />
                  <div>
                    <label className="text-sm font-medium block mb-1.5" htmlFor="email">Email</label>
                    <input id="email" value={user.email} disabled className="w-full bg-secondary/40 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent text-muted-foreground cursor-not-allowed" />
                  </div>
                  <Field label="Phone" value={details.phone} onChange={set('phone')} placeholder="+92 300 1234567" />
                  <Field label="Avatar URL" value={details.avatar} onChange={set('avatar')} placeholder="https://…" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Bio</label>
                  <textarea value={details.bio} onChange={set('bio')} rows={3} className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary resize-none" placeholder="A little about you…" />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
                <h3 className="font-bold text-sm">Location</h3>
                <Field label="Address" value={details.address} onChange={set('address')} />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City" value={details.city} onChange={set('city')} />
                  <Field label="Postal code" value={details.postalCode} onChange={set('postalCode')} />
                  <Field label="Country" value={details.country} onChange={set('country')} />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
                <h3 className="font-bold text-sm">Social Links</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Instagram" value={details.instagram} onChange={set('instagram')} placeholder="instagram.com/you" />
                  <Field label="Twitter / X" value={details.twitter} onChange={set('twitter')} placeholder="x.com/you" />
                  <Field label="Website" value={details.website} onChange={set('website')} placeholder="yoursite.com" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all inline-flex items-center gap-2 disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </form>
            <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4 h-fit">
              <h3 className="font-bold text-sm">Account overview</h3>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email</span><span className="font-semibold truncate ml-4">{user.email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Roles</span><span className="font-semibold">{(user.roles || []).join(', ') || 'buyer'}</span></div>
              <Link to="/orders" className="inline-flex text-sm font-semibold text-primary hover:underline">View order history</Link>
            </div>
          </div>
        )}
      </AccountLayout>
    </>
  );
};

export default ProfilePage;
