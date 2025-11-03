import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  ar: {
    // Navigation
    products: 'المنتجات',
    cart: 'السلة',
    admin: 'مدير',
    // Home page
    loadingProducts: 'جاري تحميل المنتجات...',
    discoverCollection: 'اكتشفي مجموعتنا',
    elegantPieces: 'قطع أنيقة للمرأة العصرية',
    searchPlaceholder: 'ابحث عن المنتجات...',
    allCategories: 'الكل',
    noProducts: 'لم يتم العثور على منتجات تطابق معايير البحث.',
    addToCart: 'إضافة إلى السلة',
    price: 'السعر',
    // Cart page
    shoppingCart: 'سلة التسوق',
    emptyCart: 'السلة فارغة',
    addProducts: 'أضف منتجات من الصفحة الرئيسية',
    total: 'المجموع',
    customerName: 'اسم العميل',
    enterName: 'أدخل اسمك',
    cancel: 'إلغاء',
    copyToClipboard: 'نسخ إلى الحافظة',
    shareWhatsApp: 'مشاركة عبر WhatsApp',
    print: 'طباعة',
    copied: 'تم النسخ!',
    nameRequired: 'الرجاء إدخال اسم العميل',
    // Product detail
    backToProducts: 'العودة إلى المنتجات',
    category: 'الفئة',
    description: 'الوصف',
    stock: 'المخزون',
    inStock: 'متوفر',
    outOfStock: 'غير متوفر',
    shareProduct: 'مشاركة المنتج',
    linkCopied: 'تم نسخ الرابط!',
    // Language selector
    selectLanguage: 'اختر اللغة',
  },
  en: {
    // Navigation
    products: 'Products',
    cart: 'Cart',
    admin: 'Admin',
    // Home page
    loadingProducts: 'Loading products...',
    discoverCollection: 'Discover Our Collection',
    elegantPieces: 'Elegant pieces for the modern woman',
    searchPlaceholder: 'Search for products...',
    allCategories: 'All',
    noProducts: 'No products found matching your search criteria.',
    addToCart: 'Add to Cart',
    price: 'Price',
    // Cart page
    shoppingCart: 'Shopping Cart',
    emptyCart: 'Your cart is empty',
    addProducts: 'Add products from the main page',
    total: 'Total',
    customerName: 'Customer Name',
    enterName: 'Enter your name',
    cancel: 'Cancel',
    copyToClipboard: 'Copy to Clipboard',
    shareWhatsApp: 'Share via WhatsApp',
    print: 'Print',
    copied: 'Copied!',
    nameRequired: 'Please enter customer name',
    // Product detail
    backToProducts: 'Back to Products',
    category: 'Category',
    description: 'Description',
    stock: 'Stock',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    shareProduct: 'Share Product',
    linkCopied: 'Link copied!',
    // Language selector
    selectLanguage: 'Select Language',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = 'ar' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load customer preference from localStorage
    const savedLanguage = localStorage.getItem('customerLanguage') as Language | null;
    
    // If customer has a preference, use it, otherwise use admin default
    const initialLanguage = savedLanguage || defaultLanguage;
    setLanguageState(initialLanguage);
    setIsLoading(false);
  }, [defaultLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
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

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
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

