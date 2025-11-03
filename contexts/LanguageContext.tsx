import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '../lib/i18n'; // Initialize i18n

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = 'ar' }: LanguageProviderProps) {
  const { i18n, ready } = useTranslation('common');
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize i18n with default language
    if (typeof window !== 'undefined' && ready) {
      const savedLanguage = localStorage.getItem('customerLanguage') as Language | null;
      const initialLanguage = savedLanguage || defaultLanguage;
      
      // Set i18n language
      i18n.changeLanguage(initialLanguage);
      setLanguageState(initialLanguage);
      
      // Apply RTL direction to document
      document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = initialLanguage;
      
      setIsLoading(false);
    }
  }, [defaultLanguage, i18n, ready]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('customerLanguage', lang);
    
    // Apply RTL direction to document
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  // Update document direction when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  // Sync i18n language with state
  useEffect(() => {
    if (i18n.language !== language && ready) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n, ready]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: (key: string, options?: any) => {
        // Use i18next translation with namespace
        const translation = i18n.t(key, { ns: 'common', ...options });
        return translation !== key ? translation : key;
      }, 
      isLoading: isLoading || !ready 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

