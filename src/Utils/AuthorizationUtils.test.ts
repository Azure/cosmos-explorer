import { AuthType } from "../AuthType";
import * as Constants from "../Common/Constants";
import { updateUserContext } from "../UserContext";
import * as AuthorizationUtils from "./AuthorizationUtils";
jest.mock("../Explorer/Explorer");

function headersToArray(headers: Headers): [string, string][] {
  const headersArray: [string, string][] = [];
  headers.forEach((key, value) => {
    headersArray.push([key, value]);
  });

  return headersArray;
}

describe("AuthorizationUtils", () => {
  describe("getAuthorizationHeader()", () => {
    it("should return authorization header if authentication type is AAD", () => {
      updateUserContext({
        authType: AuthType.AAD,
        authorizationToken: "some-token",
      });

      const authHeaders: [string, string][] = headersToArray(AuthorizationUtils.getAuthorizationHeaders());
      expect(authHeaders.length).toBe(1);
      expect(authHeaders[0][0]).toBe(Constants.HttpHeaders.authorization);
      expect(authHeaders[0][1]).toBe("some-token");
    });

    it("should return guest access header if authentication type is EncryptedToken (V1)", () => {
      updateUserContext({
        authType: AuthType.EncryptedToken,
        accessToken: { version: 1, primaryToken: "some-token", secondaryToken: "" },
      });

      const authHeaders: [string, string][] = headersToArray(AuthorizationUtils.getAuthorizationHeaders());
      expect(authHeaders.length).toBe(1);
      expect(authHeaders[0][0]).toBe(Constants.HttpHeaders.guestAccessToken);
      expect(authHeaders[0][1]).toBe("some-token");
    });

    it("should return guest access header if authentication type is EncryptedToken (V2)", () => {
      updateUserContext({
        authType: AuthType.EncryptedToken,
        accessToken: { version: 2, primaryToken: "some-token", secondaryToken: "some-other-token" },
      });

      const authHeaders: [string, string][] = headersToArray(AuthorizationUtils.getAuthorizationHeaders());
      expect(authHeaders.length).toBe(2);
      expect(authHeaders[0][0]).toBe(Constants.HttpHeaders.authTokenPrimary);
      expect(authHeaders[0][1]).toBe("some-token");
      expect(authHeaders[1][0]).toBe(Constants.HttpHeaders.authTokenSecondary);
      expect(authHeaders[1][1]).toBe("some-other-token");
    });
  });

  describe("decryptJWTToken()", () => {
    it("should throw an error if token is undefined", () => {
      expect(() => AuthorizationUtils.decryptJWTToken(undefined)).toThrowError();
    });

    it("should throw an error if token is empty", () => {
      expect(() => AuthorizationUtils.decryptJWTToken("")).toThrowError();
    });

    it("should throw an error if token is malformed", () => {
      expect(() =>
        AuthorizationUtils.decryptJWTToken(
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9."
        )
      ).toThrowError();
    });

    it("should return decrypted token payload", () => {
      expect(
        AuthorizationUtils.decryptJWTToken(
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyIsImtpZCI6ImFQY3R3X29kdlJPb0VOZzNWb09sSWgydGlFcyJ9.eyJhdWQiOiJodHRwczovL3dvcmtzcGFjZWFydGlmYWN0cy5wcm9qZWN0YXJjYWRpYS5uZXQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTcxOTUwMjIwLCJuYmYiOjE1NzE5NTAyMjAsImV4cCI6MTU3MTk1NDEyMCwiYWNyIjoiMSIsImFpbyI6IkFWUUFxLzhOQUFBQVJ5c1pWWW1qV3lqeG1zU3VpdUdGbUZLSEwxKytFM2JBK0xhck5mMUVYUnZ1MFB6bDlERWFaMVNMdi8vSXlscG5hanFwZG1aSjFaSXNZUEN0UzJrY1lJbWdTVjFvUitsM2VlNWZlT1JZRjZvPSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiIyMDNmMTE0NS04NTZhLTQyMzItODNkNC1hNDM1NjhmYmEyM2QiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IlJhbmdhaXNoZW52aSIsImdpdmVuX25hbWUiOiJWaWduZXNoIiwiaGFzZ3JvdXBzIjoidHJ1ZSIsImlwYWRkciI6IjEzMS4xMDcuMTQ3LjE0NiIsIm5hbWUiOiJWaWduZXNoIFJhbmdhaXNoZW52aSIsIm9pZCI6ImJiN2Q0YjliLTZlOGYtNDg4NS05OTI4LTBhOWM5OWQwN2Q1NSIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTI3NTIxMTg0LTE2MDQwMTI5MjAtMTg4NzkyNzUyNy0yNzEyNTYzNiIsInB1aWQiOiIxMDAzMDAwMEEyNjJGNDE4Iiwic2NwIjoid29ya3NwYWNlYXJ0aWZhY3RzLm1hbmFnZW1lbnQiLCJzdWIiOiI0X3hzSVdTdWZncHEtN2ZBV1dxaURYT3U5bGtKbDRpWEtBV0JVeUZ0Mm5vIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJ2aXJhbmdhaUBtaWNyb3NvZnQuY29tIiwidXBuIjoidmlyYW5nYWlAbWljcm9zb2Z0LmNvbSIsInV0aSI6InoxRldzZzlWU2tPR1BTcEdremdWQUEiLCJ2ZXIiOiIxLjAifQ.nd-CZ6jpTQ8_2wkxQzuaoJCyEeR_woFK4MGMpHEVttwTd5WBDbVOUgk6gz36Jm2fdFemrQFJ03n1MXtCJYNnMoJX37SrGD3lAzZlXs5aBQig6ZrexWkiUDaaNcbx5qVy8O5JEQPds8OGMArsfUra0DG7iW0v7rgvhInX0umeC8ugnU5C-xEMPSZ9xYj0Q7m62AQrrCIIc94nUicEpxm_cusfsbT-CJHf2yLdmLYQkSx-ewzyBca0jiIl98sm0xA9btXDcwnWcmTY9scyGZ9mlSMtz4zmVY0NUdwssysKm7Js4aWtbA_ON8tsNEElViuwy_w3havM_3RQaNv26J87eQ"
        )
      ).toBeDefined();
    });
  });
});
