import {
  BrandVariants,
  ComponentProps,
  FluentProvider,
  FluentProviderSlots,
  Theme,
  createLightTheme,
  makeStyles,
  mergeClasses,
  shorthands,
  themeToTokensObject,
  webLightTheme,
} from "@fluentui/react-components";
import { Platform, configContext } from "ConfigContext";
import React from "react";
import { appThemeFabricTealBrandRamp } from "../../Platform/Fabric/FabricTheme";

export const LayoutConstants = {
  rowHeight: 36,
};

// Our CosmosFluentProvider has the same props as a FluentProvider.
export type CosmosFluentProviderProps = Omit<ComponentProps<FluentProviderSlots, "root">, "dir">;

// PropsWithChildren<{
//   className?: string;
// }>;

const useDefaultRootStyles = makeStyles({
  fluentProvider: {
    // By default, a FluentProvider has a solid background.
    // The styles for a FluentProvider are _copied_ to any Portals (https://react.fluentui.dev/?path=/docs/components-portal-portal--default)
    // created by components inside the FluentProvider, such as when rendering popup-up menus.
    // However, we often stretch our FluentProviders to full height using a `height: 100%` style.
    // When we do that, the Portal will also stretch to full height, but it will have a solid background and block out the entire document behind it.
    backgroundColor: "transparent",
  },
});

const FluentProviderContext = React.createContext({
  isInFluentProvider: false,
});

export const CosmosFluentProvider: React.FC<CosmosFluentProviderProps> = ({ children, className, ...props }) => {
  // We use a React context to ensure that nested CosmosFluentProviders don't create nested FluentProviders.
  // This helps during the transition from Fluent UI 8 to Fluent UI 9.
  // As we convert components to Fluent UI 9, if we end up with nested FluentProviders, the inner FluentProvider will be a no-op.
  const { isInFluentProvider } = React.useContext(FluentProviderContext);
  const styles = useDefaultRootStyles();

  if (isInFluentProvider) {
    // We're already in a fluent context, don't create another.
    console.warn("Nested CosmosFluentProvider detected. This is likely a bug.");
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <FluentProviderContext.Provider value={{ isInFluentProvider: true }}>
      <FluentProvider
        theme={getPlatformTheme(configContext.platform)}
        className={mergeClasses(styles.fluentProvider, className)}
        {...props}
      >
        {children}
      </FluentProvider>
    </FluentProviderContext.Provider>
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

const cosmosThemeElements = {};

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
