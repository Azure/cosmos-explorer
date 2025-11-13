import { useCallback } from "react";
import { Platform } from "../ConfigContext";
import { ApiType } from "../UserContext";
import HealthMetricScenario, { reportHealthy, reportUnhealthy } from "./HealthMetrics";

export interface UseHealthMetricsApi {
  markHealthy: (scenario: HealthMetricScenario, platform: Platform, api: ApiType) => Promise<Response | undefined>;
  markUnhealthy: (scenario: HealthMetricScenario, platform: Platform, api: ApiType) => Promise<Response | undefined>;
}

export function useHealthMetrics(): UseHealthMetricsApi {
  const healthy = useCallback(
    (scenario: HealthMetricScenario, platform: Platform, api: ApiType) => reportHealthy(scenario, platform, api),
    [],
  );
  const unhealthy = useCallback(
    (scenario: HealthMetricScenario, platform: Platform, api: ApiType) => reportUnhealthy(scenario, platform, api),
    [],
  );

  return {
    markHealthy: healthy,
    markUnhealthy: unhealthy,
  };
}

export default useHealthMetrics;
