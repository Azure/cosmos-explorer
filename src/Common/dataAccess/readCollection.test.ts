jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { updateUserContext } from "../../UserContext";
import { client } from "../CosmosClient";
import { readCollection } from "./readCollection";

describe("readCollection", () => {
  beforeAll(() => {
    updateUserContext({
      authType: AuthType.ResourceToken,
      databaseAccount: {
        name: "test",
      } as DatabaseAccount,
      apiType: DefaultAccountExperienceType.DocumentDB,
    });
  });

  it("should call SDK if logged in with resource token", async () => {
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          container: () => {
            return {
              read: (): unknown => ({}),
            };
          },
        };
      },
    });
    await readCollection("database", "collection");
    expect(client).toHaveBeenCalled();
  });
});
