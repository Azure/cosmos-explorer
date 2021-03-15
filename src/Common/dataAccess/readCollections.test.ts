jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { readCollections } from "./readCollections";

describe("readCollections", () => {
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
    await readCollections("database");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    updateUserContext({
      authType: AuthType.MasterKey,
    });
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          containers: {
            readAll: () => {
              return {
                fetchAll: (): unknown => [],
              };
            },
          },
        };
      },
    });
    await readCollections("database");
    expect(client).toHaveBeenCalled();
  });
});
