import React, { useState } from 'react';
import { Loader2, Users, Package, CalendarDays } from 'lucide-react';
import ImageUploadInput from '../../../admin/components/ImageUploadInput';
import { inputClass, textareaClass } from '../../../admin/components/FormSheet';
import TelegramConnectSection from '../../../components/telegram/TelegramConnectSection';
import { useToast } from '../../../hooks/use-toast';
import { usersApi } from '../../../services/usersApi';

const SellerProfileTab = ({ seller, productsCount, joinedDate }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    avatar: seller?.avatar || '',
    cover: seller?.banner || seller?.cover || '',
    name: seller?.ownerName || seller?.name || '',
    bio: seller?.bio || '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ownerName: form.name.trim() || undefined,
        bio: form.bio,
      };
      if (form.avatar && (form.avatar.startsWith('http') || form.avatar.startsWith('data:'))) {
        payload.avatar = form.avatar;
      }
      if (form.cover && (form.cover.startsWith('http') || form.cover.startsWith('data:'))) {
        payload.banner = form.cover;
      }
      await usersApi.updateSellerProfile(payload);
      toast({ title: 'Profile saved', description: 'Your public seller profile was updated.' });
    } catch (err) {
      toast({ title: 'Could not save profile', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-border soft-shadow overflow-hidden">
          <div className="h-36 bg-secondary relative">
            {form.cover ? (
              <img src={form.cover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20" />
            )}
          </div>
          <div className="p-6 pt-0 -mt-10">
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white overflow-hidden soft-shadow">
              {form.avatar ? (
                <img src={form.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full brand-gradient grid place-items-center text-white font-bold">
                  {(form.name || seller?.name || 'S').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Profile Image</label>
                <ImageUploadInput value={form.avatar} onChange={(v) => setForm((f) => ({ ...f, avatar: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cover Image</label>
                <ImageUploadInput value={form.cover} onChange={(v) => setForm((f) => ({ ...f, cover: v }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4">
          <h3 className="font-bold">About</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input value={form.name} onChange={set('name')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={set('bio')} className={textareaClass} placeholder="Tell buyers about yourself and your work…" />
          </div>
        </div>

        <TelegramConnectSection pollUntilConnected />

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-all disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Profile
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-border soft-shadow p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center shrink-0"><Package className="w-4.5 h-4.5 text-primary" /></span>
          <div>
            <p className="text-xs text-muted-foreground">Products</p>
            <p className="font-bold">{productsCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border soft-shadow p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center shrink-0"><Users className="w-4.5 h-4.5 text-primary" /></span>
          <div>
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="font-bold">{seller?.followersCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-border soft-shadow p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center shrink-0"><CalendarDays className="w-4.5 h-4.5 text-primary" /></span>
          <div>
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="font-bold">{joinedDate}</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SellerProfileTab;
