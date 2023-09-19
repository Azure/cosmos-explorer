import Explorer from "Explorer/Explorer";

export interface GenerateSQLQueryResponse {
  apiVersion: string;
  sql: string;
  explanation: string;
  generateStart: string;
  generateEnd: string;
}

enum MessageSource {
  User,
  AI,
  AIExplanation,
}

export interface CopilotMessage {
  source: MessageSource;
  message: string;
  sqlQuery?: string;
  explanation?: string;
}

export interface FeedbackParams {
  likeQuery: boolean;
  generatedQuery: string;
  userPrompt: string;
  description?: string;
  contact?: string;
}

export interface QueryCopilotProps {
  explorer: Explorer;
}
