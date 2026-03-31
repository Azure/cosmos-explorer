import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import enResources from "./Localization/en/Resources.json";

i18n
  .use(LanguageDetector)
  .use(resourcesToBackend((lng: string, ns: string) => import(`./Localization/${lng}/${ns}.json`)))
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    defaultNS: "Resources",
    ns: ["Resources"],
    // Statically bundle English resources so they are available synchronously on
    // the very first render. Without this the async dynamic-import may not resolve
    // in time (especially in incognito / cold-cache scenarios) and components would
    // briefly show raw translation keys instead of translated strings.
    resources: {
      en: {
        Resources: enResources,
      },
    },
    // Allow the resources-to-backend plugin to still load other languages and
    // namespaces dynamically; `partialBundledLanguages` tells i18next that only
    // some languages are provided statically.
    partialBundledLanguages: true,
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
