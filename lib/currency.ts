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

export async function getCurrencySettings(): Promise<CurrencySettings> {
  const now = Date.now();
  
  // Return cached settings if still fresh
  if (cachedSettings && (now - settingsCacheTime) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const data = await response.json();
      cachedSettings = {
        exchangeRate: data.exchangeRate || 15000,
        displayCurrency: data.displayCurrency || 'SP',
        currency: data.currency || 'USD',
      };
      settingsCacheTime = now;
      return cachedSettings;
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

