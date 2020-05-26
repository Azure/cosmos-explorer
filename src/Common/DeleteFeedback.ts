import * as DataModels from "../Contracts/DataModels";

export default class DeleteFeedback {
  subscriptionId: string;
  accountName: string;
  apiType: DataModels.ApiKind;
  feedback: string;

  constructor(subscriptionId: string, accountName: string, apiType: DataModels.ApiKind, feedback: string) {
    this.subscriptionId = subscriptionId;
    this.accountName = accountName;
    this.apiType = apiType;
    this.feedback = feedback;
  }
}
