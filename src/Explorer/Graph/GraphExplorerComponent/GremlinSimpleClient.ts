/**
 * Lightweight gremlin client javascript library for the browser:
 * - specs: http://tinkerpop.apache.org/docs/3.0.1-incubating/#_developing_a_driver
 * - inspired from gremlin-javascript for nodejs: https://github.com/jbmusso/gremlin-javascript
 * - tested on cosmosdb gremlin server
 * - only supports sessionless gremlin requests
 */

export interface GremlinSimpleClientParameters {
  endpoint: string; // The websocket endpoint
  user: string;
  password: string;
  successCallback: (result: Result) => void;
  progressCallback: (result: Result) => void;
  failureCallback: (result: Result, error: string) => void;
  infoCallback: (msg: string) => void;
}

export interface Result {
  requestId: string; // Can be null
  //eslint-disable-next-line
  data: any;
  requestCharge: number; // RU cost
}

// Args are for Standard OpProcessor: sessionless requests
export interface GremlinRequestMessage {
  requestId: string;
  op: "eval" | "authentication";
  processor: string;
  args:
    | {
        gremlin: string;
        //eslint-disable-next-line
        bindings: {};
        language: string;
      }
    | {
        SASL: string;
      };
}

export interface GremlinResponseMessage {
  requestId: string;
  status: {
    attributes: {
      /* The following fields are DEPRECATED. DO NOT USE.
      StorageRU: string;
      "x-ms-cosmosdb-graph-request-charge": number;
      */

      "x-ms-request-charge": number;
      "x-ms-total-request-charge": number;
    };
    code: number;
    message: string;
  };
  result: {
    //eslint-disable-next-line
    data: any;
  };
}

export class GremlinSimpleClient {
  private static readonly requestChargeHeader = "x-ms-request-charge";

  public params: GremlinSimpleClientParameters;
  private protocols: string | string[];
  private ws: WebSocket;

  public requestsToSend: { [requestId: string]: GremlinRequestMessage };
  public pendingRequests: { [requestId: string]: GremlinRequestMessage };

  constructor(params: GremlinSimpleClientParameters) {
    this.params = params;
    this.pendingRequests = {};
    this.requestsToSend = {};
  }

  public connect(): void {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.CONNECTING) {
        // Wait until it connects to execute all requests
        return;
      }

