import * as Constants from "../Common/Constants";
import { AutoPilotOfferSettings, AutopilotTier, Offer } from "../Contracts/DataModels";
import { DropdownOption } from "../Contracts/ViewModels";

export const manualToAutoscaleDisclaimer = `The starting autoscale max RU/s will be determined by the system, based on the current manual throughput settings and storage of your resource. After autoscale has been enabled, you can change the max RU/s. <a href="${Constants.Urls.autoscaleMigration}">Learn more</a>.`;

export const minAutoPilotThroughput = 4000;

export const autoPilotIncrementStep = 1000;

const autoPilotTiers: Array<AutopilotTier> = [
  AutopilotTier.Tier1,
  AutopilotTier.Tier2,
  AutopilotTier.Tier3,
  AutopilotTier.Tier4
];

const autoPilotTierTextMap = {
  [AutopilotTier.Tier1]: Constants.AutoPilot.tier1Text,
  [AutopilotTier.Tier2]: Constants.AutoPilot.tier2Text,
  [AutopilotTier.Tier3]: Constants.AutoPilot.tier3Text,
  [AutopilotTier.Tier4]: Constants.AutoPilot.tier4Text
};

export function isAutoPilotOfferUpgradedToV3(offer: AutoPilotOfferSettings): boolean {
  return offer && !offer.tier;
}

export function isValidV3AutoPilotOffer(offer: Offer): boolean {
  const maxThroughput =
    offer &&
    offer.content &&
    offer.content.offerAutopilotSettings &&
    offer.content.offerAutopilotSettings.maxThroughput;
  return isValidAutoPilotThroughput(maxThroughput);
}

export function isValidV2AutoPilotOffer(offer: Offer): boolean {
  const tier =
    offer && offer.content && offer.content.offerAutopilotSettings && offer.content.offerAutopilotSettings.tier;
  if (!tier) {
    return false;
  }
  return isValidAutoPilotTier(tier);
}

export function isValidAutoPilotTier(tier: number | AutopilotTier): boolean {
  if (autoPilotTiers.indexOf(tier) >= 0) {
    return true;
  }
  return false;
}

export function getAutoPilotTextWithTier(tier: AutopilotTier): string {
  return !!autoPilotTierTextMap[tier] ? autoPilotTierTextMap[tier] : undefined;
}

export function getAvailableAutoPilotTiersOptions(
  tier: AutopilotTier = AutopilotTier.Tier1
): DropdownOption<AutopilotTier>[] {
  if (!isValidAutoPilotTier(tier)) {
    tier = AutopilotTier.Tier1;
  }

  return autoPilotTiers.map((t: AutopilotTier) => ({ value: t, text: getAutoPilotTextWithTier(t) }));
}

export function isValidAutoPilotThroughput(maxThroughput: number): boolean {
  if (!maxThroughput) {
    return false;
  }
  if (maxThroughput < minAutoPilotThroughput) {
    return false;
  }
  if (maxThroughput % 1000) {
    return false;
  }
  return true;
}

export function getMinRUsBasedOnUserInput(throughput: number): number {
  return Math.round(throughput && throughput * 0.1);
}

export function getStorageBasedOnUserInput(throughput: number): number {
  return Math.round(throughput && throughput * 0.01);
}

export function getAutoPilotHeaderText(isV2Model: boolean): string {
  if (isV2Model) {
    return "Throughput (Autopilot)";
  }
  return "Throughput (autoscale)";
}
