import type { AppProps } from 'next/app';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import '../lib/i18n'; // Initialize i18n

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <LanguageProvider defaultLanguage="ar">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #374151',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <Component {...pageProps} />
      </LanguageProvider>
    </CartProvider>
  );
}
