jest.mock("./MessageHandler");
import { LogEntryLevel } from "../Contracts/Diagnostics";
import * as Logger from "./Logger";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { sendMessage } from "./MessageHandler";

describe("Logger", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should log info messages", () => {
    Logger.logInfo("Test info", "DocDB");
    expect(sendMessage).toBeCalled();
  });

  it("should log error messages", () => {
    Logger.logError("Test error", "DocDB");
    expect(sendMessage).toBeCalled();
  });

  it("should log warnings", () => {
    Logger.logWarning("Test warning", "DocDB");
    expect(sendMessage).toBeCalled();
  });
});
