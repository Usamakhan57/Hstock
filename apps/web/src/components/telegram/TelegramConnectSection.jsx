import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import { telegramApi } from '../../services/telegramApi';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

const TelegramConnectSection = ({
  compact = false,
  onStatusChange,
  /** When true, poll /telegram/me after opening the bot until connected. */
  pollUntilConnected = false,
  showDisconnect = true,
  showNotificationToggle = true,
  title = 'Telegram Notifications',
  description = 'Connect once and receive marketplace updates directly in Telegram.',
  connectLabel = 'Connect Telegram',
} = {}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState({
    connected: false,
    username: null,
    telegramUserId: null,
    connectedAt: null,
    notificationsEnabled: true,
  });
  const pollTimerRef = useRef(null);
  const pollDeadlineRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setConnecting(false);
  }, []);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const next = await telegramApi.status();
      setStatus(next);
      onStatusChange?.(next);
      if (next.connected) stopPolling();
      return next;
    } catch {
      // Keep local defaults when API is unavailable.
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [onStatusChange, stopPolling]);

  useEffect(() => {
    refresh();
    return () => stopPolling();
  }, [refresh, stopPolling]);

  const startPolling = useCallback(() => {
    if (!pollUntilConnected) return;
    stopPolling();
    setConnecting(true);
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
    pollTimerRef.current = setInterval(async () => {
      if (Date.now() > pollDeadlineRef.current) {
        stopPolling();
        toast({
          title: 'Still waiting for Telegram',
          description: 'Open the bot and press Start, then click Connect Telegram again.',
        });
        return;
      }
      await refresh({ silent: true });
    }, POLL_INTERVAL_MS);
  }, [pollUntilConnected, refresh, stopPolling, toast]);

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
      if (result.status) {
        setStatus(result.status);
        onStatusChange?.(result.status);
        if (result.status.connected) {
          stopPolling();
          return;
        }
      }
      startPolling();
    } catch (err) {
      toast({
        title: 'Could not start Telegram connect',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      stopPolling();
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

  const statusLabel = status.connected
    ? 'Telegram Connected ✅'
    : connecting
      ? 'Connecting...'
      : 'Not Connected';

  return (
    <div className={`bg-white rounded-3xl border border-border soft-shadow ${compact ? 'p-5' : 'p-6'} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-[#229ED9]" />
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
        <p className="font-semibold">Connection Status</p>
        {status.connected ? (
          <p className="mt-1 text-emerald-700 font-medium">○ {statusLabel}</p>
        ) : connecting ? (
          <p className="mt-1 text-sky-700 font-medium inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ○ {statusLabel}
          </p>
        ) : (
          <p className="mt-1 text-muted-foreground">○ {statusLabel}</p>
        )}
      </div>

      {status.connected ? (
        <>
          <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#229ED9]/30 bg-[#229ED9]/10 px-5 text-sm font-semibold text-emerald-800">
            <Send className="h-4 w-4 text-[#229ED9]" />
            Telegram Connected ✅
            {status.username ? (
              <span className="font-medium text-emerald-700/80">@{status.username}</span>
            ) : null}
          </div>

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

          {showNotificationToggle ? (
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
          ) : null}

          {showDisconnect ? (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-secondary/60 transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Disconnect Telegram
            </button>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={busy || loading}
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-all disabled:opacity-60"
          style={{ backgroundColor: '#229ED9' }}
        >
          {busy || connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {connecting ? 'Connecting...' : connectLabel}
        </button>
      )}
    </div>
  );
};

export default TelegramConnectSection;
