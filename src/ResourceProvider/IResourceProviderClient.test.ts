import { IResourceProviderClient, IResourceProviderClientFactory } from "./IResourceProviderClient";

describe("IResourceProviderClient", () => {
  interface TestResource {
    id: string;
  }

  const expectedResult: TestResource = { id: "a" };
  const expectedReason: any = "error";

  class SuccessClient implements IResourceProviderClient<TestResource> {
    public deleteAsync(url: string, apiVersion?: string): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        resolve();
      });
    }

    public getAsync(url: string, apiVersion?: string): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        resolve(expectedResult);
      });
    }

    public postAsync(url: string, apiVersion: string, body: TestResource): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        resolve(expectedResult);
      });
    }

    public putAsync(url: string, apiVersion: string, body: TestResource): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        resolve(expectedResult);
      });
    }

    public patchAsync(url: string, apiVersion: string, body: TestResource): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        resolve(expectedResult);
      });
    }
  }

  class ErrorClient implements IResourceProviderClient<TestResource> {
    public patchAsync(url: string, apiVersion: string, body: TestResource): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        reject(expectedReason);
      });
    }

    public putAsync(url: string, apiVersion: string, body: TestResource): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        reject(expectedReason);
      });
    }

    public postAsync(url: string, apiVersion: string, body: TestResource): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        reject(expectedReason);
      });
    }

    public getAsync(url: string, apiVersion?: string): Promise<TestResource> {
      return new Promise<TestResource>((resolve, reject) => {
        reject(expectedReason);
      });
    }

    public deleteAsync(url: string, apiVersion?: string): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        reject(expectedReason);
      });
    }
  }

  class TestResourceProviderClientFactory implements IResourceProviderClientFactory<TestResource> {
    public getOrCreate(url: string): IResourceProviderClient<TestResource> {
      switch (url) {
        case "reject":
          return new ErrorClient();
        case "fulfill":
        default:
          return new SuccessClient();
      }
    }
  }

  const factory = new TestResourceProviderClientFactory();
  const fulfillClient = factory.getOrCreate("fulfill");
  const rejectClient = factory.getOrCreate("reject");
  const testApiVersion = "apiversion";

  describe("deleteAsync", () => {
    it("returns a fulfilled promise on success", async () => {
      const result = await fulfillClient.deleteAsync("/foo", testApiVersion);
      expect(result).toEqual(undefined);
    });

    it("returns a rejected promise with a reason on error", async () => {
      let result: any;
      try {
        result = await rejectClient.deleteAsync("/foo", testApiVersion);
      } catch (reason) {
        result = reason;
      }

      expect(result).toEqual(expectedReason);
    });
  });

  describe("getAsync", () => {
    it("returns a fulfilled promise with a value on success", async () => {
      const result = await fulfillClient.getAsync("/foo", testApiVersion);
      expect(result).toEqual(expectedResult);
    });

    it("returns a rejected promise with a reason on error", async () => {
      let result: any;
      try {
        result = await rejectClient.getAsync("/foo", testApiVersion);
      } catch (reason) {
        result = reason;
      }

      expect(result).toEqual(expectedReason);
    });
  });

  describe("postAsync", () => {
    it("returns a fulfilled promise with a value on success", async () => {
      const result = await fulfillClient.postAsync("/foo", testApiVersion, {});
      expect(result).toEqual(expectedResult);
    });

    it("returns a rejected promise with a reason on error", async () => {
      let result: any;
      try {
        result = await rejectClient.postAsync("/foo", testApiVersion, {});
      } catch (reason) {
        result = reason;
      }

      expect(result).toEqual(expectedReason);
    });
  });

  describe("putAsync", () => {
    it("returns a fulfilled promise with a value on success", async () => {
      const result = await fulfillClient.putAsync("/foo", testApiVersion, {});
      expect(result).toEqual(expectedResult);
    });

    it("returns a rejected promise with a reason on error", async () => {
      let result: any;
      try {
        result = await rejectClient.putAsync("/foo", testApiVersion, {});
      } catch (reason) {
        result = reason;
      }

      expect(result).toEqual(expectedReason);
    });
  });
});
