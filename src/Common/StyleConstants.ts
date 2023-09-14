import { Platform, configContext } from "../ConfigContext";

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const StyleConstants = require("less-vars-loader!../../less/Common/Constants.less");

export function updateStyles(): void {
  if (configContext.platform === Platform.Fabric) {
    StyleConstants.AccentMediumHigh = StyleConstants.FabricAccentMediumHigh;
    StyleConstants.AccentMedium = StyleConstants.FabricAccentMedium;
    StyleConstants.AccentLight = StyleConstants.FabricAccentLight;
    StyleConstants.AccentAccentExtra = StyleConstants.FabricAccentMediumHigh;
  } else {
    StyleConstants.AccentMediumHigh = StyleConstants.PortalAccentMediumHigh;
    StyleConstants.AccentMedium = StyleConstants.PortalAccentMedium;
    StyleConstants.AccentLight = StyleConstants.PortalAccentLight;
    StyleConstants.AccentAccentExtra = StyleConstants.PortalAccentMediumHigh;
  }
}
