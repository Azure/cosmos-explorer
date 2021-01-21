jest.mock("../../Utils/arm/request");
jest.mock("../CosmosClient");
import { AuthType } from "../../AuthType";
import { CreateCollectionParams, DatabaseAccount } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { armRequest } from "../../Utils/arm/request";
import { client } from "../CosmosClient";
import { createCollection, constructRpOptions } from "./createCollection";
import { updateUserContext } from "../../UserContext";

describe("createCollection", () => {
  const createCollectionParams: CreateCollectionParams = {
    createNewDatabase: false,
    collectionId: "testContainer",
    databaseId: "testDatabase",
    databaseLevelThroughput: true,
    offerThroughput: 400
  };

  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "test"
      } as DatabaseAccount,
      defaultExperience: DefaultAccountExperienceType.DocumentDB
    });
  });

  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    await createCollection(createCollectionParams);
    expect(armRequest).toHaveBeenCalled();
  });

  it("should call SDK if not logged in with non-AAD method", async () => {
    window.authType = AuthType.MasterKey;
    (client as jest.Mock).mockReturnValue({
      databases: {
        createIfNotExists: () => {
          return {
            database: {
              containers: {
                create: () => ({})
              }
            }
          };
        }
      }
    });
    await createCollection(createCollectionParams);
    expect(client).toHaveBeenCalled();
  });

  it("constructRpOptions should return the correct options", () => {
    expect(constructRpOptions(createCollectionParams)).toEqual({});

    const manualThroughputParams: CreateCollectionParams = {
      createNewDatabase: false,
      collectionId: "testContainer",
      databaseId: "testDatabase",
      databaseLevelThroughput: false,
      offerThroughput: 400
    };
    expect(constructRpOptions(manualThroughputParams)).toEqual({ throughput: 400 });

    const autoPilotThroughputParams: CreateCollectionParams = {
      createNewDatabase: false,
      collectionId: "testContainer",
      databaseId: "testDatabase",
      databaseLevelThroughput: false,
      offerThroughput: 400,
      autoPilotMaxThroughput: 4000
    };
    expect(constructRpOptions(autoPilotThroughputParams)).toEqual({
      autoscaleSettings: {
        maxThroughput: 4000
      }
    });
  });
});
