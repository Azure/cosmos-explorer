import { ARMError } from "../Utils/arm/request";

/**
 * Expected error codes that should not mark scenarios as unhealthy.
 * These represent expected failures like auth issues, permission errors, and user actions.
 */

// ARM error codes (string)
const EXPECTED_ARM_ERROR_CODES: Set<string> = new Set([
  "AuthorizationFailed",
  "Forbidden",
  "Unauthorized",
  "AuthenticationFailed",
  "InvalidAuthenticationToken",
  "ExpiredAuthenticationToken",
  "AuthorizationPermissionMismatch",
]);

// HTTP status codes that indicate expected failures
const EXPECTED_HTTP_STATUS_CODES: Set<number> = new Set([
  401, // Unauthorized
  403, // Forbidden
]);

// MSAL error codes (string)
const EXPECTED_MSAL_ERROR_CODES: Set<string> = new Set([
  "popup_window_error",
  "interaction_required",
  "user_cancelled",
  "consent_required",
  "login_required",
  "no_account_error",
  "monitor_window_timeout",
  "empty_window_error",
]);

// Firewall error message pattern (only case where we check message content)
const FIREWALL_ERROR_PATTERN = /firewall|ip\s*(address)?\s*(is\s*)?not\s*allowed/i;

/**
 * Interface for MSAL AuthError-like objects
 */
interface MsalAuthError {
  errorCode?: string;
}

/**
 * Interface for errors with HTTP status
 */
interface HttpError {
  status?: number;
}

/**
 * Determines if an error is an expected failure that should not mark the scenario as unhealthy.
 *
 * Expected failures include:
 * - Authentication/authorization errors (user not logged in, permissions)
 * - Firewall blocking errors
 * - User-cancelled operations
 *
 * @param error - The error to classify
 * @returns true if the error is expected and should not affect health metrics
 */
export function isExpectedError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  // Check ARMError code
  if (error instanceof ARMError && error.code !== undefined) {
    if (typeof error.code === "string" && EXPECTED_ARM_ERROR_CODES.has(error.code)) {
      return true;
    }
    if (typeof error.code === "number" && EXPECTED_HTTP_STATUS_CODES.has(error.code)) {
      return true;
    }
  }

  // Check for MSAL AuthError (has errorCode property)
  const msalError = error as MsalAuthError;
  if (msalError.errorCode && typeof msalError.errorCode === "string") {
    if (EXPECTED_MSAL_ERROR_CODES.has(msalError.errorCode)) {
      return true;
    }
  }

  // Check HTTP status on generic errors
  const httpError = error as HttpError;
  if (httpError.status && typeof httpError.status === "number") {
    if (EXPECTED_HTTP_STATUS_CODES.has(httpError.status)) {
      return true;
    }
  }

  // Check for firewall error in message (the only message-based check)
  if (error instanceof Error && error.message) {
    if (FIREWALL_ERROR_PATTERN.test(error.message)) {
      return true;
    }
  }

  // Check for string errors with firewall pattern
  if (typeof error === "string" && FIREWALL_ERROR_PATTERN.test(error)) {
    return true;
  }

  return false;
}
