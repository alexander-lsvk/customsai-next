"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS, thTH } from "@clerk/localizations";
import { useState, useEffect, createContext, useContext } from "react";

type Language = "en" | "th";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
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
  const [language, setLanguageState] = useState<Language>("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "th")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "th" : "en";
    setLanguage(newLang);
  };

  // Prevent hydration mismatch by rendering with default until mounted
  if (!mounted) {
    return (
      <ClerkProvider localization={thTH}>
        <LanguageContext.Provider value={{ language: "th", setLanguage, toggleLanguage }}>
          {children}
        </LanguageContext.Provider>
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider localization={localizationMap[language]} key={language}>
      <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
        {children}
      </LanguageContext.Provider>
    </ClerkProvider>
  );
}
