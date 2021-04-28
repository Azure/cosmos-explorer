jest.mock("../../Utils/arm/request");
jest.mock("../MessageHandler");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { deleteCollection } from "./deleteCollection";

describe("deleteCollection", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: "SQL",
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await deleteCollection("database", "collection");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          container: () => {
            return {
              delete: (): unknown => undefined,
            };
          },
        };
      },
    });
    await deleteCollection("database", "collection");
    expect(client).toHaveBeenCalled();
  });
});
