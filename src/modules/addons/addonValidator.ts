import dns from 'dns/promises';
import { ValidationError } from '../../shared/errors.js';

function isPrivateIp(ip: string): boolean {
  // IPv4 private ranges
  if (
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  ) {
    return true;
  }

  // IPv6 loopback / unique local / link-local
  if (
    ip === '::1' ||
    ip === '::' ||
    ip.toLowerCase().startsWith('fe80:') ||
    ip.toLowerCase().startsWith('fc00:') ||
    ip.toLowerCase().startsWith('fd00:')
  ) {
    return true;
  }

  return false;
}

export async function validateAddonUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ValidationError('عنوان Addon غير صالح');
  }

  if (url.protocol !== 'https:') {
    throw new ValidationError('يجب أن يستخدم عنوان Addon بروتوكول HTTPS المشفر');
  }

  const hostname = url.hostname;
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan')
  ) {
    throw new ValidationError('لا يُسمح بالوصول إلى عناوين الشبكة المحلية (SSRF Protection)');
  }

  // Check if hostname is direct IP
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new ValidationError('لا يُسمح بالاتصال بنطاقات IP خاصة');
    }
    return url;
  }

  // Resolve DNS to verify it doesn't resolve to private IP
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new ValidationError('النطاق يشير إلى عنوان IP محلي أو خاص محظور (SSRF Protection)');
      }
    }
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError(`تعذر التحقق من نطاق Addon عبر DNS: ${err.message}`);
  }

  return url;
}
