import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as Constants from "../Common/Constants";
import { QueryResults } from "../Contracts/ViewModels";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";

interface QueryResponse {
  // [Todo] remove any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources: any[];
  hasMoreResults: boolean;
  activityId: string;
  requestCharge: number;
}

export interface MinimalQueryIterator {
  fetchNext: () => Promise<QueryResponse>;
}

// Pick<QueryIterator<any>, "fetchNext">;

export function nextPage(documentsIterator: MinimalQueryIterator, firstItemIndex: number): Promise<QueryResults> {
  TelemetryProcessor.traceStart(Action.ExecuteQuery);
  return documentsIterator.fetchNext().then((response) => {
    TelemetryProcessor.traceSuccess(Action.ExecuteQuery, { dataExplorerArea: Constants.Areas.Tab });
    const documents = response.resources;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = (response as any).headers || {}; // TODO this is a private key. Remove any
    const itemCount = (documents && documents.length) || 0;
    return {
      documents,
      hasMoreResults: response.hasMoreResults,
      itemCount,
      firstItemIndex: Number(firstItemIndex) + 1,
      lastItemIndex: Number(firstItemIndex) + Number(itemCount),
      headers,
      activityId: response.activityId,
      requestCharge: response.requestCharge,
    };
  });
}
