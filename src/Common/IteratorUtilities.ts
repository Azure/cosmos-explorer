import { QueryResults } from "../Contracts/ViewModels";

interface QueryResponse {
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
  return documentsIterator.fetchNext().then(response => {
    const documents = response.resources;
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
      requestCharge: response.requestCharge
    };
  });
}
