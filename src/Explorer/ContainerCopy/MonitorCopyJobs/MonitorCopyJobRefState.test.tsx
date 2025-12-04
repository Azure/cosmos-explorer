import { MonitorCopyJobsRefState } from "./MonitorCopyJobRefState";
import { MonitorCopyJobsRef } from "./MonitorCopyJobs";

describe("MonitorCopyJobsRefState", () => {
  beforeEach(() => {
    MonitorCopyJobsRefState.setState({ ref: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with null ref", () => {
    const state = MonitorCopyJobsRefState.getState();
    expect(state.ref).toBeNull();
  });

  it("should set ref using setRef", () => {
    const mockRef: MonitorCopyJobsRef = {
      refreshJobList: jest.fn(),
    };

    const state = MonitorCopyJobsRefState.getState();
    state.setRef(mockRef);

    const updatedState = MonitorCopyJobsRefState.getState();
    expect(updatedState.ref).toBe(mockRef);
    expect(updatedState.ref).toEqual(mockRef);
  });

  it("should allow setting ref to null", () => {
    const mockRef: MonitorCopyJobsRef = {
      refreshJobList: jest.fn(),
    };

    MonitorCopyJobsRefState.getState().setRef(mockRef);
    expect(MonitorCopyJobsRefState.getState().ref).toBe(mockRef);

    MonitorCopyJobsRefState.getState().setRef(null);
    expect(MonitorCopyJobsRefState.getState().ref).toBeNull();
  });

  it("should call refreshJobList method on the stored ref", () => {
    const mockRefreshJobList = jest.fn();
    const mockRef: MonitorCopyJobsRef = {
      refreshJobList: mockRefreshJobList,
    };

    MonitorCopyJobsRefState.getState().setRef(mockRef);

    const state = MonitorCopyJobsRefState.getState();
    state.ref?.refreshJobList();

    expect(mockRefreshJobList).toHaveBeenCalledTimes(1);
  });

  it("should handle calling refreshJobList when ref is null", () => {
    MonitorCopyJobsRefState.setState({ ref: null });

    const state = MonitorCopyJobsRefState.getState();
    expect(state.ref).toBeNull();

    // This should not throw an error due to optional chaining
    expect(() => {
      state.ref?.refreshJobList();
    }).not.toThrow();
  });

  it("should allow partial state updates", () => {
    const mockRef: MonitorCopyJobsRef = {
      refreshJobList: jest.fn(),
    };

    // Set initial ref
    MonitorCopyJobsRefState.setState({ ref: mockRef });
    const state1 = MonitorCopyJobsRefState.getState();
    expect(state1.ref).toBe(mockRef);
    expect(state1.setRef).toBeDefined();

    // Update only the ref, setRef should still exist
    const newMockRef: MonitorCopyJobsRef = {
      refreshJobList: jest.fn(),
    };
    MonitorCopyJobsRefState.setState({ ref: newMockRef });
    const state2 = MonitorCopyJobsRefState.getState();
    expect(state2.ref).toBe(newMockRef);
    expect(state2.setRef).toBeDefined();
  });

  it("should handle multiple subscribers", () => {
    const mockSubscriber1 = jest.fn();
    const mockSubscriber2 = jest.fn();

    const unsubscribe1 = MonitorCopyJobsRefState.subscribe(mockSubscriber1);
    const unsubscribe2 = MonitorCopyJobsRefState.subscribe(mockSubscriber2);

    const mockRef: MonitorCopyJobsRef = {
      refreshJobList: jest.fn(),
    };

    MonitorCopyJobsRefState.getState().setRef(mockRef);

    expect(mockSubscriber1).toHaveBeenCalled();
    expect(mockSubscriber2).toHaveBeenCalled();

    unsubscribe1();
    unsubscribe2();
  });

  it("should not notify unsubscribed listeners", () => {
    const mockSubscriber = jest.fn();

    const unsubscribe = MonitorCopyJobsRefState.subscribe(mockSubscriber);
    unsubscribe();

    const mockRef: MonitorCopyJobsRef = {
      refreshJobList: jest.fn(),
    };

    mockSubscriber.mockClear();
    MonitorCopyJobsRefState.getState().setRef(mockRef);

    expect(mockSubscriber).not.toHaveBeenCalled();
  });
});
