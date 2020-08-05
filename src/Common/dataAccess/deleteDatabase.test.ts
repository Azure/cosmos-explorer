jest.mock("../../Utils/arm/request");
import { deleteDatabase } from "./deleteDatabase";
import { armRequest } from "../../Utils/arm/request";
import { AuthType } from "../../AuthType";
import { updateUserContext } from "../../UserContext";
import { DatabaseAccount } from "../../Contracts/DataModels";

describe("deleteDatabase", () => {
  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    updateUserContext({
      databaseAccount: {
        name: "test"
      } as DatabaseAccount
    });
    await deleteDatabase("database");
    expect(armRequest).toHaveBeenCalled();
  });
  // TODO: Test non-AAD case
});
