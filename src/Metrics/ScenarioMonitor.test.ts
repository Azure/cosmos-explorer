/**
 * @jest-environment jsdom
 */

import { updateUserContext } from "../UserContext";
import { ErrorCategory } from "./ErrorClassification";
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
  Platform: {
    Portal: "Portal",
    Hosted: "Hosted",
    Emulator: "Emulator",
    Fabric: "Fabric",
  },
}));

describe("ScenarioMonitor", () => {
  let documentHidden = false;

  const getMetric = (scenario: MetricScenario) => {
    const call = (reportMetric as jest.Mock).mock.calls.find(([event]) => event.scenario === scenario);
    return call?.[0];
  };

  const completeApplicationLoad = () => {
    scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.PlatformConfigured);
    scenarioMonitor.startPhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
    scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
    scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);
  };

  beforeAll(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => documentHidden,
    });
  });

  beforeEach(() => {
    documentHidden = false;
    jest.clearAllMocks();
    jest.useFakeTimers({ legacyFakeTimers: true });

    if (typeof performance.mark !== "function") {
      Object.defineProperty(global, "performance", {
        writable: true,
        configurable: true,
        value: {
          mark: jest.fn(),
          measure: jest.fn(),
          clearMarks: jest.fn(),
          clearMeasures: jest.fn(),
          getEntriesByName: jest.fn().mockReturnValue([{ startTime: 0 }]),
          getEntriesByType: jest.fn().mockReturnValue([]),
          now: jest.fn(() => Date.now()),
          timeOrigin: Date.now(),
        },
      });
    }

    updateUserContext({ apiType: "SQL" });
    scenarioMonitor.reset();
  });

  afterEach(() => {
    scenarioMonitor.reset();
    jest.useRealTimers();
  });

  afterAll(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
  });

  it("does not apply an ApplicationLoad expected error to DatabaseLoad", () => {
    scenarioMonitor.start(MetricScenario.ApplicationLoad);
    scenarioMonitor.start(MetricScenario.DatabaseLoad);

    scenarioMonitor.failPhase(
      MetricScenario.ApplicationLoad,
      ApplicationMetricPhase.PlatformConfigured,
      ErrorCategory.Expected,
    );
    jest.advanceTimersByTime(10000);

    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({ healthy: true, hasExpectedFailure: true, timedOut: true }),
    );
    expect(getMetric(MetricScenario.DatabaseLoad)).toEqual(
      expect.objectContaining({ healthy: false, hasExpectedFailure: false, timedOut: true }),
    );
  });

  it("emits unhealthy when an unexpected DatabaseLoad phase fails after expected evidence", () => {
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.failPhase(
      MetricScenario.DatabaseLoad,
      ApplicationMetricPhase.DatabasesFetched,
      ErrorCategory.Expected,
    );
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);

    scenarioMonitor.failPhase(
      MetricScenario.DatabaseLoad,
      ApplicationMetricPhase.CollectionsLoaded,
      ErrorCategory.Unexpected,
    );

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.DatabaseLoad)).toEqual(
      expect.objectContaining({ healthy: false, hasExpectedFailure: true, timedOut: false }),
    );
  });

  it("emits healthy once at timeout after multiple expected failures", () => {
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.failPhase(
      MetricScenario.DatabaseLoad,
      ApplicationMetricPhase.DatabasesFetched,
      ErrorCategory.Expected,
    );
    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    scenarioMonitor.failPhase(
      MetricScenario.DatabaseLoad,
      ApplicationMetricPhase.CollectionsLoaded,
      ErrorCategory.Expected,
    );

    jest.advanceTimersByTime(10000);

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.DatabaseLoad)).toEqual(
      expect.objectContaining({ healthy: true, hasExpectedFailure: true, timedOut: true }),
    );
  });

  it("keeps an expected-erroring required phase pending", () => {
    scenarioMonitor.start(MetricScenario.ApplicationLoad);
    scenarioMonitor.failPhase(
      MetricScenario.ApplicationLoad,
      ApplicationMetricPhase.PlatformConfigured,
      ErrorCategory.Expected,
    );
    scenarioMonitor.startPhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
    scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
    scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);

    expect(reportMetric).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10000);

    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({
        healthy: true,
        timedOut: true,
        completedPhases: expect.not.arrayContaining([ApplicationMetricPhase.PlatformConfigured]),
      }),
    );
  });

  it("emits healthy with diagnostics when a phase succeeds after expected evidence", () => {
    scenarioMonitor.start(MetricScenario.ApplicationLoad);
    scenarioMonitor.markExpectedFailure(MetricScenario.ApplicationLoad, ApplicationMetricPhase.PlatformConfigured);

    completeApplicationLoad();

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({
        healthy: true,
        hasExpectedFailure: true,
        timedOut: false,
        completedPhases: expect.arrayContaining([
          ApplicationMetricPhase.PlatformConfigured,
          ApplicationMetricPhase.ExplorerInitialized,
          CommonMetricPhase.Interactive,
        ]),
      }),
    );
  });

  it("keeps an unexpected result unhealthy when expected evidence arrives later", () => {
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);
    scenarioMonitor.markExpectedFailure(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);

    jest.advanceTimersByTime(10000);

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.DatabaseLoad)).toEqual(
      expect.objectContaining({ healthy: false, hasExpectedFailure: false, timedOut: false }),
    );
  });

  it("treats hidden-at-start and hidden-later timeouts as healthy expected outcomes", () => {
    documentHidden = true;
    scenarioMonitor.start(MetricScenario.ApplicationLoad);

    documentHidden = false;
    scenarioMonitor.start(MetricScenario.DatabaseLoad);
    documentHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    documentHidden = false;

    jest.advanceTimersByTime(10000);

    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({ healthy: true, hasExpectedFailure: true, timedOut: true }),
    );
    expect(getMetric(MetricScenario.DatabaseLoad)).toEqual(
      expect.objectContaining({ healthy: true, hasExpectedFailure: true, timedOut: true }),
    );
  });

  it("emits unhealthy when an unexpected failure occurs while hidden", () => {
    documentHidden = true;
    scenarioMonitor.start(MetricScenario.DatabaseLoad);

    scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.DatabaseLoad)).toEqual(
      expect.objectContaining({ healthy: false, hasExpectedFailure: true, timedOut: false }),
    );
  });

  it("emits unhealthy on a visible timeout without expected evidence", () => {
    scenarioMonitor.start(MetricScenario.ApplicationLoad);

    jest.advanceTimersByTime(10000);

    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({ healthy: false, hasExpectedFailure: false, timedOut: true }),
    );
  });

  it("does not double emit when callbacks race after timeout", () => {
    scenarioMonitor.start(MetricScenario.ApplicationLoad);
    scenarioMonitor.markExpectedFailure(MetricScenario.ApplicationLoad, ApplicationMetricPhase.PlatformConfigured);
    jest.advanceTimersByTime(10000);

    completeApplicationLoad();
    scenarioMonitor.failPhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.PlatformConfigured);

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({ healthy: true, timedOut: true }),
    );
  });

  it("reset removes visibility listeners and clears scenario state", () => {
    const removeEventListener = jest.spyOn(document, "removeEventListener");
    scenarioMonitor.start(MetricScenario.ApplicationLoad);
    scenarioMonitor.markExpectedFailure(MetricScenario.ApplicationLoad, ApplicationMetricPhase.PlatformConfigured);

    scenarioMonitor.reset();

    expect(removeEventListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    scenarioMonitor.start(MetricScenario.ApplicationLoad);
    jest.advanceTimersByTime(10000);

    expect(reportMetric).toHaveBeenCalledTimes(1);
    expect(getMetric(MetricScenario.ApplicationLoad)).toEqual(
      expect.objectContaining({ healthy: false, hasExpectedFailure: false, timedOut: true }),
    );
    removeEventListener.mockRestore();
  });
});
