import { AbstractShellHandler, DISABLE_HISTORY, START_MARKER } from "./AbstractShellHandler";

// Mock implementation for testing
class MockShellHandler extends AbstractShellHandler {
  getShellName(): string {
    return "MockShell";
  }

  getSetUpCommands(): string[] {
    return ["setup-command-1", "setup-command-2"];
  }

  getConnectionCommand(): string {
    return "mock-connection-command";
  }

  getEndpoint(): string {
    return "mock-endpoint";
  }

  getTerminalSuppressedData(): string {
    return "suppressed-data";
  }
}

describe("AbstractShellHandler", () => {
  let shellHandler: MockShellHandler;

  // Reset all mocks and spies before each test
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    shellHandler = new MockShellHandler();
  });

  // Reset everything after all tests
  afterAll(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  // Cleanup after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getInitialCommands", () => {
    it("should combine commands in the correct order", () => {
      // Spy on abstract methods to ensure they're called
      const getSetUpCommandsSpy = jest.spyOn(shellHandler, "getSetUpCommands");
      const getConnectionCommandSpy = jest.spyOn(shellHandler, "getConnectionCommand");

      const result = shellHandler.getInitialCommands();

      // Verify abstract methods were called
      expect(getSetUpCommandsSpy).toHaveBeenCalled();
      expect(getConnectionCommandSpy).toHaveBeenCalled();

      // Verify output format and content
      const expectedOutput = [
        START_MARKER,
        DISABLE_HISTORY,
        "setup-command-1",
        "setup-command-2",
        "mock-connection-command",
      ]
        .join("\n")
        .concat("\n");

      expect(result).toBe(expectedOutput);
    });
  });

  describe("abstract methods implementation", () => {
    it("should return the correct shell name", () => {
      expect(shellHandler.getShellName()).toBe("MockShell");
    });

    it("should return the setup commands", () => {
      expect(shellHandler.getSetUpCommands()).toEqual(["setup-command-1", "setup-command-2"]);
    });

    it("should return the connection command", () => {
      expect(shellHandler.getConnectionCommand()).toBe("mock-connection-command");
    });

    it("should return the endpoint", () => {
      expect(shellHandler.getEndpoint()).toBe("mock-endpoint");
    });

    it("should return the terminal suppressed data", () => {
      expect(shellHandler.getTerminalSuppressedData()).toBe("suppressed-data");
    });
  });
});
