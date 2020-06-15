import { MessageHandler } from "./MessageHandler";
import { Diagnostics, MessageTypes } from "../Contracts/ExplorerContracts";
import { appInsights } from "../Shared/appInsights";
import { SeverityLevel } from "@microsoft/applicationinsights-web";

// TODO: Move to a separate Diagnostics folder
export class Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static logInfo(message: string | Record<string, any>, area: string, code?: number): void {
    let logMessage: string;
    if (typeof message === "string") {
      logMessage = message;
    } else {
      logMessage = JSON.stringify(message, Object.getOwnPropertyNames(message));
    }
    const entry: Diagnostics.LogEntry = Logger._generateLogEntry(
      Diagnostics.LogEntryLevel.Verbose,
      logMessage,
      area,
      code
    );
    return Logger._logEntry(entry);
  }

  public static logWarning(message: string, area: string, code?: number): void {
    const entry: Diagnostics.LogEntry = Logger._generateLogEntry(
      Diagnostics.LogEntryLevel.Warning,
      message,
      area,
      code
    );
    return Logger._logEntry(entry);
  }

  public static logError(message: string | Error, area: string, code?: number): void {
    let logMessage: string;
    if (typeof message === "string") {
      logMessage = message;
    } else {
      logMessage = JSON.stringify(message, Object.getOwnPropertyNames(message));
    }
    const entry: Diagnostics.LogEntry = Logger._generateLogEntry(
      Diagnostics.LogEntryLevel.Error,
      logMessage,
      area,
      code
    );
    return Logger._logEntry(entry);
  }

  private static _logEntry(entry: Diagnostics.LogEntry): void {
    MessageHandler.sendMessage({
      type: MessageTypes.LogInfo,
      data: JSON.stringify(entry)
    });

    const severityLevel = ((level: Diagnostics.LogEntryLevel): SeverityLevel => {
      switch (level) {
        case Diagnostics.LogEntryLevel.Custom:
        case Diagnostics.LogEntryLevel.Debug:
        case Diagnostics.LogEntryLevel.Verbose:
          return SeverityLevel.Verbose;
        case Diagnostics.LogEntryLevel.Warning:
          return SeverityLevel.Warning;
        case Diagnostics.LogEntryLevel.Error:
          return SeverityLevel.Error;
        default:
          return SeverityLevel.Information;
      }
    })(entry.level);
    appInsights.trackTrace({ message: entry.message, severityLevel }, { area: entry.area });
  }

  private static _generateLogEntry(
    level: Diagnostics.LogEntryLevel,
    message: string,
    area: string,
    code: number
  ): Diagnostics.LogEntry {
    return {
      timestamp: new Date().getUTCSeconds(),
      level: level,
      message: message,
      area: area,
      code: code
    };
  }
}
