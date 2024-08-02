import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    detection: { order: ["navigator", "cookie", "localStorage", "sessionStorage", "querystring", "htmlTag"] },
    debug: process.env.NODE_ENV === "development",
    keySeparator: ".",
    interpolation: {
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
