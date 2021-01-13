import * as Constants from "../Common/Constants";

export const manualToAutoscaleDisclaimer = `The starting autoscale max RU/s will be determined by the system, based on the current manual throughput settings and storage of your resource. After autoscale has been enabled, you can change the max RU/s. <a href="${Constants.Urls.autoscaleMigration}">Learn more</a>.`;

export const minAutoPilotThroughput = 4000;

export const autoPilotIncrementStep = 1000;

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

export function getAutoPilotHeaderText(): string {
  return "Throughput (autoscale)";
}
