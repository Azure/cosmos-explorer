import {
  BrandVariants,
  FluentProvider,
  Theme,
  createLightTheme,
  makeStyles,
  mergeClasses,
  shorthands,
  themeToTokensObject,
  webLightTheme,
} from "@fluentui/react-components";
import { Platform, configContext } from "ConfigContext";
import React, { PropsWithChildren } from "react";
import { appThemeFabricTealBrandRamp } from "../../Platform/Fabric/FabricTheme";

export const LayoutConstants = {
  rowHeight: 36,
};

export type CosmosFluentProviderProps = PropsWithChildren<{
  className?: string;
}>;

const useDefaultRootStyles = makeStyles({
  fluentProvider: {
    // By default, a FluentProvider has a solid background.
    // The styles for a FluentProvider are _copied_ to any Portals (https://react.fluentui.dev/?path=/docs/components-portal-portal--default)
    // created by components inside the FluentProvider, such as when rendering popup-up menus.
    // However, we often stretch our FluentProviders to full height using a `height: 100%` style.
    // When we do that, the Portal will also stretch to full height, but it will have a solid background and block out the entire document behind it.
    backgroundColor: "transparent",
  }
});

export const CosmosFluentProvider: React.FC<CosmosFluentProviderProps> = ({ children, className }) => {
  const styles = useDefaultRootStyles();
  return (
    <FluentProvider theme={getPlatformTheme(configContext.platform)} className={mergeClasses(styles.fluentProvider, className)}>
      {children}
    </FluentProvider>
  );
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
};

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
  const baseTheme =
    platform === Platform.Fabric
      ? createLightTheme(appThemeFabricTealBrandRamp)
      : createLightTheme(appThemePortalBrandRamp);

  return {
    ...baseTheme,
    ...cosmosThemeElements,
  };
}
