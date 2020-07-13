// import * as monaco from "./monaco";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// TODO: move defineTheme calls to an initialization function

/**
 * The default light theme with customized background
 */
export const LightThemeName = "vs-light";

/**
 * Default monaco theme for light theme
 */
export const customMonacoLightTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs", // Derive from default light theme of Monaco
  inherit: true,
  rules: [],
  colors: {
    // We want Monaco background to use the same background for our themes.
    // Without this, the Monaco light theme has a yellowish tone.
    // Verified with UX that white meets all the accessbility requirements for light
    // and high contrast light theme.
    "editor.background": "#FFFFFF"
  }
};

monaco.editor.defineTheme(LightThemeName, customMonacoLightTheme);

/**
 * The default dark theme with customized background
 */
export const DarkThemeName = "aznb-dark";

/**
 * Default monaco theme for dark theme
 */
export const customMonacoDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark", // Derive from default dark theme of Monaco
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#1b1a19"
  }
};

monaco.editor.defineTheme(DarkThemeName, customMonacoDarkTheme);

/**
 * The custom high contrast light theme with customized background
 */
export const HCLightThemeName = "hc-light";

/**
 * Default monaco theme for light high contrast mode
 */
export const customMonacoHCLightTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs", // Derive from default light theme of Monaco; change all grey colors to black to comply with highcontrast rules
  inherit: true,
  rules: [
    { token: "annotation", foreground: "000000" },
    { token: "delimiter.html", foreground: "000000" },
    { token: "operator.scss", foreground: "000000" },
    { token: "operator.sql", foreground: "000000" },
    { token: "operator.swift", foreground: "000000" },
    { token: "predefined.sql", foreground: "000000" }
  ],
  colors: {
    // We want Monaco background to use the same background for our themes.
    // Without this, the Monaco light theme has a yellowish tone.
    // Verified with UX that white meets all the accessbility requirements for light
    // and high contrast light theme.
    "editor.background": "#FFFFFF"
  }
};

monaco.editor.defineTheme(HCLightThemeName, customMonacoHCLightTheme);
