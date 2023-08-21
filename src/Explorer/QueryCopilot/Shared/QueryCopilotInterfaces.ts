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
}

export interface CopilotMessage {
  source: MessageSource;
  message: string;
  explanation?: string;
}

export interface FeedbackParams {
  likeQuery: boolean;
  generatedQuery: string;
  userPrompt: string;
  description?: string;
  contact?: string;
}
