import React, { useEffect, useState } from 'react';
import { Activity, Bell, Radio, Send, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { useToast } from '../../../hooks/use-toast';
import { telegramAdminApi } from '../../api/telegramAdmin';

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security Alerts' },
  { value: 'platform_update', label: 'Platform Updates' },
  { value: 'new_feature', label: 'New Features' },
  { value: 'system_notice', label: 'System Notices' },
  { value: 'holiday', label: 'Holiday Messages' },
  { value: 'promotion', label: 'Marketplace Promotions' },
  { value: 'new_category', label: 'New Categories' },
  { value: 'payment_method', label: 'New Payment Methods' },
  { value: 'general', label: 'General' },
];

const TelegramAdmin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'general',
    audience: 'connected',
  });

  const load = async (q = search) => {
    setLoading(true);
    try {
      const [stats, userResult, logResult, broadcastResult] = await Promise.all([
        telegramAdminApi.overview(),
        telegramAdminApi.connectedUsers({ search: q || undefined }),
        telegramAdminApi.logs({ limit: 20 }),
        telegramAdminApi.broadcasts({ limit: 20 }),
      ]);
      setOverview(stats);
      setUsers(userResult.items);
      setLogs(logResult.items);
      setBroadcasts(broadcastResult.items);
    } catch (err) {
      toast({
        title: 'Could not load Telegram admin data',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await telegramAdminApi.createBroadcast(form);
      setForm((f) => ({ ...f, title: '', message: '' }));
      toast({ title: 'Broadcast queued', description: 'Messages are being delivered to connected users.' });
      await load();
    } catch (err) {
      toast({
        title: 'Broadcast failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading && !overview) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const bot = overview?.bot || {};

  return (
    <div>
      <PageHeader
        title="Telegram"
        description="Bot status, connected users, delivery logs, and marketplace announcements."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bot Status" value={bot.online ? 'Online' : (bot.enabled ? 'Offline' : 'Disabled')} icon={Activity} />
        <StatCard label="Connected Users" value={overview?.connectedUsers ?? 0} icon={Users} />
        <StatCard label="Messages Sent" value={overview?.messagesSent ?? 0} icon={Send} />
        <StatCard label="Failed Messages" value={overview?.messagesFailed ?? 0} icon={Bell} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Bot Status</h2>
          </div>
          <div className="text-sm flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Enabled</span>
            <span className="font-medium">{bot.enabled ? 'yes' : 'no'}</span>
          </div>
          <div className="text-sm flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Mode</span>
            <span className="font-medium">{bot.mode || '—'}</span>
          </div>
          <div className="text-sm flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium">{bot.bot?.username ? `@${bot.bot.username}` : (bot.botUsername ? `@${bot.botUsername}` : '—')}</span>
          </div>
          <div className="text-sm flex justify-between py-2">
            <span className="text-muted-foreground">Online</span>
            <span className="font-medium">{bot.online ? 'yes' : 'no'}</span>
          </div>
        </div>

        <form onSubmit={sendBroadcast} className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-semibold text-sm">Broadcast Message</h2>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Announcement title"
            required
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm min-h-[110px]"
            placeholder="Write a marketplace announcement…"
            required
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-xl border border-border px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              className="rounded-xl border border-border px-3 py-2 text-sm"
            >
              <option value="connected">All connected users</option>
              <option value="buyers">Buyers</option>
              <option value="sellers">Sellers</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full brand-gradient text-white text-sm font-semibold disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending…' : 'Send Broadcast'}
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-sm">Search Connected Users</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                load(search);
              }}
              className="flex gap-2"
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-border px-3 py-1.5 text-sm"
                placeholder="Name, email, @username"
              />
              <button type="submit" className="text-sm font-semibold text-primary">Search</button>
            </form>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No connected users found.</p>
            ) : users.map((u) => (
              <div key={u.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <p className="text-xs mt-1">
                  {u.telegram?.username ? `@${u.telegram.username}` : '—'} · ID {u.telegram?.telegramUserId || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-sm mb-4">Recent Logs</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Telegram logs yet.</p>
            ) : logs.map((log) => (
              <div key={log._id || `${log.createdAt}-${log.title}`} className="rounded-xl border border-border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{log.title || log.eventType || 'Message'}</p>
                  <span className="text-xs capitalize text-muted-foreground">{log.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{log.user?.email || log.kind}</p>
                {log.error && <p className="text-xs text-red-600 mt-1">{log.error}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-sm mb-4">Broadcast History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-medium">Title</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Sent</th>
                <th className="py-2 font-medium">Failed</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">No broadcasts yet.</td>
                </tr>
              ) : broadcasts.map((b) => (
                <tr key={b._id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium">{b.title}</td>
                  <td className="py-2 pr-3 capitalize">{String(b.category || '').replaceAll('_', ' ')}</td>
                  <td className="py-2 pr-3 capitalize">{b.status}</td>
                  <td className="py-2 pr-3">{b.stats?.sent ?? 0}</td>
                  <td className="py-2">{b.stats?.failed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TelegramAdmin;
