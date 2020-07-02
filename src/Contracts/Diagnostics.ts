/**
 * Trace level.
 */
export enum LogEntryLevel {
  /**
   * Custom events.
   */
  Custom = -2,
  /**
   * Debug level.
   */
  Debug = -1,
  /**
   * Verbose level.
   */
  Verbose = 0,
  /**
   * Warning level.
   */
  Warning = 1,
  /**
   * Error level.
   */
  Error = 2,
}
/**
 * Schema of a log entry.
 */
export interface LogEntry {
  /**
   * Timestamp
   */
  timestamp: number;
  /**
   * Level
   */
  level: LogEntryLevel;
  /**
   * Portal, etc
   */
  area: string;
  /**
   * The message to be logged.
   */
  message: string;
  /**
   * The message code.
   */
  code: number;
  /**
   * Any additional data to be logged.
   */
  args?: any[];
}
export type LogMessage = string | Error;
