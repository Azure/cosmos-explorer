import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {initReactI18next} from 'react-i18next'
import XHR from "i18next-http-backend"
import EnglishTranslations from './Localization/en/translations.json'

i18n
.use(XHR)
.use(LanguageDetector)
.use(initReactI18next)
.init({
    resources: {
        en: EnglishTranslations
    },
    fallbackLng: "en",
    detection: {order: ['navigator', 'cookie', 'localStorage', 'sessionStorage', 'querystring', 'htmlTag']},
    debug: true,
    ns: ["translations"],
    defaultNS: "translations",
    keySeparator: ".",
    interpolation: {
        formatSeparator: ","
    },
    react: {
        wait: true,
        bindI18n: 'languageChanged loaded',
        bindStore: 'added removed',
        nsMode: 'default',
        useSuspense: false
    }
})

export default i18n;