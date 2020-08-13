import * as Constants from "../Constants";
import { sendMessage } from "../MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";

interface CosmosError {
  code: number;
  message?: string;
}

export function sendNotificationForError(error: CosmosError): void {
  if (error && error.code === Constants.HttpStatusCodes.Forbidden) {
    if (error.message && error.message.toLowerCase().indexOf("sharedoffer is disabled for your account") > 0) {
      return;
    }
    sendMessage({
      type: MessageTypes.ForbiddenError,
      reason: error && error.message ? error.message : error
    });
  }
}
