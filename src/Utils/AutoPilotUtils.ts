export const autoPilotThroughput1K = 1000;
export const autoPilotIncrementStep = 1000;
export const autoPilotThroughput4K = 4000;
export const autoPilotThroughput10K = 10000;

export function isValidAutoPilotThroughput(maxThroughput: number): boolean {
  if (!maxThroughput) {
    return false;
  }
  if (maxThroughput < autoPilotThroughput1K) {
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
