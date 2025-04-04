
/**
 * Standardized terminal logging functions for consistent formatting
 */
export const terminalLog = {
  // Section headers
  header: (message: string) => `\n\x1B[1;34m┌─ ${message} ${"─".repeat(Math.max(45 - message.length, 0))}\x1B[0m`,
  subheader: (message: string) => `\x1B[1;36m├ ${message}\x1B[0m`,
  sectionEnd: () => `\x1B[1;34m└${"─".repeat(50)}\x1B[0m\n`,
  
  // Status messages
  success: (message: string) => `\x1B[32m✓ ${message}\x1B[0m`,
  warning: (message: string) => `\x1B[33m⚠ ${message}\x1B[0m`,
  error: (message: string) => `\x1B[31m✗ ${message}\x1B[0m`,
  info: (message: string) => `\x1B[34m${message}\x1B[0m`,
  
  // Resource information
  database: (message: string) => `\x1B[35m🔶  Database: ${message}\x1B[0m`,
  vnet: (message: string) => `\x1B[36m🔷  Network: ${message}\x1B[0m`,
  cloudshell: (message: string) => `\x1B[32m🔷  CloudShell: ${message}\x1B[0m`,
  
  // Data formatting
  item: (label: string, value: string) => `  • ${label}: \x1B[32m${value}\x1B[0m`,
  progress: (operation: string, status: string) => `\x1B[34m${operation}: \x1B[36m${status}\x1B[0m`,
  
  // User interaction
  prompt: (message: string) => `\x1B[1;37m${message}\x1B[0m`,
  separator: () => `\x1B[30;1m${"─".repeat(50)}\x1B[0m`
};
