jest.mock("../../Utils/arm/request");
jest.mock("../MessageHandler");
import { deleteCollection } from "./deleteCollection";
import { armRequest } from "../../Utils/arm/request";
import { AuthType } from "../../AuthType";
import { updateUserContext } from "../../UserContext";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { sendCachedDataMessage } from "../MessageHandler";

describe("deleteCollection", () => {
  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    updateUserContext({
      databaseAccount: {
        name: "test"
      } as DatabaseAccount
    });
    (sendCachedDataMessage as jest.Mock).mockResolvedValue(undefined);
    await deleteCollection("database", "collection");
    expect(armRequest).toHaveBeenCalled();
  });
  // TODO: Test non-AAD case
});
