import { QueryOperationOptions } from "@azure/cosmos";
import { QueryResults } from "../Contracts/ViewModels";

interface QueryResponse {
  // [Todo] remove any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources: any[];
  hasMoreResults: boolean;
  activityId: string;
  requestCharge: number;
}

export interface MinimalQueryIterator {
  fetchNext: (queryQueryOperationOptions?: QueryOperationOptions) => Promise<QueryResponse>;
}

// Pick<QueryIterator<any>, "fetchNext">;

export function nextPage(
  documentsIterator: MinimalQueryIterator,
  firstItemIndex: number,
  queryQueryOperationOptions?: QueryOperationOptions,
): Promise<QueryResults> {
  return documentsIterator.fetchNext(queryQueryOperationOptions).then((response) => {
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
