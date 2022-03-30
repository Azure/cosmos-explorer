import { userContext } from "UserContext";

export const autoPilotThroughput1K = 1000;
export const autoPilotIncrementStep = 1000;
export const autoPilotThroughput4K = 4000;

export function isValidAutoPilotThroughput(maxThroughput: number): boolean {
  if (!maxThroughput) {
    return false;
  }
  const minAutoPilotThroughput = userContext.features.freetierAutoscaleThroughput
    ? autoPilotThroughput1K
    : autoPilotThroughput4K;
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
