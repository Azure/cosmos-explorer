import { ARMError } from "../Utils/arm/request";
import { isExpectedError } from "./ErrorClassification";

describe("ErrorClassification", () => {
  describe("isExpectedError", () => {
    describe("ARMError with expected codes", () => {
      it("returns true for AuthorizationFailed code", () => {
        const error = new ARMError("Authorization failed");
        error.code = "AuthorizationFailed";
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for Forbidden code", () => {
        const error = new ARMError("Forbidden");
        error.code = "Forbidden";
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for Unauthorized code", () => {
        const error = new ARMError("Unauthorized");
        error.code = "Unauthorized";
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for InvalidAuthenticationToken code", () => {
        const error = new ARMError("Invalid token");
        error.code = "InvalidAuthenticationToken";
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for ExpiredAuthenticationToken code", () => {
        const error = new ARMError("Token expired");
        error.code = "ExpiredAuthenticationToken";
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for numeric 401 code", () => {
        const error = new ARMError("Unauthorized");
        error.code = 401;
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for numeric 403 code", () => {
        const error = new ARMError("Forbidden");
        error.code = 403;
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns false for unexpected ARM error code", () => {
        const error = new ARMError("Internal error");
        error.code = "InternalServerError";
        expect(isExpectedError(error)).toBe(false);
      });

      it("returns false for numeric 500 code", () => {
        const error = new ARMError("Server error");
        error.code = 500;
        expect(isExpectedError(error)).toBe(false);
      });
    });

    describe("MSAL AuthError with expected errorCodes", () => {
      it("returns true for popup_window_error", () => {
        const error = { errorCode: "popup_window_error", message: "Popup blocked" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for interaction_required", () => {
        const error = { errorCode: "interaction_required", message: "User interaction required" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for user_cancelled", () => {
        const error = { errorCode: "user_cancelled", message: "User cancelled" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for consent_required", () => {
        const error = { errorCode: "consent_required", message: "Consent required" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for login_required", () => {
        const error = { errorCode: "login_required", message: "Login required" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for no_account_error", () => {
        const error = { errorCode: "no_account_error", message: "No account" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns false for unexpected MSAL error code", () => {
        const error = { errorCode: "unknown_error", message: "Unknown" };
        expect(isExpectedError(error)).toBe(false);
      });
    });

    describe("HTTP status codes", () => {
      it("returns true for error with status 401", () => {
        const error = { status: 401, message: "Unauthorized" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for error with status 403", () => {
        const error = { status: 403, message: "Forbidden" };
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns false for error with status 500", () => {
        const error = { status: 500, message: "Internal Server Error" };
        expect(isExpectedError(error)).toBe(false);
      });

      it("returns false for error with status 404", () => {
        const error = { status: 404, message: "Not Found" };
        expect(isExpectedError(error)).toBe(false);
      });
    });

    describe("Firewall error message pattern", () => {
      it("returns true for firewall error in Error message", () => {
        const error = new Error("Request blocked by firewall");
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for IP not allowed error", () => {
        const error = new Error("Client IP address is not allowed");
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for ip not allowed (no 'address')", () => {
        const error = new Error("Your ip not allowed to access this resource");
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns true for string error with firewall", () => {
        expect(isExpectedError("firewall rules prevent access")).toBe(true);
      });

      it("returns true for case-insensitive firewall match", () => {
        const error = new Error("FIREWALL blocked request");
        expect(isExpectedError(error)).toBe(true);
      });

      it("returns false for unrelated error message", () => {
        const error = new Error("Database connection failed");
        expect(isExpectedError(error)).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("returns false for null", () => {
        expect(isExpectedError(null)).toBe(false);
      });

      it("returns false for undefined", () => {
        expect(isExpectedError(undefined)).toBe(false);
      });

      it("returns false for empty object", () => {
        expect(isExpectedError({})).toBe(false);
      });

      it("returns false for plain Error without expected patterns", () => {
        const error = new Error("Something went wrong");
        expect(isExpectedError(error)).toBe(false);
      });

      it("returns false for string without firewall pattern", () => {
        expect(isExpectedError("Generic error occurred")).toBe(false);
      });

      it("handles error with multiple matching criteria", () => {
        // ARMError with both code and firewall message
        const error = new ARMError("Request blocked by firewall");
        error.code = "Forbidden";
        expect(isExpectedError(error)).toBe(true);
      });
    });
  });
});
