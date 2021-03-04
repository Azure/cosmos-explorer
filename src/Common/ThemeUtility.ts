/*!---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *----------------------------------------------------------*/

export function getMonacoTheme(theme: string): string {
    switch (theme) {
      case "default":
      case "hc-white":
        return "vs";
      case "dark":
        return "vs-dark";
      case "hc-black":
        return "hc-black";
      default:
        return "vs";
    }
  }
