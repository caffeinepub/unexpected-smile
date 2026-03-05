import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Language = "en" | "te";

export interface Translations {
  // Hero
  heroGreeting: string;
  heroHeadline: string;
  heroCta: string;
  // Nav
  navHome: string;
  navServices: string;
  navPricing: string;
  navReviews: string;
  navOrders: string;
  navContact: string;
  // Sections
  sectionChooseTribute: string;
  sectionTributeSubtitle: string;
  bookThisPackage: string;
  sectionFaq: string;
  sectionReviews: string;
  sectionContact: string;
  // Footer
  footerTagline: string;
}

const en: Translations = {
  heroGreeting:
    "Hello 🙏 Are you missing someone dearly on your upcoming Wedding, Birthday or Special Event?",
  heroHeadline: "Bring Their Blessings Back To Your Special Day",
  heroCta: "Book Your Surprise",
  navHome: "Home",
  navServices: "Our Services",
  navPricing: "Pricing Details",
  navReviews: "Reviews",
  navOrders: "My Orders",
  navContact: "Contact Us",
  sectionChooseTribute: "Choose Your Tribute",
  sectionTributeSubtitle:
    "Each package includes a heartfelt AI memorial video crafted specifically for your loved one.",
  bookThisPackage: "Book This Package",
  sectionFaq: "Frequently Asked",
  sectionReviews: "What Families Say",
  sectionContact: "Contact Us",
  footerTagline: "Honouring lives. Preserving legacies. Forever.",
};

const te: Translations = {
  heroGreeting:
    "నమస్కారం 🙏 మీ రాబోయే వివాహం, పుట్టినరోజు లేదా ప్రత్యేక కార్యక్రమంలో మీకు ఎవరైనా చాలా గుర్తొస్తున్నారా?",
  heroHeadline: "వారి ఆశీర్వాదాలను మీ ప్రత్యేక రోజున తిరిగి తీసుకురండి",
  heroCta: "మీ సర్ప్రైజ్ బుక్ చేయండి",
  navHome: "హోమ్",
  navServices: "మా సేవలు",
  navPricing: "ధర వివరాలు",
  navReviews: "సమీక్షలు",
  navOrders: "నా ఆర్డర్లు",
  navContact: "మమ్మల్ని సంప్రదించండి",
  sectionChooseTribute: "మీ నివాళి ఎంచుకోండి",
  sectionTributeSubtitle:
    "ప్రతి ప్యాకేజీలో మీ ప్రియమైన వ్యక్తి కోసం ప్రత్యేకంగా రూపొందించిన హృదయస్పర్శి AI మెమోరియల్ వీడియో ఉంటుంది.",
  bookThisPackage: "ఈ ప్యాకేజీని బుక్ చేయండి",
  sectionFaq: "తరచుగా అడిగే ప్రశ్నలు",
  sectionReviews: "కుటుంబాలు ఏమి చెప్తున్నాయి",
  sectionContact: "మాతో సంప్రదించండి",
  footerTagline: "జీవితాలను గౌరవిస్తూ. జ్ఞాపకాలను సంరక్షిస్తూ. శాశ్వతంగా.",
};

const TRANSLATIONS: Record<Language, Translations> = { en, te };
const STORAGE_KEY = "us_lang";

interface LanguageContextValue {
  lang: Language;
  t: Translations;
  setLang: (l: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "te" ? "te" : "en";
  });

  const setLang = useCallback((l: Language) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "te" : "en");
  }, [lang, setLang]);

  // Keep storage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: TRANSLATIONS[lang],
      setLang,
      toggleLang,
    }),
    [lang, setLang, toggleLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}
