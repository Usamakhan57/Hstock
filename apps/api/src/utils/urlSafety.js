import dns from 'node:dns/promises';
import net from 'node:net';
import { env } from '../config/env.js';

/**
 * Block SSRF via private/link-local/metadata hosts when fetching remote URLs (OCR).
 */

function isPrivateIp(ip) {
  if (!ip) return true;
  const normalized = String(ip).replace(/^::ffff:/i, '');
  if (normalized === '127.0.0.1' || normalized === '::1' || normalized === '0.0.0.0') return true;
  if (normalized.startsWith('10.')) return true;
  if (normalized.startsWith('192.168.')) return true;
  if (normalized.startsWith('169.254.')) return true;
  if (normalized.startsWith('127.')) return true;
  const parts = normalized.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80')) return true;
  return false;
}

function allowedHosts() {
  const hosts = new Set();
  try {
    hosts.add(new URL(env.APP_URL).hostname);
  } catch {
    // ignore
  }
  try {
    hosts.add(new URL(env.FRONTEND_URL || 'http://localhost:3000').hostname);
  } catch {
    // ignore
  }
  hosts.add('localhost');
  hosts.add('127.0.0.1'); // only used for same-origin relative rewrite — still blocked by IP check for fetch
  return hosts;
}

/**
 * Validate a remote image URL before server-side fetch.
 * Allows https absolute URLs to public hosts, or relative/upload paths under our app.
 */
export async function assertSafeRemoteImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Invalid image URL');
  }

  // Relative upload paths are served locally — rewrite to APP_URL
  if (rawUrl.startsWith('/uploads/') || rawUrl.startsWith('uploads/')) {
    const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${env.APP_URL.replace(/\/$/, '')}${path}`;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid image URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Unsupported URL protocol');
  }

  // In production require https for external hosts
  if (env.isProduction && parsed.protocol !== 'https:') {
    const host = parsed.hostname;
    const ours = allowedHosts();
    if (!ours.has(host)) {
      throw new Error('Only HTTPS remote image URLs are allowed');
    }
  }

  if (net.isIP(parsed.hostname)) {
    if (isPrivateIp(parsed.hostname)) {
      throw new Error('Private IP image URLs are not allowed');
    }
    return parsed.toString();
  }

  // Block obvious metadata hosts by name
  const blockedNames = ['metadata.google.internal', 'metadata', 'localhost'];
  if (blockedNames.includes(parsed.hostname.toLowerCase())) {
    // Allow localhost only in non-production for relative APP_URL uploads already handled
    if (!(env.isDevelopment || env.isTest) || parsed.hostname === 'metadata' || parsed.hostname.includes('metadata')) {
      throw new Error('Blocked host for remote image fetch');
    }
  }

  try {
    const records = await dns.lookup(parsed.hostname, { all: true });
    for (const record of records) {
      if (isPrivateIp(record.address)) {
        throw new Error('Resolved host is not publicly routable');
      }
    }
  } catch (error) {
    if (error.message?.includes('not publicly') || error.message?.includes('Blocked')) {
      throw error;
    }
    // DNS failure — deny in production
    if (env.isProduction) {
      throw new Error('Unable to resolve image host');
    }
  }

  return parsed.toString();
}

export default {
  assertSafeRemoteImageUrl,
};
