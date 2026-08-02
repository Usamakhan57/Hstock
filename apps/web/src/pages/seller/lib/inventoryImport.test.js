import { describe, expect, it } from 'vitest';
import {
  detectDuplicateEmails,
  parseInventoryText,
  validateInventoryAccounts,
} from './inventoryImport';

describe('inventoryImport', () => {
  it('parses tab-separated inventory rows', () => {
    const rows = parseInventoryText('a@x.com\tpass1\n b@y.com\tpass2 ', 'tab');
    expect(rows).toHaveLength(2);
    expect(rows[0].fields.email).toBe('a@x.com');
    expect(rows[1].fields.password).toBe('pass2');
  });

  it('flags duplicate emails during validation', () => {
    const rows = parseInventoryText('a@x.com\tp1\na@x.com\tp2\nb@y.com\tp3', 'tab');
    const validated = validateInventoryAccounts(rows);
    expect(validated.filter((row) => row.validation === 'duplicate')).toHaveLength(2);
    expect(validated.find((row) => row.fields.email === 'b@y.com')?.validation).toBe('valid');
  });

  it('detects duplicate account ids by email', () => {
    const duplicates = detectDuplicateEmails([
      { id: '1', fields: { email: 'A@x.com' } },
      { id: '2', fields: { email: 'a@x.com' } },
      { id: '3', fields: { email: 'unique@x.com' } },
    ]);
    expect(duplicates.has('1')).toBe(true);
    expect(duplicates.has('2')).toBe(true);
    expect(duplicates.has('3')).toBe(false);
  });
});
