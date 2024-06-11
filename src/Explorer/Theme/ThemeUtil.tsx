import { BrandVariants, FluentProvider, Theme, createLightTheme, shorthands, themeToTokensObject, webLightTheme } from "@fluentui/react-components";
import { Platform, configContext } from "ConfigContext";
import React, { PropsWithChildren } from "react";
import { appThemeFabricTealBrandRamp } from "../../Platform/Fabric/FabricTheme";

export const LayoutConstants = {
  rowHeight: 36,
}

export type CosmosFluentProviderProps = PropsWithChildren<{
  className?: string;
}>;

export const CosmosFluentProvider: React.FC<CosmosFluentProviderProps> = ({ children, className }) => {
  return <FluentProvider theme={getPlatformTheme(configContext.platform)} className={className}>
    {children}
  </FluentProvider>;
};

// These are the theme colors for Fluent UI 9 React components
const appThemePortalBrandRamp: BrandVariants = {
  10: "#020305",
  20: "#111723",
  30: "#16263D",
  40: "#193253",
  50: "#1B3F6A",
  60: "#1B4C82",
  70: "#18599B",
  80: "#1267B4",
  90: "#3174C2",
  100: "#4F82C8",
  110: "#6790CF",
  120: "#7D9ED5",
  130: "#92ACDC",
  140: "#A6BAE2",
  150: "#BAC9E9",
  160: "#CDD8EF",
};

const cosmosThemeElements = {
  layoutRowHeight: `${LayoutConstants.rowHeight}px`,
  sidebarMinimumWidth: "200px",
  sidebarInitialWidth: "300px",
}

export type CosmosTheme = Theme & typeof cosmosThemeElements;

export const tokens = themeToTokensObject({ ...webLightTheme, ...cosmosThemeElements });

export const cosmosShorthands = {
  border: () => shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
  borderBottom: () => shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
  borderRight: () => shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke2),
  borderTop: () => shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke2),
  borderLeft: () => shorthands.borderLeft("1px", "solid", tokens.colorNeutralStroke2),
};

export function getPlatformTheme(platform: Platform): CosmosTheme {
  const baseTheme = platform === Platform.Fabric
    ? createLightTheme(appThemeFabricTealBrandRamp)
    : createLightTheme(appThemePortalBrandRamp);

  return {
    ...baseTheme,
    ...cosmosThemeElements,
  };
}
