import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('mtg-app-lang') || 'pt');

  useEffect(() => {
    localStorage.setItem('mtg-app-lang', language);
  }, [language]);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}