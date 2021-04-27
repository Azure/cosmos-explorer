jest.mock("../../Utils/arm/request");
jest.mock("../MessageHandler");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { deleteDatabase } from "./deleteDatabase";

describe("deleteDatabase", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: DefaultAccountExperienceType.DocumentDB,
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await deleteDatabase("database");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          delete: (): unknown => undefined,
        };
      },
    });
    await deleteDatabase("database");
    expect(client).toHaveBeenCalled();
  });
});
