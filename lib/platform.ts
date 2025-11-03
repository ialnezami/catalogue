/**
 * Platform/Shop detection utilities for multi-tenant support
 * Each shop can have its own data isolated by platform key
 */

export interface PlatformContext {
  platform: string;
  domain: string;
}

/**
 * Check if request is from an authenticated admin
 */
export function isAuthenticatedAdmin(req?: {
  cookies?: {
    admin?: string;
    admin_platform?: string;
  };
  headers?: {
    cookie?: string;
  };
}): boolean {
  if (req?.cookies?.admin === 'true') {
    return true;
  }
  
  // Parse cookie string if it exists in headers
  if (req?.headers?.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies.admin === 'true';
  }
  
  return false;
}

/**
 * Get admin's platform from cookie (for authenticated admins only)
 */
export function getAdminPlatform(req?: {
  cookies?: {
    admin_platform?: string;
  };
  headers?: {
    cookie?: string;
  };
}): string | null {
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
  
  return null;
}

/**
 * Get platform key from request
 * Supports (in priority order):
 * - URL parameter (highest priority for public pages): catalogue.com/?platform=roze -> "roze"
 * - Admin cookie (for authenticated admins - enforced, cannot be overridden): admin_platform cookie -> platform
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
    admin?: string;
    admin_platform?: string;
  };
  url?: string;
}): string {
  const isAdmin = isAuthenticatedAdmin(req);
  const adminPlatform = getAdminPlatform(req);
  
  // For authenticated admins, ALWAYS use their platform from cookie (cannot be overridden)
  if (isAdmin && adminPlatform) {
    return adminPlatform;
  }
  
  // For public pages, URL parameter takes priority
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
 * Validate that an admin can only access/modify their own platform
 * Returns the platform if valid, throws error if admin tries to access another platform
 */
export function validateAdminPlatformAccess(req?: {
  headers?: {
    cookie?: string;
  };
  query?: {
    platform?: string;
  };
  cookies?: {
    admin?: string;
    admin_platform?: string;
  };
}): string {
  const isAdmin = isAuthenticatedAdmin(req);
  const adminPlatform = getAdminPlatform(req);
  
  // If not an admin, allow public access with URL params
  if (!isAdmin) {
    return getPlatformFromRequest(req);
  }
  
  // Admin must have a platform
  if (!adminPlatform) {
    throw new Error('Admin must be associated with a platform');
  }
  
  // Check if admin is trying to access a different platform via URL param
  const urlPlatform = req?.query?.platform;
  if (urlPlatform && typeof urlPlatform === 'string' && urlPlatform.toLowerCase() !== adminPlatform) {
    throw new Error(`Admin can only access their own platform. Admin platform: ${adminPlatform}, Requested platform: ${urlPlatform}`);
  }
  
  // Admin can only access their own platform
  return adminPlatform;
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

