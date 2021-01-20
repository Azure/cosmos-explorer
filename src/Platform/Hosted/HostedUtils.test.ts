import { AccessInputMetadata } from "../../Contracts/DataModels";
import { getDatabaseAccountPropertiesFromMetadata } from "./HostedUtils";

describe("getDatabaseAccountPropertiesFromMetadata", () => {
  it("should only return an object with the mongoEndpoint key if the apiKind is mongoCompute (5)", () => {
    const mongoComputeAccount: AccessInputMetadata = {
      accountName: "compute-batch2",
      apiEndpoint: "compute-batch2.mongo.cosmos.azure.com:10255",
      apiKind: 5,
      documentEndpoint: "https://compute-batch2.documents.azure.com:443/",
      expiryTimestamp: "1234",
      mongoEndpoint: "https://compute-batch2.mongo.cosmos.azure.com:443/"
    };
    expect(getDatabaseAccountPropertiesFromMetadata(mongoComputeAccount)).toEqual({
      mongoEndpoint: mongoComputeAccount.mongoEndpoint,
      documentEndpoint: mongoComputeAccount.documentEndpoint
    });
  });

  it("should not return an object with the mongoEndpoint key if the apiKind is mongo (1)", () => {
    const mongoAccount: AccessInputMetadata = {
      accountName: "compute-batch2",
      apiEndpoint: "compute-batch2.mongo.cosmos.azure.com:10255",
      apiKind: 1,
      documentEndpoint: "https://compute-batch2.documents.azure.com:443/",
      expiryTimestamp: "1234"
    };
    expect(getDatabaseAccountPropertiesFromMetadata(mongoAccount)).toEqual({
      documentEndpoint: mongoAccount.documentEndpoint
    });
  });
});
