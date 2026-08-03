import { describe, expect, it } from 'vitest';
import {
  detectDuplicateEmails,
  parseDelimitedRecords,
  parseInventoryText,
  projectInventoryColumns,
  validateInventoryAccounts,
} from './inventoryImport';

describe('inventoryImport', () => {
  it('parses tab-separated inventory rows', () => {
    const rows = parseInventoryText('a@x.com\tpass1\nb@y.com\tpass2', 'tab');
    expect(rows).toHaveLength(2);
    expect(rows[0].fields.email).toBe('a@x.com');
    expect(rows[1].fields.password).toBe('pass2');
  });

  it('preserves comma-separated recovery codes inside quoted 2FA field', () => {
    const raw = 'buyer@x.com,SecretPass,recovery@x.com,"111111,222222,333333,444444,555555",cookie-value,token-value';
    const rows = parseInventoryText(raw, 'comma');
    expect(rows).toHaveLength(1);
    expect(rows[0].fields['2fa']).toBe('111111,222222,333333,444444,555555');
    expect(rows[0].fields.cookie).toBe('cookie-value');
    expect(rows[0].fields.token).toBe('token-value');
  });

  it('rejoins over-split unquoted 2FA codes when comma is the divider', () => {
    const raw = 'buyer@x.com,SecretPass,recovery@x.com,111111,222222,333333,444444,555555,cookie-value,token-value';
    const rows = parseInventoryText(raw, 'comma');
    expect(rows).toHaveLength(1);
    expect(rows[0].fields['2fa']).toBe('111111,222222,333333,444444,555555');
    expect(rows[0].fields.cookie).toBe('cookie-value');
    expect(rows[0].fields.token).toBe('token-value');
  });

  it('preserves semicolon, pipe, tab, and newline characters inside 2FA', () => {
    const codes = 'aaa;bbb|ccc\tddd\neee\n\nfff';
    const raw = `buyer@x.com\tpass\trecovery\t"${codes}"\tcookie\ttoken`;
    const rows = parseInventoryText(raw, 'tab');
    expect(rows).toHaveLength(1);
    expect(rows[0].fields['2fa']).toBe(codes);
  });

  it('preserves multiline quoted 2FA fields as a single inventory row', () => {
    const raw = 'buyer@x.com,pass,recovery,"code-1\ncode-2\n\ncode-3",cookie,token';
    const rows = parseInventoryText(raw, 'comma');
    expect(rows).toHaveLength(1);
    expect(rows[0].fields['2fa']).toBe('code-1\ncode-2\n\ncode-3');
  });

  it('supports pipe divider without splitting recovery code commas', () => {
    const raw = 'buyer@x.com|pass|recovery|111,222,333|cookie|token';
    const rows = parseInventoryText(raw, 'pipe');
    expect(rows).toHaveLength(1);
    expect(rows[0].fields['2fa']).toBe('111,222,333');
  });

  it('projectInventoryColumns rejoins middle columns exactly', () => {
    const fields = projectInventoryColumns(
      ['e', 'p', 'r', '1', '2', '3', '4', 'c', 't'],
      ',',
    );
    expect(fields['2fa']).toBe('1,2,3,4');
    expect(fields.cookie).toBe('c');
    expect(fields.token).toBe('t');
  });

  it('parseDelimitedRecords keeps blank lines inside quotes', () => {
    const records = parseDelimitedRecords('"a"\t"b\n\nc"\t"d"', '\t');
    expect(records).toEqual([['a', 'b\n\nc', 'd']]);
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
