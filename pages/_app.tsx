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
            duration: 2500,
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            },
            success: {
              duration: 2000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #10b981',
              },
            },
            error: {
              duration: 3000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #ef4444',
              },
            },
          }}
        />
        <Component {...pageProps} />
      </LanguageProvider>
    </CartProvider>
  );
}
