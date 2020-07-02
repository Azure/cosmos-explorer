import { LogEntryLevel } from "../Contracts/Diagnostics";
import * as Logger from "./Logger";
import { MessageHandler } from "./MessageHandler";
import { MessageTypes } from "../Contracts/ExplorerContracts";

describe("Logger", () => {
  let sendMessageSpy: jasmine.Spy;

  beforeEach(() => {
    sendMessageSpy = spyOn(MessageHandler, "sendMessage");
  });

  afterEach(() => {
    sendMessageSpy = null;
  });

  it("should log info messages", () => {
    Logger.logInfo("Test info", "DocDB");
    const spyArgs = sendMessageSpy.calls.mostRecent().args[0];

    expect(spyArgs.type).toBe(MessageTypes.LogInfo);
    expect(spyArgs.data).toContain(LogEntryLevel.Verbose);
    expect(spyArgs.data).toContain("DocDB");
    expect(spyArgs.data).toContain("Test info");
  });

  it("should log error messages", () => {
    Logger.logError("Test error", "DocDB");
    const spyArgs = sendMessageSpy.calls.mostRecent().args[0];

    expect(spyArgs.type).toBe(MessageTypes.LogInfo);
    expect(spyArgs.data).toContain(LogEntryLevel.Error);
    expect(spyArgs.data).toContain("DocDB");
    expect(spyArgs.data).toContain("Test error");
  });

  it("should log warnings", () => {
    Logger.logWarning("Test warning", "DocDB");
    const spyArgs = sendMessageSpy.calls.mostRecent().args[0];

    expect(spyArgs.type).toBe(MessageTypes.LogInfo);
    expect(spyArgs.data).toContain(LogEntryLevel.Warning);
    expect(spyArgs.data).toContain("DocDB");
    expect(spyArgs.data).toContain("Test warning");
  });
});
