import * as DataModels from "../../Contracts/DataModels";
import { CosmosClient } from "../CosmosClient";
import { logConsoleProgress, logConsoleError } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function readCollection(databaseId: string, collectionId: string): Promise<DataModels.Collection> {
    let collection: DataModels.Collection;
    const clearMessage = logConsoleProgress(`Querying container ${collectionId}`);
    try {
        const response = await CosmosClient.client()
            .database(databaseId)
            .container(collectionId)
            .read();
        collection = response.resource as DataModels.Collection;
    } catch (error) {
        logConsoleError(`Error while querying container ${collectionId}:\n ${JSON.stringify(error)}`);
        logError(JSON.stringify(error), "ReadCollection", error.code);
        sendNotificationForError(error);
        throw error;
    }
    clearMessage();
    return collection;
}
