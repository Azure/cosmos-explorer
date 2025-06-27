// TODO Should be able to remove this in next version of nodejs
// https://github.com/nodejs/node/commit/932be0164fb3ed869ae3ddfff391721d2fd8e1af
// (<any>global).TextEncoder = require('util').TextEncoder
// (<any>global).TextDecoder = require('util').TextDecoder

import * as sinon from "sinon";
import {
  GremlinRequestMessage,
  GremlinResponseMessage,
  GremlinSimpleClient,
  GremlinSimpleClientParameters,
  Result,
} from "./GremlinSimpleClient";

describe("Gremlin Simple Client", () => {
  let sandbox: sinon.SinonSandbox;
  let fakeSocket: any;

  const createParams = (): GremlinSimpleClientParameters => {
    return {
      endpoint: "endpoint",
      user: "user",
      password: "password",
      successCallback: (result: Result) => {},
      progressCallback: (result: Result) => {},
      failureCallback: (result: Result, error: string) => {},
      infoCallback: (msg: string) => {},
    };
  };

  const fakeStatus = (
    code: number,
    requestCharge: number,
  ): {
    attributes: {
      "x-ms-request-charge": number;
      "x-ms-total-request-charge": number;
    };
    code: number;
    message: string;
  } => ({
    attributes: {
      "x-ms-request-charge": requestCharge,
      "x-ms-total-request-charge": -123,
    },
    code: code,
    message: null,
  });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    fakeSocket = {
      fakeResponse: null,
      onopen: null,
      onerror: null,
      onmessage: null,
      onclose: null,
      send: (msg: any) => {
        if (fakeSocket.onmessage) {
          fakeSocket.onmessage(fakeSocket.fakeResponse);
        }
      },
      close: () => {},
    };
    sandbox.stub(GremlinSimpleClient, "createWebSocket").returns(fakeSocket);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should encode utf-8 strings when building Gremlin message", () => {
    const msg = "é";
    const expected = [16, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 34, 195, 169, 34];
    const actual = GremlinSimpleClient.buildGremlinMessage(msg);

    // TODO Array.from(actual) isn't supported in phantomJS. Must iterate through for now
    const actualArray = [];
    for (let i = 0; i < actual.length; i++) {
      actualArray.push(actual[i]);
    }

    expect(actualArray).toEqual(expected);
  });

  it("should decode response from Gremlin server", () => {
    const expectedDecodedData = {
      requestId: "d772f897-0d4d-4cd1-b360-ddf6c86b93a3",
      status: {
        code: 200,
        attributes: { graphExecutionStatus: 200, StorageRU: 2.29, ComputeRU: 1.07, PerPartitionComputeCharges: {} },
        message: "",
      },
      result: { data: ["é"], meta: {} },
    };
    const expectedDecodedUint8ArrayValues = [
      123, 34, 114, 101, 113, 117, 101, 115, 116, 73, 100, 34, 58, 34, 100, 55, 55, 50, 102, 56, 57, 55, 45, 48, 100,
      52, 100, 45, 52, 99, 100, 49, 45, 98, 51, 54, 48, 45, 100, 100, 102, 54, 99, 56, 54, 98, 57, 51, 97, 51, 34, 44,
      34, 115, 116, 97, 116, 117, 115, 34, 58, 123, 34, 99, 111, 100, 101, 34, 58, 50, 48, 48, 44, 34, 97, 116, 116,
      114, 105, 98, 117, 116, 101, 115, 34, 58, 123, 34, 103, 114, 97, 112, 104, 69, 120, 101, 99, 117, 116, 105, 111,
      110, 83, 116, 97, 116, 117, 115, 34, 58, 50, 48, 48, 44, 34, 83, 116, 111, 114, 97, 103, 101, 82, 85, 34, 58, 50,
      46, 50, 57, 44, 34, 67, 111, 109, 112, 117, 116, 101, 82, 85, 34, 58, 49, 46, 48, 55, 44, 34, 80, 101, 114, 80,
      97, 114, 116, 105, 116, 105, 111, 110, 67, 111, 109, 112, 117, 116, 101, 67, 104, 97, 114, 103, 101, 115, 34, 58,
      123, 125, 125, 44, 34, 109, 101, 115, 115, 97, 103, 101, 34, 58, 34, 34, 125, 44, 34, 114, 101, 115, 117, 108,
      116, 34, 58, 123, 34, 100, 97, 116, 97, 34, 58, 91, 34, 195, 169, 34, 93, 44, 34, 109, 101, 116, 97, 34, 58, 123,
      125, 125, 125,
    ];
    // We do our best here to emulate what the server should return
    const gremlinResponseData = new Uint8Array(<any>expectedDecodedUint8ArrayValues).buffer;
    const client = new GremlinSimpleClient(createParams());
    const actualDecoded = client.decodeMessage(<any>{ data: gremlinResponseData });
    expect(actualDecoded).toEqual(expectedDecodedData);
  });

  it("should connect before sending", () => {
    const params = createParams();
    params.infoCallback = sandbox.spy();
    const client = new GremlinSimpleClient(params);
    client.executeGremlinQuery("test");
    try {
      fakeSocket.onopen();
    } catch (e) {
      // Eat expected json parse exception and not pollute test output
    }
    expect((<sinon.SinonSpy>params.infoCallback).calledOnce).toBe(true);
  });

  it("should handle incoming message", () => {
    fakeSocket.fakeResponse = "test";
    const params = createParams();
    const client = new GremlinSimpleClient(params);
    const fakeResponse: GremlinResponseMessage = {
      status: fakeStatus(200, null),
      requestId: "id",
      result: { data: "mydata" },
    };
    sandbox.stub(client, "decodeMessage").returns(fakeResponse);
    const onMessageSpy = sandbox.spy(client, "onMessage");
    client.executeGremlinQuery("test");
    fakeSocket.onopen();
    expect(onMessageSpy.calledOnce).toBe(true);
  });

  it("should call fail callback on incoming invalid message", () => {
    const params = createParams();
    const client = new GremlinSimpleClient(params);
    const onFailureSpy = sandbox.spy(client.params, "failureCallback");
    fakeSocket.fakeResponse = {
      status: fakeStatus(200, null),
      requestId: Object.keys(client.pendingRequests)[0],
      data: new Uint8Array([1, 1, 1, 1]).buffer,
    };
    client.executeGremlinQuery("test");
    fakeSocket.onopen();
    expect(onFailureSpy.calledOnce).toBe(true);
  });

  it("should handle 200 status code", () => {
    fakeSocket.send = (msg: any) => {};
    const params = createParams();
    const client = new GremlinSimpleClient(params);
    const onSuccessSpy = sandbox.spy(client.params, "successCallback");
    client.executeGremlinQuery("test");
    fakeSocket.onopen();
    const RU = 99;
    const fakeResponse: GremlinResponseMessage = {
      status: fakeStatus(200, RU),
      requestId: Object.keys(client.pendingRequests)[0],
      result: { data: "mydata" },
    };
    sandbox.stub(client, "decodeMessage").returns(fakeResponse);
    client.onMessage(new MessageEvent("test2"));
    expect(
      onSuccessSpy.calledWith({
        requestId: fakeResponse.requestId,
        data: fakeResponse.result.data,
        requestCharge: RU,
      }),
    ).toBe(true);
  });

  it("should handle 204 status code (no content)", () => {
    fakeSocket.send = (msg: any) => {};
    const params = createParams();
    const client = new GremlinSimpleClient(params);
    const onSuccessSpy = sandbox.spy(client.params, "successCallback");
    client.executeGremlinQuery("test");
    fakeSocket.onopen();
    const RU = 99;
    const fakeResponse: GremlinResponseMessage = {
      status: fakeStatus(204, RU),
      requestId: Object.keys(client.pendingRequests)[0],
      result: { data: "THIS SHOULD BE IGNORED" },
    };
    sandbox.stub(client, "decodeMessage").returns(fakeResponse);
    client.onMessage(new MessageEvent("test2"));
    expect(
      onSuccessSpy.calledWith({
        requestId: fakeResponse.requestId,
        data: null,
        requestCharge: RU,
      }),
    ).toBe(true);
  });

  it("should handle 206 status code (partial)", () => {
    fakeSocket.send = (msg: any) => {};
    const params = createParams();
    const client = new GremlinSimpleClient(params);
    const onSuccessSpy = sandbox.spy(client.params, "successCallback");
    const onProgressSpy = sandbox.spy(client.params, "progressCallback");
    client.executeGremlinQuery("test");
    fakeSocket.onopen();
    const RU = 99;
    const fakeResponse: GremlinResponseMessage = {
      status: fakeStatus(206, RU),
      requestId: Object.keys(client.pendingRequests)[0],
      result: { data: [1, 2, 3] },
    };
    sandbox.stub(client, "decodeMessage").returns(fakeResponse);
    client.onMessage(new MessageEvent("test2"));
    expect(
      onProgressSpy.calledWith({
        requestId: fakeResponse.requestId,
        data: fakeResponse.result.data,
        requestCharge: RU,
      }),
    ).toBe(true);
    expect(onSuccessSpy.notCalled).toBe(true);
  });

  it("should handle 407 status code (auth challenge)", () => {
    const socketSendStub = sandbox.stub(fakeSocket, "send").callsFake(() => {});
    const params = createParams();
    const client = new GremlinSimpleClient(params);
    const onSuccessSpy = sandbox.spy(client.params, "successCallback");
    const buildChallengeSpy = sandbox.spy(client, "buildChallengeResponse");
    client.executeGremlinQuery("test");
    fakeSocket.onopen();
    const fakeResponse: GremlinResponseMessage = {
      status: fakeStatus(407, null),
      requestId: Object.keys(client.pendingRequests)[0],
      result: { data: <any>null },
    };
    sandbox.stub(client, "decodeMessage").returns(fakeResponse);
    client.onMessage(new MessageEvent("test2"));
    expect(onSuccessSpy.notCalled).toBe(true);
    expect(buildChallengeSpy.calledOnce).toBe(true);
    expect(socketSendStub.calledTwice).toBe(true); // Once to send the query, once to send auth response
  });

  describe("error status codes", () => {
    let params: GremlinSimpleClientParameters;
    let client: GremlinSimpleClient;
    let onSuccessSpy: sinon.SinonSpy;
    let onFailureSpy: sinon.SinonSpy;

    beforeEach(() => {
      fakeSocket.send = (msg: any) => {};
      params = createParams();
      client = new GremlinSimpleClient(params);
      onSuccessSpy = sandbox.spy(client.params, "successCallback");
      onFailureSpy = sandbox.spy(client.params, "failureCallback");
      client.executeGremlinQuery("test");
      fakeSocket.onopen();
    });

    it("should handle 401 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(401, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle 401 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(401, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle 498 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(498, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle 500 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(500, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle 597 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(597, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle 598 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(598, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle 599 status code (error)", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(599, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });

    it("should handle unknown status code", () => {
      const fakeResponse: GremlinResponseMessage = {
        status: fakeStatus(123123123, null),
        requestId: "id",
        result: { data: <any>null },
      };
      sandbox.stub(client, "decodeMessage").returns(fakeResponse);
      client.onMessage(null);
      expect(onFailureSpy.calledOnce).toBe(true);
      expect(onSuccessSpy.notCalled).toBe(true);
    });
  });

  it("should build auth message", () => {
    const params = createParams();
    params.user = "éà";
    params.password = "=";
    const client = new GremlinSimpleClient(params);
    const expectedSASLResult = "AMOpw6AAPQ==";
    const request: GremlinRequestMessage = {
      requestId: "id",
      op: "eval",
      processor: "processor",
      args: {
        gremlin: "gremlin",
        bindings: {},
        language: "language",
      },
    };
    const expectedResult: GremlinRequestMessage = {
      requestId: request.requestId,
      processor: request.processor,
      op: "authentication",
      args: {
        SASL: expectedSASLResult,
      },
    };
    const actual = client.buildChallengeResponse(request);
    expect(actual).toEqual(expectedResult);
  });
});
