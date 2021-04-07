import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    detection: { order: ["navigator", "cookie", "localStorage", "sessionStorage", "querystring", "htmlTag"] },
    // temporarily setting debug to true to investigate loading issues in prod
    debug: true,
    keySeparator: ".",
    interpolation: {
      formatSeparator: ",",
    },
    react: {
      wait: true,
      bindI18n: "languageChanged added loaded",
      bindI18nStore: "added removed",
      nsMode: "default",
      useSuspense: false,
    },
  });

export default i18n;
