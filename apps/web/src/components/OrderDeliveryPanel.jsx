import React, { useMemo, useState } from 'react';
import { Download, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { ordersApi } from '../services/ordersApi';
import { NetworkErrorState } from './ErrorState';

const FIELD_LABELS = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  recovery: 'Recovery',
  '2fa': '2FA',
  cookie: 'Cookie',
  token: 'Token',
  licenseKey: 'License Key',
  apiKey: 'API Key',
  note: 'Note',
};

function preferredFieldOrder(keys = []) {
  const priority = ['email', 'username', 'password', 'recovery', '2fa', 'cookie', 'token', 'licenseKey', 'apiKey', 'note'];
  const rest = keys.filter((key) => !priority.includes(key));
  return [...priority.filter((key) => keys.includes(key)), ...rest];
}

function buildTxt(accounts = []) {
  return accounts.map((account, index) => {
    const keys = preferredFieldOrder(account.fieldKeys || Object.keys(account.fields || {}));
    const lines = keys.map((key) => `${FIELD_LABELS[key] || key}: ${account.fields?.[key] ?? ''}`);
    return [`Account ${index + 1}`, ...lines].join('\n');
  }).join('\n\n');
}

function buildCsv(accounts = []) {
  const allKeys = preferredFieldOrder([
    ...new Set(accounts.flatMap((account) => account.fieldKeys || Object.keys(account.fields || {}))),
  ]);
  const header = allKeys.map((key) => FIELD_LABELS[key] || key).join(',');
  const rows = accounts.map((account) => allKeys.map((key) => {
    const value = String(account.fields?.[key] ?? '');
    return `"${value.replace(/"/g, '""')}"`;
  }).join(','));
  return [header, ...rows].join('\n');
}

function downloadBlob(filename, content, mime) {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadZip(filename, accounts = []) {
  const txt = buildTxt(accounts);
  const csv = buildCsv(accounts);
  // Minimal ZIP (store only) so buyers can download without extra deps.
  const encoder = new TextEncoder();
  const files = [
    { name: 'credentials.txt', data: encoder.encode(txt) },
    { name: 'credentials.csv', data: encoder.encode(csv) },
  ];

  const localHeaders = [];
  const fileParts = [];
  let offset = 0;
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    return table;
  })();
  const crc32 = (buf) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i += 1) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const u16 = (n) => {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
  };
  const u32 = (n) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, true);
    return b;
  };

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array([
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(crc),
      ...u32(file.data.length),
      ...u32(file.data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...nameBytes,
    ]);
    localHeaders.push({
      nameBytes,
      crc,
      size: file.data.length,
      offset,
    });
    fileParts.push(local, file.data);
    offset += local.length + file.data.length;
  }

  const centralParts = [];
  let centralSize = 0;
  for (const entry of localHeaders) {
    const central = new Uint8Array([
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(entry.crc),
      ...u32(entry.size),
      ...u32(entry.size),
      ...u16(entry.nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(entry.offset),
      ...entry.nameBytes,
    ]);
    centralParts.push(central);
    centralSize += central.length;
  }
  const end = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(localHeaders.length),
    ...u16(localHeaders.length),
    ...u32(centralSize),
    ...u32(offset),
    ...u16(0),
  ]);

  const zip = new Blob([...fileParts, ...centralParts, end], { type: 'application/zip' });
  downloadBlob(filename, zip, 'application/zip');
}

const OrderDeliveryPanel = ({ orderId, deliveryStatus }) => {
  const { data, loading, error, retry } = useFetch(
    () => (orderId ? ordersApi.getDelivery(orderId) : Promise.resolve(null)),
    [orderId],
  );
  const [revealed, setRevealed] = useState(false);

  const accounts = data?.accounts || [];
  const delivered = Boolean(data?.delivered);
  const fieldKeys = useMemo(
    () => preferredFieldOrder([
      ...new Set(accounts.flatMap((account) => account.fieldKeys || Object.keys(account.fields || {}))),
    ]),
    [accounts],
  );

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-border soft-shadow p-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading delivery…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
        <NetworkErrorState onRetry={retry} message={error.message} />
      </div>
    );
  }

  if (!delivered || !accounts.length) {
    if (deliveryStatus === 'awaiting_delivery') {
      return (
        <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
          <h2 className="font-bold mb-2">Delivery</h2>
          <p className="text-sm text-muted-foreground">
            Awaiting seller delivery. Escrow remains held until release.
          </p>
        </div>
      );
    }
    return null;
  }

  const safeId = String(orderId || 'order').replace(/[^\w.-]+/g, '_');

  return (
    <div className="bg-white rounded-3xl border border-border soft-shadow p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold inline-flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            Download Account
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Delivery: Delivered · Credentials stay available after completion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
          >
            {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {revealed ? 'Hide credentials' : 'View Credentials'}
          </button>
          <button
            type="button"
            onClick={() => downloadBlob(`${safeId}-credentials.txt`, buildTxt(accounts))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full brand-gradient text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Download TXT
          </button>
          <button
            type="button"
            onClick={() => downloadBlob(`${safeId}-credentials.csv`, buildCsv(accounts), 'text/csv;charset=utf-8')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>
          <button
            type="button"
            onClick={() => downloadZip(`${safeId}-credentials.zip`, accounts)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-secondary"
          >
            <Download className="w-3.5 h-3.5" /> Download ZIP
          </button>
        </div>
      </div>

      {revealed ? (
        <div className="space-y-4">
          {accounts.map((account, index) => (
            <div key={account.id || index} className="rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {account.label || `Account ${index + 1}`}
              </p>
              <dl className="space-y-2">
                {preferredFieldOrder(account.fieldKeys || fieldKeys).map((key) => (
                  account.fields?.[key] ? (
                    <div key={key} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
                      <dt className="text-muted-foreground">{FIELD_LABELS[key] || key}</dt>
                      <dd className="font-mono break-all font-semibold">{account.fields[key]}</dd>
                    </div>
                  ) : null
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Click View Credentials to reveal account details, or download TXT / CSV / ZIP.
        </p>
      )}
    </div>
  );
};

export default OrderDeliveryPanel;
