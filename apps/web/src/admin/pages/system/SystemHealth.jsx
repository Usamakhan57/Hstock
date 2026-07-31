import React, { useEffect, useState } from 'react';
import { Activity, Database, Mail, Radio, Server } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { getSystemHealth } from '../../api/adminOps';

const StatusRow = ({ label, value, ok }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={ok === false ? 'text-red-600 font-medium' : 'font-medium capitalize'}>{value}</span>
  </div>
);

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!health) return <p className="text-sm text-muted-foreground">Unable to load system health.</p>;

  const queueTotal = Object.values(health.queues || {}).reduce((s, n) => s + Number(n || 0), 0);

  return (
    <div>
      <PageHeader title="System Health" description={`${health.service || 'HStock'} — ${health.environment || 'production'}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Status" value={health.status || 'unknown'} icon={Activity} />
        <StatCard label="Uptime (s)" value={health.uptimeSeconds ?? '—'} icon={Server} />
        <StatCard label="Queue Jobs" value={queueTotal} icon={Radio} />
        <StatCard label="Socket Clients" value={health.socket?.clients ?? 0} icon={Radio} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Database</h2>
          </div>
          <StatusRow label="Connected" value={health.database?.connected ? 'yes' : 'no'} ok={health.database?.connected} />
          <StatusRow label="Status" value={health.database?.status || '—'} ok={health.database?.connected} />
          <StatusRow label="Name" value={health.database?.name || '—'} />
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Email & Integrations</h2>
          </div>
          <StatusRow label="Email" value={health.email?.ok ? 'ok' : (health.email?.status || 'unknown')} ok={health.email?.ok !== false} />
          <StatusRow label="Cryptomus" value={health.cryptomus?.configured ? health.cryptomus.mode : 'not configured'} />
          <StatusRow label="Jobs" value={health.jobsEnabled ? 'enabled' : 'disabled'} />
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-4">Queues</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(health.queues || {}).map(([name, size]) => (
              <div key={name} className="rounded-xl border border-border p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground capitalize">{name}</p>
                <p className="text-lg font-semibold">{size}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
