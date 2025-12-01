import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation } from '../utils/i18n';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslation>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { loading: authLoading } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (authLoading) return;
    
    try {
      const saved = localStorage.getItem('language');
      if (saved === 'ru' || saved === 'en' || saved === 'ua' || saved === 'pl') {
        setLanguageState(saved);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  }, [authLoading]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = getTranslation(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
