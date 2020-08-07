jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { DatabaseAccount } from "../../Contracts/DataModels";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { readCollections } from "./readCollections";
import { updateUserContext } from "../../UserContext";

describe("readCollections", () => {
    beforeAll(() => {
        updateUserContext({
            databaseAccount: {
              name: "test"
            } as DatabaseAccount
        });
    });

  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    await readCollections("database");
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    window.authType = AuthType.MasterKey;
    (client as jest.Mock).mockReturnValue({
        database: () => {
            return {
                containers: {
                    readAll: () => {
                        return {
                            fetchAll: (): unknown => []
                        }
                    }
                }
            };
        }
    });
    await readCollections("database");
    expect(client).toHaveBeenCalled();
  });
});
