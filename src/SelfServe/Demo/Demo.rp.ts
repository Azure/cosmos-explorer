import { SessionStorageUtility } from "../../Shared/StorageUtility";
import { RefreshResult } from "../SelfServeTypes";
import { Feedback } from "./Demo.types";

export const update = async (feedback: Feedback): Promise<void> => {
  SessionStorageUtility.setEntry("rating", feedback.rating?.toString());
  SessionStorageUtility.setEntry("comments", feedback.comments);
};

export const initialize = async (): Promise<Feedback> => {
  let rating = parseInt(SessionStorageUtility.getEntry("rating"));
  rating = isNaN(rating) ? undefined : rating;
  const comments = SessionStorageUtility.getEntry("comments");
  return {
    rating,
    comments,
  };
};

export const refresh = async (): Promise<RefreshResult> => {
  const refreshCountString = SessionStorageUtility.getEntry("refreshCount");
  const refreshCount = refreshCountString ? parseInt(refreshCountString) : 0;

  const progressToBeSent = refreshCount % 2 === 0 ? false : true;
  SessionStorageUtility.setEntry("refreshCount", (refreshCount + 1).toString());

  return {
    isUpdateInProgress: progressToBeSent,
    updateInProgressMessageTKey: "UpdateInProgressMessage",
  };
};
