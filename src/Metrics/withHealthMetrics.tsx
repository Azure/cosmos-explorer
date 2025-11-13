/**
 * Higher-Order Component (HOC) that injects health metrics state and API surface
 * into legacy (class-based) React components that cannot directly consume hooks.
 *
 * Rationale / Why this is needed:
 * - We are gradually migrating older class components toward function components + hooks.
 * - The `useHealthMetrics` hook centralizes health status, refresh, and scenario reporting logic.
 * - Class components cannot call hooks; rewriting them all at once would be high-risk and noisy.
 * - This lightweight adapter lets those components opt in to the shared health metrics contract
 *   immediately without a full refactor, reducing duplicated polling / ad‑hoc fetch logic.
 * - It also documents the explicit injected prop shape (`HealthMetricsInjectedProps`) to ease
 *   future conversion: remove the HOC wrapper and replace `this.props.*` with hook calls.
 *
 * Guidance:
 * - Prefer the hook (`useHealthMetrics`) in any new function component.
 * - Limit usage of this HOC to transitional / legacy areas; treat it as a migration aid.
 * - When refactoring a wrapped class component to a function component, delete the wrapper and
 *   call `useHealthMetrics()` directly.
 *
 * Usage example:
 * ```tsx
 * class MyDashboard extends React.Component<HealthMetricsInjectedProps> {
 *   render() {
 *     const { healthStatus, refreshHealth } = this.props;
 *     return <div>{healthStatus}</div>;
 *   }
 * }
 * export default withHealthMetrics(MyDashboard);
 * ```
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
