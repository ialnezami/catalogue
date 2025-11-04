export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  SP: 'ل.س',
  EUR: '€',
  GBP: '£',
};

export interface CurrencySettings {
  exchangeRate: number;
  displayCurrency: string;
  currency: string;
}

let cachedSettings: CurrencySettings | null = null;
let settingsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCurrencySettings(platform?: string): Promise<CurrencySettings> {
  const now = Date.now();
  
  // Create cache key based on platform
  const cacheKey = platform || 'default';
  
  // Return cached settings if still fresh and for the same platform
  if (cachedSettings && (now - settingsCacheTime) < CACHE_DURATION && cacheKey === 'default') {
    return cachedSettings;
  }

  try {
    // Fetch settings with platform parameter if provided
    const url = platform ? `/api/settings?platform=${platform}` : '/api/settings';
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const settings = {
        exchangeRate: data.exchangeRate || 15000,
        displayCurrency: data.displayCurrency || 'SP',
        currency: data.currency || 'USD',
      };
      
      // Only cache if no platform specified (legacy behavior)
      if (!platform) {
        cachedSettings = settings;
        settingsCacheTime = now;
      }
      
      return settings;
    }
  } catch (error) {
    console.error('Error fetching currency settings:', error);
  }

  // Return default settings if fetch fails
  return {
    exchangeRate: 15000,
    displayCurrency: 'SP',
    currency: 'USD',
  };
}

export function formatPrice(
  priceUSD: number,
  exchangeRate: number = 15000,
  displayCurrency: string = 'SP'
): string {
  const convertedPrice = priceUSD * exchangeRate;
  
  if (displayCurrency === 'USD') {
    return `$${priceUSD.toFixed(2)}`;
  }
  
  // Format with Arabic thousands separator
  const formatted = Math.round(convertedPrice).toLocaleString('ar-EG');
  
  return `${formatted} ${CURRENCY_SYMBOLS[displayCurrency]}`;
}

export function formatPriceWithCurrency(
  priceUSD: number,
  exchangeRate: number = 15000,
  displayCurrency: string = 'SP'
): { value: string; currency: string } {
  const convertedPrice = priceUSD * exchangeRate;
  
  if (displayCurrency === 'USD') {
    return {
      value: priceUSD.toFixed(2),
      currency: CURRENCY_SYMBOLS['USD']
    };
  }
  
  return {
    value: Math.round(convertedPrice).toLocaleString('ar-EG'),
    currency: CURRENCY_SYMBOLS[displayCurrency]
  };
}

