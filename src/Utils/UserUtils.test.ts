import AuthHeadersUtil from "../Platform/Hosted/Authorization";
import * as UserUtils from "./UserUtils";

describe("UserUtils", () => {
  it("getFullName works in regular data explorer (inside portal)", () => {
    const user: AuthenticationContext.UserInfo = {
      userName: "userName",
      profile: {
        name: "name"
      }
    };
    AuthHeadersUtil.getCachedUser = jest.fn().mockReturnValue(user);

    expect(UserUtils.getFullName()).toBe("name");
  });

  it("getFullName works in fullscreen data explorer (outside portal)", () => {
    jest.mock("./AuthorizationUtils", () => {
      (): { name: string } => ({ name: "name" });
    });

    expect(UserUtils.getFullName()).toBe("name");
  });
});
