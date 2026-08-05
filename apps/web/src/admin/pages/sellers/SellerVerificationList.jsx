import React, { useEffect, useState } from 'react';
import { BadgeCheck, ShieldOff, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import {
  listSellerVerifications,
  verifySeller,
  unverifySeller,
} from '../../api/sellerVerification';
import { useToast } from '../../../hooks/use-toast';

const SellerVerificationList = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('true');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await listSellerVerifications({
        limit: 100,
        verified: filter,
        search: search.trim() || undefined,
      });
      setRows(list.items || []);
    } catch (err) {
      toast({
        title: 'Failed to load verifications',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await load();
  };

  const handleVerify = async (row) => {
    if (!window.confirm(`Manually verify ${row.storeName || 'this seller'}?`)) return;
    setBusy(true);
    try {
      await verifySeller(row.id || row._id);
      toast({ title: 'Seller verified' });
      await load();
    } catch (err) {
      toast({ title: 'Verify failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleUnverify = async (row, refund = false) => {
    const label = refund
      ? `Remove verification and refund $${Number(row.verificationFeePaid || 0).toFixed(2)} to ${row.storeName}?`
      : `Remove verification for ${row.storeName || 'this seller'}?`;
    if (!window.confirm(label)) return;
    setBusy(true);
    try {
      await unverifySeller(row.id || row._id, { refund });
      toast({ title: refund ? 'Verification removed with refund' : 'Verification removed' });
      await load();
    } catch (err) {
      toast({ title: 'Remove failed', description: err?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Seller Verification"
        description="Permanent Verified Seller badges purchased from seller wallets or granted manually."
      />

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search seller name, email, or slug"
            className="w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-full border border-border bg-white px-4 py-2.5 text-sm"
        >
          <option value="true">Verified</option>
          <option value="false">Not verified</option>
          <option value="all">All sellers</option>
        </select>
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          Search
        </button>
      </form>

      <DataTable
        isLoading={loading}
        data={rows}
        searchKeys={['storeName', 'email', 'slug']}
        columns={[
          {
            key: 'seller',
            label: 'Seller',
            render: (row) => (
              <div>
                <p className="font-semibold">{row.storeName || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  /{row.slug || '—'}
                  {row.email ? ` · ${row.email}` : ''}
                </p>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <StatusBadge status={row.verified === true ? 'active' : 'pending'} />
            ),
          },
          {
            key: 'source',
            label: 'Source',
            render: (row) => row.verificationSource || '—',
          },
          {
            key: 'fee',
            label: 'Fee paid',
            render: (row) => (
              row.verificationFeePaid != null
                ? `$${Number(row.verificationFeePaid).toFixed(2)}`
                : '—'
            ),
          },
          {
            key: 'verifiedAt',
            label: 'Verified at',
            render: (row) => (
              row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '—'
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                {row.verified !== true ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleVerify(row)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" /> Verify
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleUnverify(row, false)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                    >
                      <ShieldOff className="h-3.5 w-3.5" /> Remove
                    </button>
                    {row.verificationSource === 'wallet' && Number(row.verificationFeePaid) > 0 ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUnverify(row, true)}
                        className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                      >
                        Refund fee
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SellerVerificationList;
