/**
 * Platform/Shop detection utilities for multi-tenant support
 * Each shop can have its own data isolated by platform key
 */

export interface PlatformContext {
  platform: string;
  domain: string;
}

/**
 * Get platform key from request
 * Supports:
 * - Admin cookie (for authenticated admins): admin_platform cookie -> platform
 * - URL parameter: catalogue.com/?platform=roze -> "roze"
 * - Subdomain: roze.catalogue.com -> "roze"
 * - Default: "default"
 */
export function getPlatformFromRequest(req?: {
  headers?: {
    host?: string;
    'x-forwarded-host'?: string;
    cookie?: string;
  };
  query?: {
    platform?: string;
  };
  cookies?: {
    admin_platform?: string;
  };
  url?: string;
}): string {
  // For authenticated admins, use their platform from cookie (highest priority)
  if (req?.cookies?.admin_platform) {
    return req.cookies.admin_platform.toLowerCase();
  }
  
  // Parse cookie string if it exists in headers
  if (req?.headers?.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.admin_platform) {
      return cookies.admin_platform.toLowerCase();
    }
  }

  // Try URL parameter second (for public pages)
  if (req?.query?.platform && typeof req.query.platform === 'string') {
    return req.query.platform.toLowerCase();
  }

  // Try to extract from host header
  const host = req?.headers?.host || req?.headers?.['x-forwarded-host'] || '';
  
  if (host) {
    // Check if host has subdomain
    const parts = host.split('.');
    if (parts.length >= 3) {
      // Format: shop.domain.com
      const subdomain = parts[0].toLowerCase();
      return subdomain;
    }
  }

  // Default platform
  return 'default';
}

/**
 * Get platform context from host and query params
 */
export function getPlatformContext(req?: {
  headers?: {
    host?: string;
    'x-forwarded-host'?: string;
  };
  query?: {
    platform?: string;
  };
  url?: string;
}): PlatformContext {
  const platform = getPlatformFromRequest(req);
  const host = req?.headers?.host || req?.headers?.['x-forwarded-host'] || '';
  
  return {
    platform,
    domain: host,
  };
}

/**
 * Create database query filter with platform
 */
export function withPlatformFilter(platform: string, additionalFilter: any = {}) {
  return {
    ...additionalFilter,
    platform: platform,
  };
}

/**
 * Create database document with platform
 */
export function withPlatform(platform: string, data: any) {
  return {
    ...data,
    platform: platform,
  };
}

/**
 * Supported platforms list
 */
export const SUPPORTED_PLATFORMS = [
  'roze',
  'jador',
  'rose',
  'default',
];

/**
 * Validate platform key
 */
export function isValidPlatform(platform: string): boolean {
  return SUPPORTED_PLATFORMS.includes(platform.toLowerCase()) || platform === 'default';
}

