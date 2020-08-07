jest.mock("../../Utils/arm/request");
jest.mock("../MessageHandler");
jest.mock("../CosmosClient");
import { deleteDatabase } from "./deleteDatabase";
import { armRequest } from "../../Utils/arm/request";
import { AuthType } from "../../AuthType";
import { client } from "../CosmosClient";
import { updateUserContext } from "../../UserContext";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { sendCachedDataMessage } from "../MessageHandler";

describe("deleteDatabase", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test"
      } as DatabaseAccount
    });
    (sendCachedDataMessage as jest.Mock).mockResolvedValue(undefined);
  });

  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    await deleteDatabase("database");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    window.authType = AuthType.MasterKey;
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          delete: (): unknown => undefined
        };
      }
    });
    await deleteDatabase("database");
    expect(client).toHaveBeenCalled();
  });
});
