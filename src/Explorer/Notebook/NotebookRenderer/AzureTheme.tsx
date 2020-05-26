import { createGlobalStyle } from "styled-components";

const AzureTheme = createGlobalStyle`
:root {
  /* --theme-primary-bg-hover: #0078d4;
  --theme-primary-bg-focus: #0078d4;
  --theme-primary-shadow-hover: #0078d4; */

  --theme-app-bg: white;
  --theme-app-fg: var(--nt-color-midnight);
  --theme-app-border: var(--nt-color-grey-light);

  --theme-primary-bg: var(--nt-color-grey-lightest);
  --theme-primary-bg-hover: var(--nt-color-grey-lighter);
  --theme-primary-bg-focus: var(--nt-color-grey-light);

  --theme-primary-fg: var(--nt-color-midnight-light);
  --theme-primary-fg-hover: var(--nt-color-midnight);
  --theme-primary-fg-focus: var(--theme-app-fg);

  --theme-secondary-bg: var(--theme-primary-bg);
  --theme-secondary-bg-hover: var(--theme-primary-bg-hover);
  --theme-secondary-bg-focus: var(--theme-primary-bg-focus);

  --theme-secondary-fg: var(--nt-color-midnight-lighter);
  --theme-secondary-fg-hover: var(--nt-color-midnight-light);
  --theme-secondary-fg-focus: var(--theme-primary-fg);

  /* --theme-primary-shadow-hover: 0px 2px 4px rgba(0, 0, 0, 0.1);
  --theme-primary-shadow-focus: 0px 2px 4px rgba(0, 0, 0, 0.1); */

  --theme-title-bar-bg: var(--theme-primary-bg-hover);

  --theme-menu-bg: var(--theme-primary-bg);
  --theme-menu-bg-hover: var(--theme-primary-bg-hover);
  --theme-menu-bg-focus: var(--theme-primary-bg-focus);
  /* --theme-menu-shadow: var(--theme-primary-shadow-hover); */

  --theme-menu-fg: var(--theme-app-fg);
  --theme-menu-fg-hover: var(--theme-app-fg);
  --theme-menu-fg-focus: var(--theme-app-fg);

  --theme-cell-bg: var(--theme-app-bg);
  /* --theme-cell-shadow-hover: var(--theme-primary-shadow-hover); */
  /* --theme-cell-shadow-focus: var(--theme-primary-shadow-focus); */

  --theme-cell-prompt-bg: var(--theme-primary-bg);
  --theme-cell-prompt-bg-hover: var(--theme-primary-bg-hover);
  --theme-cell-prompt-bg-focus: var(--theme-primary-bg-focus);

  --theme-cell-prompt-fg: var(--theme-secondary-fg);
  --theme-cell-prompt-fg-hover: var(--theme-secondary-fg-hover);
  --theme-cell-prompt-fg-focus: var(--theme-secondary-fg-focus);

  --theme-cell-toolbar-bg: var(--theme-primary-bg);
  --theme-cell-toolbar-bg-hover: var(--theme-primary-bg-hover);
  --theme-cell-toolbar-bg-focus: var(--theme-primary-bg-focus);

  --theme-cell-toolbar-fg: var(--theme-secondary-fg);
  --theme-cell-toolbar-fg-hover: var(--theme-secondary-fg-hover);
  --theme-cell-toolbar-fg-focus: var(--theme-secondary-fg-focus);

  --theme-cell-menu-bg: var(--theme-primary-bg);
  --theme-cell-menu-bg-hover: var(--theme-primary-bg-hover);
  --theme-cell-menu-bg-focus: var(--theme-primary-bg-focus);

  --theme-cell-menu-fg: var(--theme-primary-fg);
  --theme-cell-menu-fg-hover: var(--theme-primary-fg-hover);
  --theme-cell-menu-fg-focus: var(--theme-primary-fg-focus);

  --theme-cell-input-bg: var(--theme-secondary-bg);
  --theme-cell-input-fg: var(--theme-app-fg);

  --theme-cell-output-bg: var(--theme-app-bg);
  --theme-cell-output-fg: var(--theme-primary-fg);

  --theme-cell-creator-bg: var(--theme-app-bg);

  --theme-cell-creator-fg: var(--theme-secondary-fg);
  --theme-cell-creator-fg-hover: var(--theme-secondary-fg-hover);
  --theme-cell-creator-fg-focus: var(--theme-secondary-fg-focus);

  --theme-pager-bg: #fafafa;

  --cm-background: #fafafa;
  --cm-color: black;

  --cm-gutter-bg: white;

  --cm-comment: #a86;
  --cm-keyword: blue;
  --cm-string: #a22;
  --cm-builtin: #077;
  --cm-special: #0aa;
  --cm-variable: black;
  --cm-number: #3a3;
  --cm-meta: #555;
  --cm-link: #3a3;
  --cm-operator: black;
  --cm-def: black;

  --cm-activeline-bg: #e8f2ff;
  --cm-matchingbracket-outline: grey;
  --cm-matchingbracket-color: black;

  --cm-hint-color: var(--cm-color);
  --cm-hint-color-active: var(--cm-color);
  --cm-hint-bg: var(--theme-app-bg);
  --cm-hint-bg-active: #abd1ff;

  --status-bar: #eeedee;
}
`;

export { AzureTheme };
