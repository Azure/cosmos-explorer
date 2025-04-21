// This file contains utility functions and constants for formatting terminal messages in a cloud shell environment.
// It includes ANSI escape codes for colors and functions to format messages for different log levels (info, success, warning, error).
export const TERMINAL_COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  DIM: "\x1b[2m",
  BLACK: "\x1b[30m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  WHITE: "\x1b[37m",
  BG_BLACK: "\x1b[40m",
  BG_RED: "\x1b[41m",
  BG_GREEN: "\x1b[42m",
  BG_YELLOW: "\x1b[43m",
  BG_BLUE: "\x1b[44m",
  BG_MAGENTA: "\x1b[45m",
  BG_CYAN: "\x1b[46m",
  BG_WHITE: "\x1b[47m",
};

export const START_MARKER = `echo "START INITIALIZATION" > /dev/null`;
export const END_MARKER = `echo "END INITIALIZATION" > /dev/null`;

// Terminal message formatting functions
export const formatInfoMessage = (message: string): string =>
  `${TERMINAL_COLORS.BRIGHT}${TERMINAL_COLORS.CYAN}${message}${TERMINAL_COLORS.RESET}`;

export const formatSuccessMessage = (message: string): string =>
  `${TERMINAL_COLORS.BRIGHT}${TERMINAL_COLORS.GREEN}${message}${TERMINAL_COLORS.RESET}`;

export const formatWarningMessage = (message: string): string =>
  `${TERMINAL_COLORS.BRIGHT}${TERMINAL_COLORS.YELLOW}${message}${TERMINAL_COLORS.RESET}`;

export const formatErrorMessage = (message: string): string =>
  `${TERMINAL_COLORS.BRIGHT}${TERMINAL_COLORS.RED}${message}${TERMINAL_COLORS.RESET}`;
