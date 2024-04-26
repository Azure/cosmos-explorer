import { Theme, createTheme } from "@fluentui/react";
import { BrandVariants, createLightTheme } from "@fluentui/react-components";

export const appThemeFabric: Theme = createTheme({
  palette: {
    /**
     * Color code for themeDarker.
     */
    themeDarker: "#033f38",
    /**
     * Color code for themeDark.
     */
    themeDark: "#0a5c50",
    /**
     * Color code for themeDarkAlt.
     */
    themeDarkAlt: "#0c695a",
    /**
     * Color code for themePrimary.
     */
    themePrimary: "#117865",
    /**
     * Color code for themeSecondary.
     */
    themeSecondary: "#1f937e",
    /**
     * Color code for themeTertiary.
     */
    themeTertiary: "#52c7aa",
    /**
     * Color code for themeLight.
     */
    themeLight: "#9ee0cb",
    /**
     * Color code for themeLighter.
     */
    themeLighter: "#c0ecdd",
    /**
     * Color code for themeLighterAlt.
     */
    themeLighterAlt: "#e3f7ef",
    /**
     * Color code for the strongest color, which is black in the default theme.
     * This is a very light color in inverted themes.
     */
    black: "#000000",
    /**
     * Color code for blackTranslucent40.
     */
    blackTranslucent40: "rgba(0, 0, 0, 0.4)",
    /**
     * Color code for neutralDark.
     */
    neutralDark: "#141414",
    /**
     * Color code for neutralPrimary.
     */
    neutralPrimary: "#242424",
    /**
     * Color code for neutralPrimaryAlt.
     */
    neutralPrimaryAlt: "#383838",
    /**
     * Color code for neutralSecondary.
     */
    neutralSecondary: "#5c5c5c",
    /**
     * Color code for neutralSecondaryAlt.
     */
    neutralSecondaryAlt: "#858585",
    /**
     * Color code for neutralTertiary.
     */
    neutralTertiary: "#9e9e9e",
    /**
     * Color code for neutralTertiaryAlt.
     */
    neutralTertiaryAlt: "#c7c7c7",
    /**
     * Color code for neutralQuaternary.
     */
    neutralQuaternary: "#d1d1d1",
    /**
     * Color code for neutralQuaternaryAlt.
     */
    neutralQuaternaryAlt: "#e0e0e0",
    /**
     * Color code for neutralLight.
     */
    neutralLight: "#ebebeb",
    /**
     * Color code for neutralLighter.
     */
    neutralLighter: "#f5f5f5",
    /**
     * Color code for neutralLighterAlt.
     */
    neutralLighterAlt: "#fafafa",
    /**
     * Color code for the accent.
     */
    accent: "#117865",
    /**
     * Color code for the softest color, which is white in the default theme. This is a very dark color in dark themes.
     * This is the page background.
     */
    white: "#ffffff",
    /**
     * Color code for whiteTranslucent40
     */
    whiteTranslucent40: "rgba(255, 255, 255, 0.4)",
    /**
     * Color code for yellowDark.
     */
    yellowDark: "#d39300",
    /**
     * Color code for yellow.
     */
    yellow: "#fde300",
    /**
     * Color code for yellowLight.
     */
    yellowLight: "#fef7b2",
    /**
     * Color code for orange.
     */
    orange: "#f7630c",
    /**
     * Color code for orangeLight.
     */
    orangeLight: "#f98845",
    /**
     * Color code for orangeLighter.
     */
    orangeLighter: "#fdcfb4",
    /**
     * Color code for redDark.
     */
    redDark: "#750b1c",
    /**
     * Color code for red.
     */
    red: "#d13438",
    /**
     * Color code for magentaDark.
     */
    magentaDark: "#6b0043",
    /**
     * Color code for magenta.
     */
    magenta: "#bf0077",
    /**
     * Color code for magentaLight.
     */
    magentaLight: "#d957a8",
    /**
     * Color code for purpleDark.
     */
    purpleDark: "#401b6c",
    /**
     * Color code for purple.
     */
    purple: "#5c2e91",
    /**
     * Color code for purpleLight.
     */
    purpleLight: "#c6b1de",
    /**
     * Color code for blueDark.
     */
    blueDark: "#003966",
    /**
     * Color code for blueMid.
     */
    blueMid: "#004e8c",
    /**
     * Color code for blue.
     */
    blue: "#0078d4",
    /**
     * Color code for blueLight.
     */
    blueLight: "#3a96dd",
    /**
     * Color code for tealDark.
     */
    tealDark: "#006666",
    /**
     * Color code for teal.
     */
    teal: "#038387",
    /**
     * Color code for tealLight.
     */
    tealLight: "#00b7c3",
    /**
     * Color code for greenDark.
     */
    greenDark: "#0b6a0b",
    /**
     * Color code for green.
     */
    green: "#107c10",
    /**
     * Color code for greenLight.
     */
    greenLight: "#13a10e",
  },
});

export const appThemeFabricTealBrandRamp: BrandVariants = {
  10: '#001919',
  20: '#012826',
  30: '#01322E',
  40: '#033f38',
  50: '#054d43',
  60: '#0a5c50',
  70: '#0c695a',
  80: '#117865',
  90: '#1f937e',
  100: '#2aaC94',
  110: '#3abb9f',
  120: '#52c7aa',
  130: '#78d3b9',
  140: '#9ee0cb',
  150: '#c0ecdd',
  160: '#e3f7ef',
};

export const appThemeFabricV9 = createLightTheme(appThemeFabricTealBrandRamp);