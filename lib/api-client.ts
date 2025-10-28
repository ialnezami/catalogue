/**
 * API Client utilities with platform support
 * Adds platform parameter to all API requests
 */

/**
 * Get current platform from browser
 */
export function getCurrentPlatform(): string {
  // Try to get from subdomain first
  const host = window.location.hostname;
  const parts = host.split('.');
  
  if (parts.length >= 3) {
    // Format: shop.domain.com
    return parts[0].toLowerCase();
  }
  
  // Try to get from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const platformParam = urlParams.get('platform');
  if (platformParam) {
    return platformParam.toLowerCase();
  }
  
  // Default platform
  return 'default';
}

/**
 * Build API URL with platform parameter
 */
export function buildApiUrl(endpoint: string, includePlatform: boolean = true): string {
  const platform = getCurrentPlatform();
  
  if (includePlatform) {
    // Add platform as query parameter
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}platform=${platform}`;
  }
  
  return endpoint;
}

/**
 * Enhanced fetch with platform support
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(endpoint, true);
  return fetch(url, options);
}

/**
 * Set platform in localStorage (useful for testing or manual platform switching)
 */
export function setPlatform(platform: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('platform', platform);
  }
}

/**
 * Get platform from localStorage
 */
export function getStoredPlatform(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('platform');
  }
  return null;
}

