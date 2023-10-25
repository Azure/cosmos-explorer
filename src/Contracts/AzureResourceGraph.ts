export interface QueryRequestOptions {
  $skipToken?: string;
  $top?: number;
  subscriptions: string[];
}

export interface QueryResponse {
  $skipToken: string;
  count: number;
  data: any;
  resultTruncated: boolean;
  totalRecords: number;
}
