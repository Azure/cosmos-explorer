/**
 * @jest-environment jsdom
 *
 * Regression tests for IcM 865096261 — DataExplorerHealthV2 "High Unhealthy Percentage".
 *
 * DatabaseTreeRendered used to be completed by any tree render. Because the phase is only
 * opened after collections finish (Explorer.tsx) and databaseTreeNodes is memoised
 * (ResourceTree.tsx), every completion arrived before the phase existed and was dropped:
 * missing in 1624 of 1627 DatabaseLoad timeouts over three days.
 *
 * The fix is on the producer side — a ready revision published once the load has produced the
 * data the tree is expected to show, acknowledged by the render that carries it. These tests
 * pin the monitor half of that contract: completions for phases that were never opened are
 * refused rather than backdated, so a render observed too early cannot stand in for the
 * loaded tree.
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

const lastEmit = () => (reportMetric as jest.Mock).mock.calls.at(-1)[0];

/** Producer sequence up to the point where the tree is ready to be acknowledged. */
const loadUpToTreeReady = () => {
  scenarioMonitor.start(MetricScenario.DatabaseLoad);
  scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);
  scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
  scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
  // Explorer publishes the ready revision immediately after opening the phase.
  scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
};

describe("DatabaseLoad phase accounting (IcM 865096261)", () => {
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

  it("completes healthy once the render carrying the ready revision is acknowledged", () => {
    loadUpToTreeReady();
    // ResourceTree commits the revision-bearing render and acknowledges it.
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(false);
    expect(emitted.healthy).toBe(true);
    expect(emitted.completedPhases).toEqual(
      expect.arrayContaining([
        ApplicationMetricPhase.DatabasesFetched,
        ApplicationMetricPhase.CollectionsLoaded,
        ApplicationMetricPhase.DatabaseTreeRendered,
        CommonMetricPhase.Interactive,
      ]),
    );
  });

  it("refuses a tree completion that arrives before the phase is opened", () => {
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

    // A render of the databases-only tree, while collections are still loading. This must not
    // be accepted as the loaded tree, and must not be backdated once the phase opens.
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);

    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(true);
    expect(emitted.healthy).toBe(false);
    expect(emitted.completedPhases).not.toContain(ApplicationMetricPhase.DatabaseTreeRendered);
  });

  it("does not buffer a deferred phase reported before the scenario exists", () => {
    // A stale callback from a superseded load, before this load has started.
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);

    loadUpToTreeReady();
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(true);
    expect(emitted.healthy).toBe(false);
    expect(emitted.completedPhases).not.toContain(ApplicationMetricPhase.DatabaseTreeRendered);
  });

  it("still honours a non-deferred completion reported before the scenario exists", () => {
    // useInteractive is a one-shot effect started with the scenario, so a mount that beats
    // refreshExplorer is a real observation and must not be lost.
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, CommonMetricPhase.Interactive);

    loadUpToTreeReady();
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(false);
    expect(emitted.healthy).toBe(true);
    expect(emitted.completedPhases).toContain(CommonMetricPhase.Interactive);
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

  it("reports an unfinished background load as unhealthy, with the visibility context", () => {
    // Timer throttling may justify excluding this from alerting, but the load did not finish,
    // so the emitted outcome must stay unhealthy and carry documentHidden for that decision.
    const hidden = jest.spyOn(document, "hidden", "get").mockReturnValue(true);
    try {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      jest.advanceTimersByTime(10_000);

      const emitted = lastEmit();
      expect(emitted.timedOut).toBe(true);
      expect(emitted.documentHidden).toBe(true);
      expect(emitted.healthy).toBe(false);
      expect(emitted.completedPhases).toHaveLength(0);
    } finally {
      hidden.mockRestore();
    }
  });

  it("excuses a timeout that followed an expected failure", () => {
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.markExpectedFailure();

    jest.advanceTimersByTime(10_000);

    const emitted = lastEmit();
    expect(emitted.timedOut).toBe(true);
    expect(emitted.hasExpectedFailure).toBe(true);
    expect(emitted.healthy).toBe(true);
  });
});
