jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { client } from "../CosmosClient";
import { readCollection } from "./readCollection";
import { updateUserContext } from "../../UserContext";

describe("readCollection", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test"
      } as DatabaseAccount,
      defaultExperience: DefaultAccountExperienceType.DocumentDB
    });
  });

  it("should call SDK if logged in with resource token", async () => {
    window.authType = AuthType.ResourceToken;
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          container: () => {
            return {
              read: (): unknown => ({})
            };
          }
        };
      }
    });
    await readCollection("database", "collection");
    expect(client).toHaveBeenCalled();
  });
});
