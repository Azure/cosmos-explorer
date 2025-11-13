/**
 * Metrics HOC for legacy/class components.
 * Prefer the hook in new function components. See README in this folder.
 */
import React from "react";
import useHealthMetrics, { UseHealthMetricsApi } from "./useHealthMetrics";

export interface HealthMetricsInjectedProps extends UseHealthMetricsApi {}

export function withHealthMetrics<P extends object>(Component: React.ComponentType<P & HealthMetricsInjectedProps>) {
  const Wrapped: React.FC<P> = (props: P) => {
    const api = useHealthMetrics();
    return <Component {...props} {...api} />;
  };
  return Wrapped;
}

export default withHealthMetrics;
