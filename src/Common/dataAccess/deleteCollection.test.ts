jest.mock("../../Utils/arm/request");
import { deleteCollection } from "./deleteCollection";
import { armRequest } from "../../Utils/arm/request";
import { AuthType } from "../../AuthType";

describe("getCommonQueryOptions", () => {
  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    await deleteCollection("database", "collection");
    expect(armRequest).toHaveBeenCalled();
  });
  // TODO: Test non-AAD case
});
