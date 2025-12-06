import { DatabaseAccount } from "Contracts/DataModels";
import * as CopyJobUtils from "./CopyJobUtils";
import { CopyJobContextState, CopyJobErrorType, CopyJobType } from "./Types/CopyJobTypes";

describe("CopyJobUtils", () => {
  describe("buildResourceLink", () => {
    const mockResource: DatabaseAccount = {
      id: "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1",
      name: "account1",
      location: "eastus",
      type: "Microsoft.DocumentDB/databaseAccounts",
      kind: "GlobalDocumentDB",
      properties: {},
    };

    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    it("should build resource link with Azure portal endpoint", () => {
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        origin: "https://portal.azure.com",
        ancestorOrigins: ["https://portal.azure.com"] as any,
      } as Location;

      const link = CopyJobUtils.buildResourceLink(mockResource);
      expect(link).toBe(
        "https://portal.azure.com/#resource/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1",
      );
    });

    it("should replace cosmos.azure with portal.azure", () => {
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        origin: "https://cosmos.azure.com",
        ancestorOrigins: ["https://cosmos.azure.com"] as any,
      } as Location;

      const link = CopyJobUtils.buildResourceLink(mockResource);
      expect(link).toContain("https://portal.azure.com");
    });

    it("should use Azure portal endpoint for localhost", () => {
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        origin: "http://localhost:1234",
        ancestorOrigins: ["http://localhost:1234"] as any,
      } as Location;

      const link = CopyJobUtils.buildResourceLink(mockResource);
      expect(link).toContain("https://ms.portal.azure.com");
    });

    it("should remove trailing slash from origin", () => {
      delete (window as any).location;
      (window as any).location = {
        ...originalLocation,
        origin: "https://portal.azure.com/",
        ancestorOrigins: ["https://portal.azure.com/"] as any,
      } as Location;

      const link = CopyJobUtils.buildResourceLink(mockResource);
      expect(link).toBe(
        "https://portal.azure.com/#resource/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1",
      );
    });
  });

  describe("buildDataTransferJobPath", () => {
    it("should build basic path without jobName or action", () => {
      const path = CopyJobUtils.buildDataTransferJobPath({
        subscriptionId: "sub123",
        resourceGroup: "rg1",
        accountName: "account1",
      });

      expect(path).toBe(
        "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1/dataTransferJobs",
      );
    });

    it("should build path with jobName", () => {
      const path = CopyJobUtils.buildDataTransferJobPath({
        subscriptionId: "sub123",
        resourceGroup: "rg1",
        accountName: "account1",
        jobName: "job1",
      });

      expect(path).toBe(
        "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1/dataTransferJobs/job1",
      );
    });

    it("should build path with jobName and action", () => {
      const path = CopyJobUtils.buildDataTransferJobPath({
        subscriptionId: "sub123",
        resourceGroup: "rg1",
        accountName: "account1",
        jobName: "job1",
        action: "cancel",
      });

      expect(path).toBe(
        "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1/dataTransferJobs/job1/cancel",
      );
    });
  });

  describe("convertTime", () => {
    it("should convert time string with hours, minutes, and seconds", () => {
      const result = CopyJobUtils.convertTime("02:30:45");
      expect(result).toBe("02 hours, 30 minutes, 45 seconds");
    });

    it("should convert time string with only seconds", () => {
      const result = CopyJobUtils.convertTime("00:00:30");
      expect(result).toBe("30 seconds");
    });

    it("should convert time string with only minutes and seconds", () => {
      const result = CopyJobUtils.convertTime("00:05:15");
      expect(result).toBe("05 minutes, 15 seconds");
    });

    it("should round seconds", () => {
      const result = CopyJobUtils.convertTime("00:00:45.678");
      expect(result).toBe("46 seconds");
    });

    it("should return '0 seconds' for zero time", () => {
      const result = CopyJobUtils.convertTime("00:00:00");
      expect(result).toBe("0 seconds");
    });

    it("should return null for invalid time format", () => {
      const result = CopyJobUtils.convertTime("invalid");
      expect(result).toBeNull();
    });

    it("should return null for incomplete time string", () => {
      const result = CopyJobUtils.convertTime("10:30");
      expect(result).toBeNull();
    });

    it("should pad single digit values", () => {
      const result = CopyJobUtils.convertTime("1:5:9");
      expect(result).toBe("01 hours, 05 minutes, 09 seconds");
    });
  });

  describe("formatUTCDateTime", () => {
    it("should format valid UTC date string", () => {
      const result = CopyJobUtils.formatUTCDateTime("2025-11-26T10:30:00Z");
      expect(result).not.toBeNull();
      expect(result?.formattedDateTime).toContain("11/26/25, 10:30:00 AM");
      expect(result?.timestamp).toBeGreaterThan(0);
    });

    it("should return null for invalid date string", () => {
      const result = CopyJobUtils.formatUTCDateTime("invalid-date");
      expect(result).toBeNull();
    });

    it("should return timestamp for valid date", () => {
      const result = CopyJobUtils.formatUTCDateTime("2025-01-01T00:00:00Z");
      expect(result).not.toBeNull();
      expect(typeof result?.timestamp).toBe("number");
      expect(result?.timestamp).toBe(new Date("2025-01-01T00:00:00Z").getTime());
    });
  });

  describe("convertToCamelCase", () => {
    it("should convert string to camel case", () => {
      const result = CopyJobUtils.convertToCamelCase("hello world");
      expect(result).toBe("HelloWorld");
    });

    it("should handle single word", () => {
      const result = CopyJobUtils.convertToCamelCase("hello");
      expect(result).toBe("Hello");
    });

    it("should handle multiple spaces", () => {
      const result = CopyJobUtils.convertToCamelCase("hello   world   test");
      expect(result).toBe("HelloWorldTest");
    });

    it("should handle mixed case input", () => {
      const result = CopyJobUtils.convertToCamelCase("HELLO WORLD");
      expect(result).toBe("HelloWorld");
    });

    it("should handle empty string", () => {
      const result = CopyJobUtils.convertToCamelCase("");
      expect(result).toBe("");
    });
  });

  describe("extractErrorMessage", () => {
    it("should extract first part of error message before line breaks", () => {
      const error: CopyJobErrorType = {
        message: "Error occurred\r\n\r\nAdditional details\r\n\r\nMore info",
        code: "500",
      };

      const result = CopyJobUtils.extractErrorMessage(error);
      expect(result.message).toBe("Error occurred");
      expect(result.code).toBe("500");
    });

    it("should return same message if no line breaks", () => {
      const error: CopyJobErrorType = {
        message: "Simple error message",
        code: "404",
      };

      const result = CopyJobUtils.extractErrorMessage(error);
      expect(result.message).toBe("Simple error message");
      expect(result.code).toBe("404");
    });
  });

  describe("getAccountDetailsFromResourceId", () => {
    it("should extract account details from valid resource ID", () => {
      const resourceId =
        "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1";
      const details = CopyJobUtils.getAccountDetailsFromResourceId(resourceId);

      expect(details).toEqual({
        subscriptionId: "sub123",
        resourceGroup: "rg1",
        accountName: "account1",
      });
    });

    it("should be case insensitive", () => {
      const resourceId =
        "/subscriptions/sub123/resourceGroups/rg1/providers/microsoft.documentdb/databaseAccounts/account1";
      const details = CopyJobUtils.getAccountDetailsFromResourceId(resourceId);

      expect(details).toEqual({
        subscriptionId: "sub123",
        resourceGroup: "rg1",
        accountName: "account1",
      });
    });

    it("should return null for undefined resource ID", () => {
      const details = CopyJobUtils.getAccountDetailsFromResourceId(undefined);
      expect(details).toBeNull();
    });

    it("should return null for invalid resource ID", () => {
      const details = CopyJobUtils.getAccountDetailsFromResourceId("invalid-resource-id");
      expect(details).toEqual({ accountName: undefined, resourceGroup: undefined, subscriptionId: undefined });
    });
  });

  describe("getContainerIdentifiers", () => {
    it("should extract container identifiers", () => {
      const container = {
        account: {
          id: "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1",
          name: "account1",
          location: "eastus",
          type: "Microsoft.DocumentDB/databaseAccounts",
          kind: "GlobalDocumentDB",
          properties: {},
        },
        databaseId: "db1",
        containerId: "container1",
      } as CopyJobContextState["source"];

      const identifiers = CopyJobUtils.getContainerIdentifiers(container);
      expect(identifiers).toEqual({
        accountId: container.account.id,
        databaseId: "db1",
        containerId: "container1",
      });
    });

    it("should return empty strings for undefined values", () => {
      const container = {
        account: undefined,
        databaseId: undefined,
        containerId: undefined,
      } as CopyJobContextState["source"];

      const identifiers = CopyJobUtils.getContainerIdentifiers(container);
      expect(identifiers).toEqual({
        accountId: "",
        databaseId: "",
        containerId: "",
      });
    });
  });

  describe("isIntraAccountCopy", () => {
    const sourceAccountId =
      "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1";
    const targetAccountId =
      "/subscriptions/sub123/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1";
    const differentAccountId =
      "/subscriptions/sub456/resourceGroups/rg2/providers/Microsoft.DocumentDB/databaseAccounts/account2";

    it("should return true for same account", () => {
      const result = CopyJobUtils.isIntraAccountCopy(sourceAccountId, targetAccountId);
      expect(result).toBe(true);
    });

    it("should return false for different accounts", () => {
      const result = CopyJobUtils.isIntraAccountCopy(sourceAccountId, differentAccountId);
      expect(result).toBe(false);
    });

    it("should return false for different subscriptions", () => {
      const differentSubId =
        "/subscriptions/sub999/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/account1";
      const result = CopyJobUtils.isIntraAccountCopy(sourceAccountId, differentSubId);
      expect(result).toBe(false);
    });

    it("should return false for different resource groups", () => {
      const differentRgId =
        "/subscriptions/sub123/resourceGroups/rg999/providers/Microsoft.DocumentDB/databaseAccounts/account1";
      const result = CopyJobUtils.isIntraAccountCopy(sourceAccountId, differentRgId);
      expect(result).toBe(false);
    });

    it("should return false for undefined source", () => {
      const result = CopyJobUtils.isIntraAccountCopy(undefined, targetAccountId);
      expect(result).toBe(false);
    });

    it("should return false for undefined target", () => {
      const result = CopyJobUtils.isIntraAccountCopy(sourceAccountId, undefined);
      expect(result).toBe(false);
    });
  });

  describe("isEqual", () => {
    const createMockJob = (name: string, status: string): CopyJobType => ({
      ID: name,
      Mode: "Online",
      Name: name,
      Status: status as any,
      CompletionPercentage: 50,
      Duration: "00:05:00",
      LastUpdatedTime: "2025-11-26T10:00:00Z",
      timestamp: Date.now(),
      Source: {} as any,
      Destination: {} as any,
    });

    it("should return true for equal job arrays", () => {
      const jobs1 = [createMockJob("job1", "Running"), createMockJob("job2", "Completed")];
      const jobs2 = [createMockJob("job1", "Running"), createMockJob("job2", "Completed")];

      const result = CopyJobUtils.isEqual(jobs1, jobs2);
      expect(result).toBe(true);
    });

    it("should return false for different lengths", () => {
      const jobs1 = [createMockJob("job1", "Running")];
      const jobs2 = [createMockJob("job1", "Running"), createMockJob("job2", "Completed")];

      const result = CopyJobUtils.isEqual(jobs1, jobs2);
      expect(result).toBe(false);
    });

    it("should return false for different status", () => {
      const jobs1 = [createMockJob("job1", "Running")];
      const jobs2 = [createMockJob("job1", "Completed")];

      const result = CopyJobUtils.isEqual(jobs1, jobs2);
      expect(result).toBe(false);
    });

    it("should return false for missing job in second array", () => {
      const jobs1 = [createMockJob("job1", "Running")];
      const jobs2 = [createMockJob("job2", "Running")];

      const result = CopyJobUtils.isEqual(jobs1, jobs2);
      expect(result).toBe(false);
    });

    it("should return true for empty arrays", () => {
      const result = CopyJobUtils.isEqual([], []);
      expect(result).toBe(true);
    });
  });

  describe("getDefaultJobName", () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, "getTime").mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should generate default job name for single container", () => {
      const containers = [
        {
          sourceDatabaseName: "sourceDb",
          sourceContainerName: "sourceCont",
          targetDatabaseName: "targetDb",
          targetContainerName: "targetCont",
        },
      ];

      const jobName = CopyJobUtils.getDefaultJobName(containers);
      expect(jobName).toBe("sourc.sourc_targe.targe_1234567890");
    });

    it("should truncate long names", () => {
      const containers = [
        {
          sourceDatabaseName: "veryLongSourceDatabaseName",
          sourceContainerName: "veryLongSourceContainerName",
          targetDatabaseName: "veryLongTargetDatabaseName",
          targetContainerName: "veryLongTargetContainerName",
        },
      ];

      const jobName = CopyJobUtils.getDefaultJobName(containers);
      expect(jobName).toBe("veryL.veryL_veryL.veryL_1234567890");
    });

    it("should return empty string for multiple containers", () => {
      const containers = [
        {
          sourceDatabaseName: "db1",
          sourceContainerName: "cont1",
          targetDatabaseName: "db2",
          targetContainerName: "cont2",
        },
        {
          sourceDatabaseName: "db3",
          sourceContainerName: "cont3",
          targetDatabaseName: "db4",
          targetContainerName: "cont4",
        },
      ];

      const jobName = CopyJobUtils.getDefaultJobName(containers);
      expect(jobName).toBe("");
    });

    it("should return empty string for empty array", () => {
      const jobName = CopyJobUtils.getDefaultJobName([]);
      expect(jobName).toBe("");
    });

    it("should handle short names without truncation", () => {
      const containers = [
        {
          sourceDatabaseName: "src",
          sourceContainerName: "cont",
          targetDatabaseName: "tgt",
          targetContainerName: "dest",
        },
      ];

      const jobName = CopyJobUtils.getDefaultJobName(containers);
      expect(jobName).toBe("src.cont_tgt.dest_1234567890");
    });
  });

  describe("constants", () => {
    it("should have correct COSMOS_SQL_COMPONENT value", () => {
      expect(CopyJobUtils.COSMOS_SQL_COMPONENT).toBe("CosmosDBSql");
    });

    it("should have correct COPY_JOB_API_VERSION value", () => {
      expect(CopyJobUtils.COPY_JOB_API_VERSION).toBe("2025-05-01-preview");
    });
  });
});
