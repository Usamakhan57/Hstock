/** Parse / validate helpers for seller inventory import. */

const DIVIDER_MAP = Object.freeze({
  tab: '\t',
  comma: ',',
  semicolon: ';',
});

export function getDividerChar(divider) {
  return DIVIDER_MAP[divider] || '\t';
}

export function parseInventoryText(rawText, divider = 'tab') {
  const text = String(rawText || '');
  if (!text.trim()) return [];

  const separator = getDividerChar(divider);
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const values = line.split(separator).map((value) => value.trim());
      return {
        id: `row-${index + 1}`,
        values,
        status: 'pending',
        fields: {
          email: values[0] || '',
          password: values[1] || '',
          recovery: values[2] || '',
          '2fa': values[3] || '',
          cookie: values[4] || '',
          token: values[5] || '',
        },
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
  parseInventoryText,
  detectDuplicateEmails,
  validateInventoryAccounts,
};
