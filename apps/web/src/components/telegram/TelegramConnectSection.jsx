import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import { telegramApi } from '../../services/telegramApi';

const TelegramConnectSection = ({ compact = false, onStatusChange } = {}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({
    connected: false,
    username: null,
    telegramUserId: null,
    connectedAt: null,
    notificationsEnabled: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await telegramApi.status();
      setStatus(next);
      onStatusChange?.(next);
    } catch {
      // Keep local defaults when API is unavailable.
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = async () => {
    setBusy(true);
    try {
      const result = await telegramApi.connect();
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        toast({
          title: 'Continue in Telegram',
          description: 'Press Start in the ApnaStore bot to finish connecting.',
        });
      }
      if (result.status) setStatus(result.status);
    } catch (err) {
      toast({
        title: 'Could not start Telegram connect',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      const next = await telegramApi.disconnect();
      setStatus(next);
      onStatusChange?.(next);
      toast({ title: 'Telegram disconnected', description: 'Marketplace alerts will no longer be sent to Telegram.' });
    } catch (err) {
      toast({
        title: 'Could not disconnect Telegram',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const toggleNotifications = async (checked) => {
    setBusy(true);
    try {
      const next = await telegramApi.updateSettings({ notificationsEnabled: checked });
      setStatus(next);
      onStatusChange?.(next);
      toast({
        title: checked ? 'Telegram notifications enabled' : 'Telegram notifications disabled',
      });
    } catch (err) {
      toast({
        title: 'Could not update Telegram settings',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-border soft-shadow ${compact ? 'p-5' : 'p-6'} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Telegram Notifications
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Connect once and receive marketplace updates directly in Telegram.
          </p>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
        <p className="font-semibold">Connection Status</p>
        {status.connected ? (
          <p className="mt-1 text-emerald-700 font-medium">🟢 Connected</p>
        ) : (
          <p className="mt-1 text-muted-foreground">○ Not Connected</p>
        )}
      </div>

      {status.connected ? (
        <>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Telegram Username</p>
              <p className="font-semibold mt-1">{status.username ? `@${status.username}` : '—'}</p>
            </div>
            <div className="rounded-2xl border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Telegram ID</p>
              <p className="font-semibold mt-1 break-all">{status.telegramUserId || '—'}</p>
            </div>
          </div>

          <label className="flex items-start justify-between gap-3 cursor-pointer py-1">
            <span>
              <span className="block text-sm font-medium">Receive Telegram Notifications</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Enable or disable marketplace alerts without disconnecting.
              </span>
            </span>
            <Switch
              checked={status.notificationsEnabled}
              onCheckedChange={toggleNotifications}
              disabled={busy}
              className="mt-0.5 shrink-0"
            />
          </label>

          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary/60 transition-colors disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Disconnect Telegram
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={busy || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full brand-gradient text-white text-sm font-semibold soft-shadow hover:opacity-95 transition-all disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Connect Telegram
        </button>
      )}
    </div>
  );
};

export default TelegramConnectSection;
