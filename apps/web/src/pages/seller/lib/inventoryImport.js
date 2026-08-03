/** Parse / validate helpers for seller inventory import. */

const DIVIDER_MAP = Object.freeze({
  tab: '\t',
  comma: ',',
  semicolon: ';',
  pipe: '|',
});

const INVENTORY_FIELD_KEYS = Object.freeze([
  'email',
  'password',
  'recovery',
  '2fa',
  'cookie',
  'token',
]);

export function getDividerChar(divider) {
  return DIVIDER_MAP[divider] || '\t';
}

/**
 * RFC 4180-style record parser.
 * Preserves quoted fields that contain the separator, newlines, tabs, pipes, etc.
 */
export function parseDelimitedRecords(rawText, separator) {
  const text = String(rawText || '');
  const records = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  const pushRow = () => {
    // Keep rows that have any non-empty field (including whitespace-only credentials).
    if (row.some((value) => String(value).length > 0)) {
      records.push(row);
    }
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === separator) {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      pushRow();
      i += 1;
      continue;
    }

    if (ch === '\r') {
      row.push(field);
      field = '';
      pushRow();
      if (text[i + 1] === '\n') i += 1;
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  row.push(field);
  pushRow();
  return records;
}

/**
 * Map raw columns onto the fixed Gmail inventory schema.
 * If a naive split produced >6 columns (unquoted commas inside 2FA), rejoin the
 * middle columns back into the 2FA field using the original separator.
 */
export function projectInventoryColumns(values = [], separator = ',') {
  const cols = Array.isArray(values) ? values.map((value) => String(value ?? '')) : [];

  if (cols.length <= 6) {
    return {
      email: cols[0] || '',
      password: cols[1] || '',
      recovery: cols[2] || '',
      '2fa': cols[3] || '',
      cookie: cols[4] || '',
      token: cols[5] || '',
    };
  }

  return {
    email: cols[0] || '',
    password: cols[1] || '',
    recovery: cols[2] || '',
    '2fa': cols.slice(3, -2).join(separator),
    cookie: cols[cols.length - 2] || '',
    token: cols[cols.length - 1] || '',
  };
}

export function parseInventoryText(rawText, divider = 'tab') {
  const text = String(rawText || '');
  if (!text.trim()) return [];

  const separator = getDividerChar(divider);
  const records = parseDelimitedRecords(text, separator);

  return records.map((values, index) => {
    const fields = projectInventoryColumns(values, separator);
    return {
      id: `row-${index + 1}`,
      values: INVENTORY_FIELD_KEYS.map((key) => fields[key] || ''),
      status: 'pending',
      fields,
    };
  });
}

export function detectDuplicateEmails(accounts = []) {
  const seen = new Map();
  const duplicates = new Set();

  accounts.forEach((account) => {
    const email = String(account?.fields?.email || account?.values?.[0] || '')
      .trim()
      .toLowerCase();
    if (!email) return;
    if (seen.has(email)) {
      duplicates.add(seen.get(email));
      duplicates.add(account.id);
    } else {
      seen.set(email, account.id);
    }
  });

  return duplicates;
}

/**
 * Validate imported rows: email shape + duplicate detection.
 * Returns a new accounts array with status/validation updates.
 */
export function validateInventoryAccounts(accounts = []) {
  const duplicateIds = detectDuplicateEmails(accounts);

  return accounts.map((account) => {
    const email = String(account?.fields?.email || account?.values?.[0] || '').trim();
    const hasEmail = Boolean(email);
    const emailOk = /@/.test(email);
    const isDuplicate = duplicateIds.has(account.id);

    if (!hasEmail || !emailOk) {
      return {
        ...account,
        status: 'failed',
        validation: 'needs-review',
      };
    }

    if (isDuplicate) {
      return {
        ...account,
        status: 'failed',
        validation: 'duplicate',
      };
    }

    return {
      ...account,
      status: 'uploaded',
      validation: 'valid',
    };
  });
}

export default {
  getDividerChar,
  parseDelimitedRecords,
  projectInventoryColumns,
  parseInventoryText,
  detectDuplicateEmails,
  validateInventoryAccounts,
};
