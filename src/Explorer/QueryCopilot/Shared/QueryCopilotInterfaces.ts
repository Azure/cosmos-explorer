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
