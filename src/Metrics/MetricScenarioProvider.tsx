import React, { useContext } from "react";
import MetricScenario from "./MetricEvents";
import { MetricPhase } from "./ScenarioConfig";
import { scenarioMonitor } from "./ScenarioMonitor";

export interface MetricScenarioContextValue {
  startScenario: (scenario: MetricScenario) => void;
  startPhase: (scenario: MetricScenario, phase: MetricPhase) => void;
  completePhase: (scenario: MetricScenario, phase: MetricPhase) => void;
}

const MetricScenarioContext = React.createContext<MetricScenarioContextValue | undefined>(undefined);

export const MetricScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: MetricScenarioContextValue = {
    startScenario: (s: MetricScenario) => scenarioMonitor.start(s),
    startPhase: (s: MetricScenario, p: MetricPhase) => scenarioMonitor.startPhase(s, p),
    completePhase: (s: MetricScenario, p: MetricPhase) => scenarioMonitor.completePhase(s, p),
  };
  return <MetricScenarioContext.Provider value={value}>{children}</MetricScenarioContext.Provider>;
};

export function useMetricScenario(): MetricScenarioContextValue {
  const ctx = useContext(MetricScenarioContext);
  if (!ctx) {
    throw new Error("useMetricScenario must be used within MetricScenarioProvider");
  }
  return ctx;
}
