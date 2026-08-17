import { Terminal } from "xterm";
import { registerTerminalResizeHandler } from "./CloudShellTerminalCore";
import { resizeTerminal } from "./Data/CloudShellClient";

// Mock the CloudShell client so we can assert on backend resize calls without any network access.
jest.mock("./Data/CloudShellClient");

const mockResizeTerminal = resizeTerminal as jest.Mock;

const CONSOLE_URI = "https://shell.azure.com/console123";
const TERMINAL_ID = "terminal-id";
const DEBOUNCE_MS = 300;

type ResizeListener = (size: { cols: number; rows: number }) => void;

interface MockTerminal {
  cols: number;
  rows: number;
  onResize: (listener: ResizeListener) => void;
  emitResize: (size: { cols: number; rows: number }) => void;
}

const createMockTerminal = (cols: number, rows: number): MockTerminal => {
  let listener: ResizeListener | undefined;
  return {
    cols,
    rows,
    onResize: (cb: ResizeListener) => {
      listener = cb;
    },
    emitResize: (size: { cols: number; rows: number }) => listener?.(size),
  };
};

const registerHandler = (terminal: MockTerminal): void =>
  registerTerminalResizeHandler(terminal as unknown as Terminal, CONSOLE_URI, TERMINAL_ID);

describe("registerTerminalResizeHandler", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockResizeTerminal.mockReset();
    mockResizeTerminal.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("does not notify the backend when the dimensions are unchanged", () => {
    const terminal = createMockTerminal(80, 24);
    registerHandler(terminal);

    terminal.emitResize({ cols: 80, rows: 24 });
    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(mockResizeTerminal).not.toHaveBeenCalled();
  });

  it("notifies the backend with the new dimensions after the debounce interval", () => {
    const terminal = createMockTerminal(80, 24);
    registerHandler(terminal);

    terminal.emitResize({ cols: 120, rows: 40 });
    // Nothing should be sent until the debounce interval elapses.
    expect(mockResizeTerminal).not.toHaveBeenCalled();

    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(mockResizeTerminal).toHaveBeenCalledTimes(1);
    expect(mockResizeTerminal).toHaveBeenCalledWith(CONSOLE_URI, TERMINAL_ID, { cols: 120, rows: 40 });
  });

  it("debounces rapid resizes into a single call with the latest dimensions", () => {
    const terminal = createMockTerminal(80, 24);
    registerHandler(terminal);

    terminal.emitResize({ cols: 100, rows: 30 });
    terminal.emitResize({ cols: 110, rows: 35 });
    terminal.emitResize({ cols: 120, rows: 40 });

    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(mockResizeTerminal).toHaveBeenCalledTimes(1);
    expect(mockResizeTerminal).toHaveBeenCalledWith(CONSOLE_URI, TERMINAL_ID, { cols: 120, rows: 40 });
  });

  it("sends a separate call for each resize that is spaced beyond the debounce interval", () => {
    const terminal = createMockTerminal(80, 24);
    registerHandler(terminal);

    terminal.emitResize({ cols: 100, rows: 30 });
    jest.advanceTimersByTime(DEBOUNCE_MS);

    terminal.emitResize({ cols: 120, rows: 40 });
    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(mockResizeTerminal).toHaveBeenCalledTimes(2);
    expect(mockResizeTerminal).toHaveBeenNthCalledWith(1, CONSOLE_URI, TERMINAL_ID, { cols: 100, rows: 30 });
    expect(mockResizeTerminal).toHaveBeenNthCalledWith(2, CONSOLE_URI, TERMINAL_ID, { cols: 120, rows: 40 });
  });

  it("swallows backend resize errors and logs a warning", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockResizeTerminal.mockRejectedValueOnce(new Error("boom"));
    const terminal = createMockTerminal(80, 24);
    registerHandler(terminal);

    terminal.emitResize({ cols: 120, rows: 40 });
    jest.advanceTimersByTime(DEBOUNCE_MS);
    // Flush the microtask queue so the rejected promise's .catch handler runs.
    await Promise.resolve();

    expect(mockResizeTerminal).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("CloudShell: failed to resize backend terminal", expect.any(Error));

    warnSpy.mockRestore();
  });
});
