import * as DataModels from "../Contracts/DataModels";
import { DatabaseAccountUtils } from "./DatabaseAccountUtils";

describe("DatabaseAccountUtils Tests", () => {
  describe("mergeDatabaseAccountWithGateway", () => {
    const databaseAccountWithProperties: DataModels.DatabaseAccount = {
      id: "test",
      kind: "GlobalDocumentDB",
      name: "test",
      location: "somewhere",
      type: "DocumentDB",
      tags: [],
      properties: {
        documentEndpoint: "",
        cassandraEndpoint: "",
        gremlinEndpoint: "",
        tableEndpoint: ""
      }
    };

    const databaseAccountWithLocations: DataModels.DatabaseAccount = {
      id: "test",
      kind: "GlobalDocumentDB",
      name: "test",
      location: "somewhere",
      type: "DocumentDB",
      tags: [],
      properties: {
        documentEndpoint: "",
        cassandraEndpoint: "",
        gremlinEndpoint: "",
        tableEndpoint: "",
        enableMultipleWriteLocations: false,
        readLocations: [
          {
            documentEndpoint: "https://centralus",
            failoverPriority: 0,
            id: "",
            locationId: "",
            locationName: "Central US",
            provisioningState: "Succeeded"
          }
        ],
        writeLocations: [
          {
            documentEndpoint: "https://centralus",
            failoverPriority: 0,
            id: "",
            locationId: "",
            locationName: "Central US",
            provisioningState: "Succeeded"
          }
        ]
      }
    };

    const databaseAccountWithoutProperties: DataModels.DatabaseAccount = {
      id: "test",
      kind: "GlobalDocumentDB",
      name: "test",
      location: "somewhere",
      type: "DocumentDB",
      tags: [],
      properties: null
    };

    const gatewayDatabaseAccount: DataModels.GatewayDatabaseAccount = {
      EnableMultipleWriteLocations: true,
      CurrentMediaStorageUsageInMB: 0,
      DatabasesLink: "",
      MaxMediaStorageUsageInMB: 0,
      MediaLink: "",
      ReadableLocations: [
        {
          name: "Central US",
          documentAccountEndpoint: "https://centralus"
        },
        {
          name: "North Central US",
          documentAccountEndpoint: "https://northcentralus"
        }
      ],
      WritableLocations: [
        {
          name: "Central US",
          documentAccountEndpoint: "https://centralus"
        }
      ]
    };

    it("should return databaseAccount when gatewayDatabaseAccount is not defined", () => {
      expect(DatabaseAccountUtils.mergeDatabaseAccountWithGateway(databaseAccountWithoutProperties, null)).toBe(
        databaseAccountWithoutProperties
      );
    });

    it("should return null when databaseAccount is not defined", () => {
      expect(DatabaseAccountUtils.mergeDatabaseAccountWithGateway(null, null)).toBeNull();
    });

    it("should return merged with no properties when databaseAccount has no properties", () => {
      const merged = DatabaseAccountUtils.mergeDatabaseAccountWithGateway(
        databaseAccountWithoutProperties,
        gatewayDatabaseAccount
      );
      expect(merged).toBeDefined();
      expect(merged.properties).toBeNull();
    });

    it("should return merged writableLocations", () => {
      const merged = DatabaseAccountUtils.mergeDatabaseAccountWithGateway(
        databaseAccountWithProperties,
        gatewayDatabaseAccount
      );
      expect(merged.properties).toBeDefined();
      expect(merged.properties.writeLocations).toBeDefined();
      expect(merged.properties.writeLocations.length).toBe(gatewayDatabaseAccount.WritableLocations.length);
    });

    it("should return merged readableLocations", () => {
      const merged = DatabaseAccountUtils.mergeDatabaseAccountWithGateway(
        databaseAccountWithProperties,
        gatewayDatabaseAccount
      );
      expect(merged.properties).toBeDefined();
      expect(merged.properties.readLocations).toBeDefined();
      expect(merged.properties.readLocations.length).toBe(gatewayDatabaseAccount.ReadableLocations.length);
    });

    it("should return merged enableMultipleWriteLocations", () => {
      const merged = DatabaseAccountUtils.mergeDatabaseAccountWithGateway(
        databaseAccountWithProperties,
        gatewayDatabaseAccount
      );
      expect(merged.properties).toBeDefined();
      expect(merged.properties.enableMultipleWriteLocations).toBe(gatewayDatabaseAccount.EnableMultipleWriteLocations);
    });

    it("should not overwrite existing values", () => {
      const merged = DatabaseAccountUtils.mergeDatabaseAccountWithGateway(
        databaseAccountWithLocations,
        gatewayDatabaseAccount
      );
      expect(merged.properties.enableMultipleWriteLocations).toBe(
        databaseAccountWithLocations.properties.enableMultipleWriteLocations
      );
      expect(merged.properties.readLocations.length).toBe(databaseAccountWithLocations.properties.readLocations.length);
      expect(merged.properties.writeLocations.length).toBe(
        databaseAccountWithLocations.properties.writeLocations.length
      );
    });
  });
});
