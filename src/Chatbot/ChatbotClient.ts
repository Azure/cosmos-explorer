import { HttpHeaders } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export class ChatbotClient {
  public async getConversationToken(): Promise<{ conversationId: string; token: string; expires_in: number }> {
    if (!userContext.databaseAccount || !userContext.databaseAccount.id) {
      throw new Error("Database account not set");
    }
    const url = `${configContext.JUNO_ENDPOINT}/api/chatbot/bot${userContext.databaseAccount.id}/conversationToken`;
    const authorizationHeader = getAuthorizationHeader();
    const response = await window.fetch(url, {
      method: "GET",
      headers: {
        [HttpHeaders.contentType]: "application/json",
        [authorizationHeader.header]: authorizationHeader.token,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(await response.json());
    }

    const tokenResponse: { conversationId: string; token: string; expires_in: number } = await response.json();
    return tokenResponse;
  }
}
