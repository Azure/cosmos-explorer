/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Common utility functions for CloudShell
 */

import { Terminal } from "xterm";
import { terminalLog } from "./LogFormatter";

/**
 * Utility function to wait for a specified duration
 */
export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility function to ask a question in the terminal
 */
export const askQuestion = (terminal: Terminal, question: string, defaultAnswer: string = ""): Promise<string> => {
  return new Promise<string>((resolve) => {
    const prompt = terminalLog.prompt(`${question} (${defaultAnswer}): `);
    terminal.writeln(prompt);
    terminal.focus();
    let response = "";

    const dataListener = terminal.onData((data: string) => {
      if (data === "\r") { // Enter key pressed
        terminal.writeln(""); // Move to a new line
        dataListener.dispose();
        if (response.trim() === "") {
          response = defaultAnswer; // Use default answer if no input
        }
        return resolve(response.trim());
      } else if (data === "\u007F" || data === "\b") { // Handle backspace
        if (response.length > 0) {
          response = response.slice(0, -1);
          terminal.write("\x1B[D \x1B[D"); // Move cursor back, clear character
        }
      } else if (data.charCodeAt(0) >= 32) { // Ignore control characters
        response += data;
        terminal.write(data); // Display typed characters
      }
    });

    // Prevent cursor movement beyond the prompt
    terminal.onKey(({ domEvent }: { domEvent: KeyboardEvent }) => {
      if (domEvent.key === "ArrowLeft" && response.length === 0) {
        domEvent.preventDefault(); // Stop moving left beyond the question
      }
    });
  });
};

/**
 * Utility function to ask for yes/no confirmation
 */
export const askConfirmation = async (terminal: Terminal, question: string): Promise<boolean> => {
  terminal.writeln("");
  terminal.writeln(terminalLog.prompt(`${question} (Y/N)`));
  terminal.focus();
  return new Promise<boolean>((resolve) => {
    const keyListener = terminal.onKey(({ key }: { key: string }) => {
      keyListener.dispose();
      terminal.writeln("");

      if (key.toLowerCase() === 'y') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

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
