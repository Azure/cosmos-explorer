import * as ViewModels from "../Contracts/ViewModels";
import { PlatformType } from "../PlatformType";
import { PortalTokenProvider } from "./PortalTokenProvider";

export class TokenProviderFactory {
  private constructor() {}

  public static create(): ViewModels.TokenProvider {
    const platformType = window.dataExplorerPlatform;
    switch (platformType) {
      case PlatformType.Portal:
      case PlatformType.Hosted:
        return new PortalTokenProvider();
      case PlatformType.Emulator:
      default:
        // should never get into this state
        throw new Error(`Unknown platform ${platformType}`);
    }
  }
}
