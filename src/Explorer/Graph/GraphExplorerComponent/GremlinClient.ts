/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Wrapper around GremlinSimpleClient using Q promises and tailored to cosmosdb authentication
 */

import * as Q from "q";
import { getErrorMessage, handleError } from "../../../Common/ErrorHandlingUtils";
import { logConsoleInfo } from "../../../Utils/NotificationConsoleUtils";
import { GremlinSimpleClient, Result } from "./GremlinSimpleClient";

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
  public pendingResults: Map<string, PendingResultData>; // public for testing purposes
  private maxResultSize: number;
  private static readonly PENDING_REQUEST_TIMEOUT_MS = 6 /* minutes */ * 60 /* seconds */ * 1000 /* ms */;
  private static readonly TIMEOUT_ERROR_MSG = `Pending request timed out (${GremlinClient.PENDING_REQUEST_TIMEOUT_MS} ms)`;
  private static readonly LOG_AREA = "GremlinClient";

  public initialize(params: GremlinClientParameters) {
    this.destroy();
    this.pendingResults = new Map();
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
        const errorMessage = getErrorMessage(error);
        const requestId = result.requestId;

        if (!requestId || !this.pendingResults.has(requestId)) {
          const errorMsg = `Error: ${errorMessage}, unknown requestId:${requestId} ${GremlinClient.getRequestChargeString(
            result.requestCharge
          )}`;
          handleError(errorMsg, GremlinClient.LOG_AREA);

          // Fail all pending requests if no request id (fatal)
          if (!requestId) {
            for (const reqId of this.pendingResults.keys()) {
              this.abortPendingRequest(reqId, errorMessage, undefined);
            }
          }
        } else {
          this.abortPendingRequest(requestId, errorMessage, result.requestCharge);
        }
      },
      infoCallback: logConsoleInfo,
    });
  }

  public execute(query: string): Q.Promise<GremlinRequestResult> {
    const deferred = Q.defer<GremlinRequestResult>();
    const requestId = this.client.executeGremlinQuery(query);
    this.pendingResults.set(requestId, {
      result: {
        data: [] as any[],
        isIncomplete: false,
      },
      deferred: deferred,
      timeoutId: window.setTimeout(
        () => this.abortPendingRequest(requestId, GremlinClient.TIMEOUT_ERROR_MSG, undefined),
        GremlinClient.PENDING_REQUEST_TIMEOUT_MS
      ),
    });
    return deferred.promise;
  }

  public destroy() {
    if (!this.client) {
      return;
    }
    this.client.close();
    this.client = undefined;
  }

  /**
   * Conditionally display RU if defined
   * @param requestCharge
   * @return request charge or empty string
   */
  public static getRequestChargeString(requestCharge: string | number): string {
    // eslint-disable-next-line no-null/no-null
    return requestCharge === undefined || requestCharge === null ? "" : `(${requestCharge} RUs)`;
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

    const errorMsg = `Aborting pending request ${requestId}. Error:${error} ${GremlinClient.getRequestChargeString(
      requestCharge
    )}`;
    handleError(errorMsg, GremlinClient.LOG_AREA);
  }

  private flushResult(requestId: string) {
    if (!this.pendingResults.has(requestId)) {
      const errorMsg = `Unknown requestId:${requestId}`;
      handleError(errorMsg, GremlinClient.LOG_AREA);
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
      const errorMsg = `Dropping result for unknown requestId:${result.requestId}`;
      handleError(errorMsg, GremlinClient.LOG_AREA);
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
      const errorMsg = `Unable to perform RU aggregation calculation with non numbers. Result request charge: ${result.requestCharge}. RequestId: ${result.requestId}`;
      handleError(errorMsg, GremlinClient.LOG_AREA);
    } else {
      if (pendingResults.totalRequestCharge === undefined) {
        pendingResults.totalRequestCharge = 0;
      }
      pendingResults.totalRequestCharge += result.requestCharge;
    }
    return pendingResults.isIncomplete;
  }
}
