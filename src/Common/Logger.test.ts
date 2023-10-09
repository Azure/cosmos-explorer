jest.mock("./MessageHandler");
import * as Logger from "./Logger";
import { sendMessage } from "./MessageHandler";

describe("Logger", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should log info messages", () => {
    Logger.logInfo("Test info", "DocDB");
    expect(sendMessage).toHaveBeenCalled();
  });

  it("should log error messages", () => {
    Logger.logError("Test error", "DocDB");
    expect(sendMessage).toHaveBeenCalled();
  });

  it("should log warnings", () => {
    Logger.logWarning("Test warning", "DocDB");
    expect(sendMessage).toHaveBeenCalled();
  });
});
