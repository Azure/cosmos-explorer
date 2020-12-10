import { configContext, Platform } from "../ConfigContext";
import * as ViewModels from "../Contracts/ViewModels";
import { PortalTokenProvider } from "./PortalTokenProvider";

export class TokenProviderFactory {
  private constructor() {}

  public static create(): ViewModels.TokenProvider {
    const platformType = configContext.platform;
    switch (platformType) {
      case Platform.Portal:
      case Platform.Hosted:
        return new PortalTokenProvider();
      case Platform.Emulator:
      default:
        // should never get into this state
        throw new Error(`Unknown platform ${platformType}`);
    }
  }
}
