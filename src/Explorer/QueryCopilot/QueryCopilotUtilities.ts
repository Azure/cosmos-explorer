import { QueryCopilotSampleContainerSchema } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";

interface FeedbackParams {
  likeQuery: boolean;
  generatedQuery: string;
  userPrompt: string;
  description?: string;
  contact?: string;
}

export const submitFeedback = async (params: FeedbackParams): Promise<void> => {
  try {
    const { likeQuery, generatedQuery, userPrompt, description, contact } = params;
    const payload = {
      containerSchema: QueryCopilotSampleContainerSchema,
      like: likeQuery ? "like" : "dislike",
      generatedSql: generatedQuery,
      userPrompt,
      description: description || "",
      contact: contact || "",
    };

    const response = await fetch("https://copilotorchestrater.azurewebsites.net/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    // eslint-disable-next-line no-console
    console.log(response);
  } catch (error) {
    handleError(error, "copilotSubmitFeedback");
  }
};
