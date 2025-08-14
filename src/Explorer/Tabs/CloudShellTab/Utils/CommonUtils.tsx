import { Terminal } from "@xterm/xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";

/**
 * Utility function to wait for a specified duration
 */
export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract host from a URL
 */
export const getHostFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error("Invalid URL:", error);
    return "";
  }
};

export const askConfirmation = async (terminal: Terminal, question: string): Promise<boolean> => {
  terminal.writeln(`\n${question} (Y/N)`);
  terminal.focus();
  return new Promise<boolean>((resolve) => {
    const keyListener = terminal.onKey(({ key }: { key: string }) => {
      keyListener.dispose();
      terminal.writeln(key);
      return resolve(key.toLowerCase() === "y");
    });
  });
};

/**
 * Gets the current locale for API requests
 */
export const getLocale = (): string => {
  const langLocale = navigator.language;
  return langLocale && langLocale.length > 2 ? langLocale : "en-us";
};

export const getShellNameForDisplay = (terminalKind: TerminalKind): string => {
  switch (terminalKind) {
    case TerminalKind.Postgres:
      return "PostgreSQL";
    case TerminalKind.Mongo:
    case TerminalKind.VCoreMongo:
      return "MongoDB";
    default:
      return "";
  }
};
