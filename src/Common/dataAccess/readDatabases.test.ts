jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { readDatabases } from "./readDatabases";

describe("readDatabases", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      defaultExperience: DefaultAccountExperienceType.DocumentDB,
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    updateUserContext({
      authType: AuthType.AAD,
    });
    await readDatabases();
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      databases: {
        readAll: () => {
          return {
            fetchAll: (): unknown => [],
          };
        },
      },
    });
    await readDatabases();
    expect(client).toHaveBeenCalled();
  });
});
