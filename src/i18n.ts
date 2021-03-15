import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import XHR from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import EnglishTranslations from "./Localization/en/translations.json";

i18n
  .use(XHR)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: EnglishTranslations,
    },
    fallbackLng: "en",
    detection: { order: ["navigator", "cookie", "localStorage", "sessionStorage", "querystring", "htmlTag"] },
    debug: process.env.NODE_ENV === "development",
    ns: ["translations"],
    defaultNS: "translations",
    keySeparator: ".",
    interpolation: {
      formatSeparator: ",",
    },
    react: {
      wait: true,
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
      nsMode: "default",
      useSuspense: false,
    },
  });
