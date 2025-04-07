/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * Localization utilities for CloudShell
 */

/**
 * Gets the current locale for API requests
 */
export const getLocale = (): string => {
  const langLocale = navigator.language;
  return (langLocale && langLocale.length > 2 ? langLocale : 'en-us');
};
