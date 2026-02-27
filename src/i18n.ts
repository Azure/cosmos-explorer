import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)
  .use(resourcesToBackend((lng: string, ns: string) => import(`./Localization/${lng}/${ns}.json`)))
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    defaultNS: "Resources",
    ns: ["Resources"],
    detection: { order: ["navigator", "cookie", "localStorage", "sessionStorage", "querystring", "htmlTag"] },
    debug: process.env.NODE_ENV === "development",
    keySeparator: ".",
    interpolation: {
      escapeValue: false,
      formatSeparator: ",",
    },
    react: {
      bindI18n: "languageChanged added loaded",
      bindI18nStore: "added removed",
      nsMode: "default",
      useSuspense: false,
    },
  });

export default i18n;
