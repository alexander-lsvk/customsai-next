"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS, thTH } from "@clerk/localizations";
import { useState, useEffect, createContext, useContext } from "react";

type Language = "en" | "th";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within ClerkProviderWithLocale");
  }
  return context;
}

const localizationMap = {
  en: enUS,
  th: thTH,
};

export function ClerkProviderWithLocale({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always start with "th" to match server render
  const [language, setLanguageState] = useState<Language>("th");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "th")) {
      setLanguageState(savedLang);
    }
    setIsReady(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "th" : "en";
    setLanguage(newLang);
  };

  // Don't render children until we've read from localStorage
  // This prevents hydration mismatch AND the language flash
  if (!isReady) {
    return null;
  }

  return (
    <ClerkProvider localization={localizationMap[language]} key={language}>
      <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isReady }}>
        {children}
      </LanguageContext.Provider>
    </ClerkProvider>
  );
}
