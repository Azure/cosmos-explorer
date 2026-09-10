/**
 * @jest-environment jsdom
 *
 * Regression tests for IcM 865096261 — DataExplorerHealthV2 "High Unhealthy Percentage".
 *
 * Before the fix, ScenarioMonitor.completePhase() silently no-oped when the phase had not
 * been started yet. The production call ordering in Explorer.tsx / ResourceTree.tsx always
 * hits that case:
 *
 *   - DatabaseTreeRendered is started at Explorer.tsx:451, but the effect that completes it
 *     (useMetricPhases.ts:55-59) last fires on the databaseTreeNodes change that happens
 *     *before* line 451. databaseTreeNodes is useMemo'd (ResourceTree.tsx:54), so the effect
 *     never re-fires and the phase stayed open until the 10 s timeout.
 *   - Interactive is completed by a one-shot effect (deps [scenario, enabled]) that can run
 *     before Explorer.tsx:577 starts the scenario at all.
 *
 * Telemetry over 3 days: DatabaseTreeRendered missing in 1624 of 1627 DatabaseLoad timeouts
 * (99.8%), Interactive missing in 588.
 *
 * Line references are against 1f04f0ae.
 */

import { updateUserContext } from "../UserContext";
import MetricScenario, { reportMetric } from "./MetricEvents";
import { ApplicationMetricPhase, CommonMetricPhase } from "./ScenarioConfig";
import { scenarioMonitor } from "./ScenarioMonitor";

jest.mock("./MetricEvents", () => ({
  __esModule: true,
  default: {
    ApplicationLoad: "ApplicationLoad",
    DatabaseLoad: "DatabaseLoad",
  },
  reportMetric: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("../ConfigContext", () => ({
  configContext: {
    platform: "Portal",
    PORTAL_BACKEND_ENDPOINT: "https://test.portal.azure.com",
  },
  Platform: { Portal: "Portal", Hosted: "Hosted", Emulator: "Emulator", Fabric: "Fabric" },
}));

/** Stands in for the useDatabaseLoadScenario effect firing on a databaseTreeNodes change. */
const treeRenderEffectFires = () =>
  scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);

const lastEmit = () => (reportMetric as jest.Mock).mock.calls.at(-1)[0];

const ALL_DATABASE_LOAD_PHASES = [
  ApplicationMetricPhase.DatabasesFetched,
  ApplicationMetricPhase.CollectionsLoaded,
  ApplicationMetricPhase.DatabaseTreeRendered,
  CommonMetricPhase.Interactive,
];

describe("DatabaseLoad phase ordering (IcM 865096261)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ legacyFakeTimers: true });
    updateUserContext({ apiType: "SQL" });
    scenarioMonitor.reset();
  });

  afterEach(() => {
    scenarioMonitor.reset();
    jest.useRealTimers();
  });

  it("completes healthy under the production call ordering", () => {
    // Explorer.tsx:577 — refreshExplorer starts the scenario
    scenarioMonitor.start(MetricScenario.DatabaseLoad);

    // Explorer.tsx:336 — databases fetched
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

    // ResourceTree re-renders (databases arrived) -> effect fires before the phase exists.
    treeRenderEffectFires();

    // Explorer.tsx:430 — _loadCollections begins
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);

    // Last databaseTreeNodes change; the memoised value never changes again after this.
    treeRenderEffectFires();

    // Explorer.tsx:449 / :451 — synchronous, immediately after `await Promise.all(...)`
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);

    // useInteractive rAF / 1 s fallback
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.scenario).toBe("DatabaseLoad");
    expect(emitted.timedOut).toBe(false);
    expect(emitted.healthy).toBe(true);
    expect(emitted.completedPhases).toEqual(expect.arrayContaining(ALL_DATABASE_LOAD_PHASES));
  });

  it("honours a completion that arrives before the scenario is started", () => {
    // ResourceTree mounts and its one-shot effects run before Explorer.tsx:577.
    treeRenderEffectFires();
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);

    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(false);
    expect(emitted.healthy).toBe(true);
    expect(emitted.completedPhases).toEqual(expect.arrayContaining(ALL_DATABASE_LOAD_PHASES));
  });

  it("still reports unhealthy when a phase genuinely never completes", () => {
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);
    // CollectionsLoaded and DatabaseTreeRendered never arrive — a real stall.

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(true);
    expect(emitted.healthy).toBe(false);
    expect(emitted.completedPhases).not.toContain(ApplicationMetricPhase.CollectionsLoaded);
  });

  it("does not count a timeout against health while the tab is backgrounded", () => {
    const hidden = jest.spyOn(document, "hidden", "get").mockReturnValue(true);
    try {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);
      scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

      jest.advanceTimersByTime(10_000);

      const emitted = lastEmit();
      expect(emitted.timedOut).toBe(true);
      expect(emitted.documentHidden).toBe(true);
      expect(emitted.healthy).toBe(true);
    } finally {
      hidden.mockRestore();
    }
  });
});
