import React, { useCallback, useContext } from "react";
import MetricScenario from "./MetricEvents";
import { MetricPhase } from "./ScenarioConfig";
import { scenarioMonitor } from "./ScenarioMonitor";

interface MetricScenarioContextValue {
  startScenario: (scenario: MetricScenario) => void;
  startPhase: (scenario: MetricScenario, phase: MetricPhase) => void;
  completePhase: (scenario: MetricScenario, phase: MetricPhase) => void;
}

const MetricScenarioContext = React.createContext<MetricScenarioContextValue | undefined>(undefined);

export const MetricScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const startScenario = useCallback((s: MetricScenario) => scenarioMonitor.start(s), []);
  const startPhase = useCallback((s: MetricScenario, p: MetricPhase) => scenarioMonitor.startPhase(s, p), []);
  const completePhase = useCallback((s: MetricScenario, p: MetricPhase) => scenarioMonitor.completePhase(s, p), []);
  return (
    <MetricScenarioContext.Provider value={{ startScenario, startPhase, completePhase }}>
      {children}
    </MetricScenarioContext.Provider>
  );
};

export function useMetricScenario(): MetricScenarioContextValue {
  const ctx = useContext(MetricScenarioContext);
  if (!ctx) {
    throw new Error("useMetricScenario must be used within MetricScenarioProvider");
  }
  return ctx;
}
