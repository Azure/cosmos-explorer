import * as Constants from "../Common/Constants";
import * as DataModels from "../Contracts/DataModels";

export class OfferUtils {
  public static isOfferV1(offer: DataModels.Offer): boolean {
    return !offer || offer.offerVersion !== Constants.OfferVersions.V2;
  }

  public static isNotOfferV1(offer: DataModels.Offer): boolean {
    return !OfferUtils.isOfferV1(offer);
  }
}
