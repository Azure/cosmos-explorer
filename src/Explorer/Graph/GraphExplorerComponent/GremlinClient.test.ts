import * as sinon from "sinon";
import * as Logger from "../../../Common/Logger";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import { GremlinClient, GremlinClientParameters } from "./GremlinClient";

describe("Gremlin Client", () => {
  const emptyParams: GremlinClientParameters = {
    endpoint: null,
    collectionId: null,
    databaseId: null,
    masterKey: null,
    maxResultSize: 10000,
  };

  it("should use databaseId, collectionId and masterKey to authenticate", () => {
    const collectionId = "collectionId";
    const databaseId = "databaseId";
    const masterKey = "masterKey";
    const gremlinClient = new GremlinClient();

    gremlinClient.initialize({
      endpoint: null,
      collectionId,
      databaseId,
      masterKey,
      maxResultSize: 0,
    });

    // User must includes these values
    expect(gremlinClient.client.params.user.indexOf(collectionId)).not.toBe(-1);
    expect(gremlinClient.client.params.user.indexOf(databaseId)).not.toBe(-1);
    expect(gremlinClient.client.params.password).toEqual(masterKey);
  });

  it("should aggregate RU charges across multiple responses", (done) => {
    const gremlinClient = new GremlinClient();
    const ru1 = 1;
    const ru2 = 2;
    const ru3 = 3;
    const requestId = "id";
    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => requestId);
    gremlinClient
      .execute("fake query")
      .then((result) => expect(result.totalRequestCharge).toBe(ru1 + ru2 + ru3))
      .finally(done);

    gremlinClient.client.params.progressCallback({
      data: ["data1"],
      requestCharge: ru1,
      requestId: requestId,
    });
    gremlinClient.client.params.progressCallback({
      data: ["data2"],
      requestCharge: ru2,
      requestId: requestId,
    });
    gremlinClient.client.params.successCallback({
      data: ["data3"],
      requestCharge: ru3,
      requestId: requestId,
    });
  });

  it("should keep track of pending requests", () => {
    const gremlinClient = new GremlinClient();
    const fakeRequestIds = ["id1", "id2", "id3"];
    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => fakeRequestIds.pop());
    gremlinClient.execute("fake query");
    gremlinClient.execute("fake query");
    gremlinClient.execute("fake query");
    expect(gremlinClient.pendingResults.size).toBe(3);
  });

  it("should clean up pending request ids after success", async () => {
    const gremlinClient = new GremlinClient();
    const ru1 = 1;
    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => {
      const requestId = "id";
      setTimeout(() => {
        gremlinClient.client.params.successCallback({
          data: ["data1"],
          requestCharge: ru1,
          requestId: requestId,
        });
      }, 0);
      return requestId;
    });
    await gremlinClient.execute("fake query");
    expect(gremlinClient.pendingResults.size).toBe(0);
  });

  it("should log and display error out on unknown requestId", () => {
    const gremlinClient = new GremlinClient();
    const logConsoleSpy = sinon.spy(NotificationConsoleUtils, "logConsoleError");
    const logErrorSpy = sinon.spy(Logger, "logError");

    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => "requestId");
    gremlinClient.execute("fake query");
    gremlinClient.client.params.successCallback({
      data: ["data1"],
      requestCharge: 1,
      requestId: "unknownId",
    });

    expect(logConsoleSpy.called).toBe(true);
    expect(logErrorSpy.called).toBe(true);

    logConsoleSpy.restore();
    logErrorSpy.restore();
  });

  it("should not display RU if null or undefined", () => {
    const emptyResult = "";
    expect(GremlinClient.getRequestChargeString(null)).toEqual(emptyResult);
    expect(GremlinClient.getRequestChargeString(undefined)).toEqual(emptyResult);
    expect(GremlinClient.getRequestChargeString(123)).not.toEqual(emptyResult);
    expect(GremlinClient.getRequestChargeString("123")).not.toEqual(emptyResult);
  });

  it("should not aggregate RU if not a number and reset totalRequestCharge to undefined", (done) => {
    const logConsoleSpy = sinon.spy(NotificationConsoleUtils, "logConsoleError");
    const logErrorSpy = sinon.spy(Logger, "logError");

    const gremlinClient = new GremlinClient();
    const ru1 = 123;
    const ru2 = "should be a number";
    const requestId = "id";

    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => requestId);
    gremlinClient
      .execute("fake query")
      .then(
        (result) => {
          try {
            expect(result.totalRequestCharge).toBe(undefined);
            expect(logConsoleSpy.called).toBe(true);
            expect(logErrorSpy.called).toBe(true);
            done();
          } catch (e) {
            done(e);
          }
        },
        (error) => done.fail(error)
      )
      .finally(() => {
        logConsoleSpy.restore();
        logErrorSpy.restore();
      });

    gremlinClient.client.params.progressCallback({
      data: ["data1"],
      requestCharge: ru1,
      requestId: requestId,
    });
    gremlinClient.client.params.successCallback({
      data: ["data2"],
      requestCharge: ru2 as any,
      requestId: requestId,
    });
  });

  it("should not aggregate RU if undefined and reset totalRequestCharge to undefined", (done) => {
    const logConsoleSpy = sinon.spy(NotificationConsoleUtils, "logConsoleError");
    const logErrorSpy = sinon.spy(Logger, "logError");

    const gremlinClient = new GremlinClient();
    const ru1 = 123;
    const ru2: number = undefined;
    const requestId = "id";

    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => requestId);
    gremlinClient
      .execute("fake query")
      .then(
        (result) => {
          try {
            expect(result.totalRequestCharge).toBe(undefined);
            expect(logConsoleSpy.called).toBe(true);
            expect(logErrorSpy.called).toBe(true);
            done();
          } catch (e) {
            done(e);
          }
        },
        (error) => done.fail(error)
      )
      .finally(() => {
        logConsoleSpy.restore();
        logErrorSpy.restore();
      });

    gremlinClient.client.params.progressCallback({
      data: ["data1"],
      requestCharge: ru1,
      requestId: requestId,
    });
    gremlinClient.client.params.successCallback({
      data: ["data2"],
      requestCharge: ru2,
      requestId: requestId,
    });
  });

  it("should track RUs even on failure", (done) => {
    const gremlinClient = new GremlinClient();
    const requestId = "id";
    const RU = 1234;
    const error = "Some error";

    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => requestId);
    const abortPendingRequestSpy = sinon.spy(gremlinClient, "abortPendingRequest");
    gremlinClient.execute("fake query").then(
      (result) => done.fail(`Unexpectedly succeeded with ${result}`),
      (error) => {
        try {
          expect(abortPendingRequestSpy.calledWith(requestId, error, RU)).toBe(true);
          done();
        } catch (e) {
          done(e);
        }
      }
    );

    gremlinClient.client.params.failureCallback(
      {
        data: null,
        requestCharge: RU,
        requestId: requestId,
      },
      error
    );
  });

  it("should abort all pending requests if requestId from failure response", (done) => {
    const gremlinClient = new GremlinClient();
    const requestId = "id";
    const error = "Some error";

    gremlinClient.initialize(emptyParams);
    sinon.stub(gremlinClient.client, "executeGremlinQuery").callsFake((query: string): string => requestId);
    gremlinClient.execute("fake query").finally(() => {
      try {
        expect(gremlinClient.pendingResults.size).toBe(0);
        done();
      } catch (e) {
        done(e);
      }
    });

    gremlinClient.client.params.failureCallback(
      {
        data: null,
        requestCharge: undefined,
        requestId: undefined,
      },
      error
    );
  });
});