      if (this.ws.readyState === WebSocket.OPEN) {
        // Connection already open
        this.executeRequestsToSend();
        return;
      }
    }

    this.close();

    const msg = `Connecting to ${this.params.endpoint} as ${this.params.user}`;
    if (this.params.infoCallback) {
      this.params.infoCallback(msg);
    }
    this.ws = GremlinSimpleClient.createWebSocket(this.params.endpoint);
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onerror = this.onError.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.binaryType = "arraybuffer";
  }

  public static createWebSocket(endpoint: string): WebSocket {
    return new WebSocket(endpoint);
  }

  public close(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSING && this.ws.readyState !== WebSocket.CLOSED) {
      const msg = `Disconnecting from ${this.params.endpoint} as ${this.params.user}`;
      //eslint-disable-next-line
      console.log(msg);
      if (this.params.infoCallback) {
        this.params.infoCallback(msg);
      }
      this.ws.close();
    }
  }

  public decodeMessage(msg: MessageEvent): GremlinResponseMessage {
    if (msg.data === null) {
      return null;
    }

    if (msg.data.byteLength === 0) {
      if (this.params.infoCallback) {
        this.params.infoCallback("Received empty response");
      }
      return null;
    }
    try {
      // msg.data is an ArrayBuffer of utf-8 characters, but handle string just in case
      const data = typeof msg.data === "string" ? msg.data : new TextDecoder("utf-8").decode(msg.data);
      return JSON.parse(data);
    } catch (e) {
      if (this.params.failureCallback) {
        this.params.failureCallback(
          null,
          `Unexpected error while decoding backend response: ${e} msg:${JSON.stringify(msg)}`,
        );
      }
      return null;
    }
  }

  public onMessage(msg: MessageEvent): void {
    if (!msg) {
      if (this.params.failureCallback) {
        this.params.failureCallback(null, "onMessage called with no message");
      }
      return;
    }

    const rawMessage = this.decodeMessage(msg);
    if (!rawMessage) {
      return;
    }
    const requestId = rawMessage.requestId;
    const statusCode = rawMessage.status.code;
    const statusMessage = rawMessage.status.message;

    const result: Result = {
      requestId: requestId,
      data: rawMessage.result ? rawMessage.result.data : null,
      requestCharge: rawMessage.status.attributes[GremlinSimpleClient.requestChargeHeader],
    };

    if (!this.pendingRequests[requestId]) {
      if (this.params.failureCallback) {
        this.params.failureCallback(
          result,
          `Received response for missing or closed request: ${requestId} code:${statusCode} message:${statusMessage}`,
        );
      }
      return;
    }
    switch (statusCode) {
      case 200: // Success
        delete this.pendingRequests[requestId];
        if (this.params.successCallback) {
          this.params.successCallback(result);
        }
        break;
      case 204: // No content
        delete this.pendingRequests[requestId];
        if (this.params.successCallback) {
          result.data = null;
          this.params.successCallback(result);
        }
        break;
      case 206: // Partial content
        if (this.params.progressCallback) {
          this.params.progressCallback(result);
        }
        break;
      case 407: // Request authentication
        {
          const challengeResponse = this.buildChallengeResponse(this.pendingRequests[requestId]);
          this.sendGremlinMessage(challengeResponse);
        }
        break;
      case 401: // Unauthorized
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Unauthorized: ${statusMessage}`);
        }
        break;
      case 498: // Malformed request
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Malformed request: ${statusMessage}`);
        }
        break;
      case 500: // Server error
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Server error: ${statusMessage}`);
        }
        break;
      case 597: // Script eval error
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Script eval error: ${statusMessage}`);
        }
        break;
      case 598: // Server timeout
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Server timeout: ${statusMessage}`);
        }
        break;
      case 599: // Server serialization error
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Server serialization error: ${statusMessage}`);
        }
        break;
      default:
        delete this.pendingRequests[requestId];
        if (this.params.failureCallback) {
          this.params.failureCallback(result, `Error with status code: ${statusCode}. Message: ${statusMessage}`);
        }
        break;
    }
  }

  /**
   * This is the main function to use in order to execute a GremlinQuery
   * @param query
   * @param successCallback
   * @param progressCallback
   * @param failureCallback
   * @return requestId
   */
  public executeGremlinQuery(query: string): string {
    const requestId = GremlinSimpleClient.uuidv4();
    this.requestsToSend[requestId] = {
      requestId: requestId,
      op: "eval",
      processor: "",
      args: {
        gremlin: query,
        bindings: {},
        language: "gremlin-groovy",
      },
    };
    this.connect();
    return requestId;
  }

  public buildChallengeResponse(request: GremlinRequestMessage): GremlinRequestMessage {
    const args = {
      SASL: GremlinSimpleClient.utf8ToB64("\0" + this.params.user + "\0" + this.params.password),
    };
    return {
      requestId: request.requestId,
      processor: request.processor,
      op: "authentication",
      args,
    };
  }

  public static utf8ToB64(utf8Str: string): string {
    return btoa(
      encodeURIComponent(utf8Str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }),
    );
  }

  /**
   * Gremlin binary frame is:
   * mimeLength + mimeType + serialized message
   * @param requestMessage
   */
  //eslint-disable-next-line
  public static buildGremlinMessage(requestMessage: {}): Uint8Array {
    const mimeType = "application/json";
    const serializedMessage = mimeType + JSON.stringify(requestMessage);
    const encodedMessage = new TextEncoder().encode(serializedMessage);

    const binaryMessage = new Uint8Array(1 + encodedMessage.length);
    binaryMessage[0] = mimeType.length;

    for (let i = 0; i < encodedMessage.length; i++) {
      binaryMessage[i + 1] = encodedMessage[i];
    }
    return binaryMessage;
  }

  private onOpen() {
    this.executeRequestsToSend();
  }

  private executeRequestsToSend() {
    for (const requestId in this.requestsToSend) {
      const request = this.requestsToSend[requestId];
      this.sendGremlinMessage(request);
      this.pendingRequests[request.requestId] = request;
      delete this.requestsToSend[request.requestId];
    }
  }
  //eslint-disable-next-line
  private onError(err: any) {
    if (this.params.failureCallback) {
      this.params.failureCallback(null, err);
    }
  }

  private onClose(event: CloseEvent) {
    this.requestsToSend = {};
    this.pendingRequests = {};

    if (event.wasClean) {
      this.params.infoCallback(`Closed connection (${event.code} ${event.reason})`);
    } else {
      this.params.failureCallback(null, `Unexpectedly closed connection (${event.code} ${event.reason})`);
    }
  }

  /**
   * RFC4122 version 4 compliant UUID
   */
  private static uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private sendGremlinMessage(gremlinRequestMessage: GremlinRequestMessage) {
    const gremlinFrame = GremlinSimpleClient.buildGremlinMessage(gremlinRequestMessage);
    this.ws.send(gremlinFrame);
  }
}
