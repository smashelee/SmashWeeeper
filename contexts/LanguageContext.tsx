import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation } from '../utils/i18n';
import { db } from '../utils/database';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslation>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLanguage = async () => {
      try {
        await db.init();
        const saved = await db.getSetting('language');
        if (saved === 'ru' || saved === 'en' || saved === 'ua' || saved === 'pl') {
          setLanguageState(saved);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      } finally {
        setLoading(false);
      }
    };
    initLanguage();
  }, []);

  useEffect(() => {
    if (!loading) {
      db.setSetting('language', language);
    }
  }, [language, loading]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = getTranslation(language);

  if (loading) {
    return <div>Loading...</div>;
  }

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
