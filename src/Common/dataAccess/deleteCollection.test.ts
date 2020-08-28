jest.mock("../../Utils/arm/request");
jest.mock("../MessageHandler");
jest.mock("../CosmosClient");
import { deleteCollection } from "./deleteCollection";
import { armRequest } from "../../Utils/arm/request";
import { AuthType } from "../../AuthType";
import { client } from "../CosmosClient";
import { updateUserContext } from "../../UserContext";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { sendCachedDataMessage } from "../MessageHandler";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";

describe("deleteCollection", () => {
  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test"
      } as DatabaseAccount,
      defaultExperience: DefaultAccountExperienceType.DocumentDB
    });
    (sendCachedDataMessage as jest.Mock).mockResolvedValue(undefined);
  });

  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    await deleteCollection("database", "collection");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    window.authType = AuthType.MasterKey;
    (client as jest.Mock).mockReturnValue({
      database: () => {
        return {
          container: () => {
            return {
              delete: (): unknown => undefined
            };
          }
        };
      }
    });
    await deleteCollection("database", "collection");
    expect(client).toHaveBeenCalled();
  });
});
