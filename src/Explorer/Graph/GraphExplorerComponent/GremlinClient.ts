/**
 * Wrapper around GremlinSimpleClient using Q promises and tailored to cosmosdb authentication
 */

import * as Q from "q";
import { GremlinSimpleClient, Result } from "./GremlinSimpleClient";
import * as NotificationConsoleUtils from "../../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import { HashMap } from "../../../Common/HashMap";
import * as Logger from "../../../Common/Logger";

export interface GremlinClientParameters {
  endpoint: string;
  databaseId: string;
  collectionId: string;
  masterKey: string;
  maxResultSize: number;
}

export interface GremlinRequestResult {
  data: any[];
  totalRequestCharge?: number;
  isIncomplete: boolean;
}

interface PendingResultData {
  result: GremlinRequestResult;
  deferred: Q.Deferred<GremlinRequestResult>;
  timeoutId: number;
}

export class GremlinClient {
  public client: GremlinSimpleClient;
  public pendingResults: HashMap<PendingResultData>; // public for testing purposes
  private maxResultSize: number;
  private static readonly PENDING_REQUEST_TIMEOUT_MS = 6 /* minutes */ * 60 /* seconds */ * 1000 /* ms */;
  private static readonly TIMEOUT_ERROR_MSG = `Pending request timed out (${GremlinClient.PENDING_REQUEST_TIMEOUT_MS} ms)`;
  private static readonly LOG_AREA = "GremlinClient";

  public initialize(params: GremlinClientParameters) {
    this.destroy();
    this.pendingResults = new HashMap();
    this.maxResultSize = params.maxResultSize;

    this.client = new GremlinSimpleClient({
      endpoint: params.endpoint,
      user: `/dbs/${params.databaseId}/colls/${params.collectionId}`,
      password: params.masterKey,
      successCallback: (result: Result) => {
        this.storePendingResult(result);
        this.flushResult(result.requestId);
      },
      progressCallback: (result: Result) => {
        // Only for informational purposes, since this client accumulates stores all results
        const isIncomplete = this.storePendingResult(result);
        if (isIncomplete) {
          this.flushResult(result.requestId);
        }
      },
      failureCallback: (result: Result, error: string) => {
        if (typeof error !== "string") {
          error = JSON.stringify(error);
        }

        const requestId = result.requestId;

        if (!requestId || !this.pendingResults.has(requestId)) {
          const msg = `Error: ${error}, unknown requestId:${requestId} ${GremlinClient.getRequestChargeString(
            result.requestCharge
          )}`;
          GremlinClient.reportError(msg);

          // Fail all pending requests if no request id (fatal)
          if (!requestId) {
            this.pendingResults.keys().forEach((reqId: string) => {
              this.abortPendingRequest(reqId, error, null);
            });
          }
        } else {
          this.abortPendingRequest(requestId, error, result.requestCharge);
        }
      },
      infoCallback: (msg: string) => {
        NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, msg);
      }
    });
  }

  public execute(query: string): Q.Promise<GremlinRequestResult> {
    const deferred = Q.defer<GremlinRequestResult>();
    const requestId = this.client.executeGremlinQuery(query);
    this.pendingResults.set(requestId, {
      result: {
        data: [] as any[],
        isIncomplete: false
      },
      deferred: deferred,
      timeoutId: window.setTimeout(
        () => this.abortPendingRequest(requestId, GremlinClient.TIMEOUT_ERROR_MSG, null),
        GremlinClient.PENDING_REQUEST_TIMEOUT_MS
      )
    });
    return deferred.promise;
  }

  public destroy() {
    if (!this.client) {
      return;
    }
    this.client.close();
    this.client = null;
  }

  /**
   * Conditionally display RU if defined
   * @param requestCharge
   * @return request charge or empty string
   */
  public static getRequestChargeString(requestCharge: string | number): string {
    return requestCharge == undefined || requestCharge == null ? "" : `(${requestCharge} RUs)`;
  }

  /**
   * Public for testing purposes
   * @param requestId
   * @param error
   * @param requestCharge
   */
  public abortPendingRequest(requestId: string, error: string, requestCharge: number) {
    clearTimeout(this.pendingResults.get(requestId).timeoutId);
    const deferred = this.pendingResults.get(requestId).deferred;
    deferred.reject(error);
    this.pendingResults.delete(requestId);

    GremlinClient.reportError(
      `Aborting pending request ${requestId}. Error:${error} ${GremlinClient.getRequestChargeString(requestCharge)}`
    );
  }

  private flushResult(requestId: string) {
    if (!this.pendingResults.has(requestId)) {
      const msg = `Unknown requestId:${requestId}`;
      GremlinClient.reportError(msg);
      return;
    }

    const pendingResult = this.pendingResults.get(requestId);
    clearTimeout(pendingResult.timeoutId);
    pendingResult.deferred.resolve(pendingResult.result);
    this.pendingResults.delete(requestId);
  }

  /**
   * Merge with existing results.
   * Clip results if necessary to keep results size under max
   * @param result
   * @return true if pending results reached max
   */
  private storePendingResult(result: Result): boolean {
    if (!this.pendingResults.has(result.requestId)) {
      const msg = `Dropping result for unknown requestId:${result.requestId}`;
      GremlinClient.reportError(msg);
      return false;
    }
    const pendingResults = this.pendingResults.get(result.requestId).result;
    const currentSize = pendingResults.data.length;
    let resultsToAdd = Array.isArray(result.data) ? result.data : [result.data];

    if (currentSize + result.data.length > this.maxResultSize) {
      const sliceSize = currentSize > this.maxResultSize ? 0 : this.maxResultSize - currentSize;
      // Clip results to fit under max
      pendingResults.isIncomplete = true;
      resultsToAdd = result.data.slice(0, sliceSize);
    }

    pendingResults.data = <[any]>pendingResults.data.concat(resultsToAdd);

    // Make sure we aggregate two numbers, but continue without it if not.
    if (result.requestCharge === undefined || typeof result.requestCharge !== "number") {
      // Clear totalRequestCharge, even if it was a valid number as the total might be incomplete therefore incorrect
      pendingResults.totalRequestCharge = undefined;
      GremlinClient.reportError(
        `Unable to perform RU aggregation calculation with non numbers. Result request charge: ${result.requestCharge}. RequestId: ${result.requestId}`
      );
    } else {
      if (pendingResults.totalRequestCharge === undefined) {
        pendingResults.totalRequestCharge = 0;
      }
      pendingResults.totalRequestCharge += result.requestCharge;
    }
    return pendingResults.isIncomplete;
  }

  private static reportError(msg: string): void {
    NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, msg);
    Logger.logError(msg, GremlinClient.LOG_AREA);
  }
}
