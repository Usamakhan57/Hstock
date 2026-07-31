import React, { useState } from 'react';
import { Laptop, Smartphone, Tablet, ShieldCheck, Trash2 } from 'lucide-react';
import Seo from '../../components/Seo';
import AccountLayout from './AccountLayout';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { usersApi } from '../../services/usersApi';

const sessions = [
  { id: 1, device: 'This browser', icon: Laptop, location: 'Current session', current: true, lastActive: 'Active now' },
];

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center shrink-0 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <span className="w-10 h-6 rounded-full bg-border peer-checked:bg-primary transition-colors" />
    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
  </label>
);

const SecurityPage = () => {
  const { toast } = useToast();
  const [twoFA, setTwoFA] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const changePassword = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      toast({ title: 'Password updated', description: 'Your password was changed successfully.' });
      form.reset();
    } catch (err) {
      toast({ title: 'Could not update password', description: err.message, variant: 'destructive' });
    }
  };

  const toggleTwoFA = () => {
    setTwoFA((v) => !v);
    toast({ title: !twoFA ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled' });
  };

  const revokeSession = (device) => {
    toast({ title: 'Session signed out', description: device });
  };

  const confirmDelete = (e) => {
    e.preventDefault();
    toast({ title: 'Account deletion requested', description: 'This is a demo — no account was actually deleted.' });
    setDeleteOpen(false);
    setConfirmText('');
  };

  return (
    <>
      <Seo title="Security" description="Manage your ApnaStore account security." noIndex />
      <AccountLayout title="Security" subtitle="Passwords, two-factor authentication, and active sessions.">
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={changePassword} className="bg-white rounded-3xl border border-border soft-shadow p-6 space-y-4 h-fit">
            <h3 className="font-bold text-sm mb-1">Change Password</h3>
            <div>
              <label className="text-sm font-medium block mb-1.5">Current password</label>
              <input name="currentPassword" type="password" required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">New password</label>
              <input name="newPassword" type="password" required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Confirm new password</label>
              <input name="confirmPassword" type="password" required className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary" />
            </div>
            <button type="submit" className="brand-gradient text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-95 transition-all">Update Password</button>
          </form>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-border soft-shadow p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Two-Factor Authentication</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security using an authenticator app.</p>
                  </div>
                </div>
                <Toggle checked={twoFA} onChange={toggleTwoFA} />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-destructive/30 soft-shadow p-6">
              <h3 className="font-bold text-sm text-destructive mb-1">Delete Account</h3>
              <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
              <button onClick={() => setDeleteOpen(true)} className="text-sm font-semibold px-5 py-2 rounded-full border border-destructive text-destructive hover:bg-destructive/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-sm mb-3">Login Sessions & Connected Devices</h3>
          <div className="bg-white rounded-3xl border border-border soft-shadow divide-y divide-border overflow-hidden">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4">
                <span className="w-10 h-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex flex-wrap items-center gap-x-2 gap-y-1">
                    {s.device}
                    {s.current && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">This device</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.location} · {s.lastActive}</p>
                </div>
                {!s.current && (
                  <button onClick={() => revokeSession(s.device)} className="text-xs font-semibold text-destructive hover:underline shrink-0">Sign out</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogTitle className="text-destructive">Delete your account?</DialogTitle>
            <DialogDescription>This will permanently remove your account, orders, and downloads. Type DELETE to confirm.</DialogDescription>
            <form onSubmit={confirmDelete} className="space-y-4 mt-2">
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE" className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-destructive" />
              <button type="submit" disabled={confirmText !== 'DELETE'} className="w-full bg-destructive text-destructive-foreground font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Permanently Delete Account
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

export default SecurityPage;
