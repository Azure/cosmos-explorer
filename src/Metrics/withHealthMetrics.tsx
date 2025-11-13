/**
 * Higher-Order Component (HOC) that injects health metrics data and APIs into
 * legacy (class-based) React components.
 *
 * This provides the same functionality as the `useHealthMetrics` hook, but in
 * a wrapper form compatible with components that cannot use hooks directly.
 *
 * Usage:
 * ```tsx
 * class MyDashboard extends React.Component<HealthMetricsInjectedProps> {
 *   render() {
 *     const { healthStatus, refreshHealth } = this.props;
 *     ...
 *   }
 * }
 *
 * export default withHealthMetrics(MyDashboard);
 * ```
 *
 * Why this exists:
 * - Hooks like `useHealthMetrics()` cannot be used in class components.
 * - This HOC bridges the gap by allowing older parts of the codebase to
 *   consume the same health metrics context without refactoring to function components.
 *
 * Prefer using the hook (`useHealthMetrics`) directly in new function components.
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
