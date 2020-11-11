import { DatabaseAccount } from "./Contracts/DataModels";
import { SubscriptionType } from "./Contracts/ViewModels";
import { DefaultAccountExperienceType } from "./DefaultAccountExperienceType";

interface UserContext {
  masterKey?: string;
  subscriptionId?: string;
  resourceGroup?: string;
  databaseAccount?: DatabaseAccount;
  endpoint?: string;
  accessToken?: string;
  authorizationToken?: string;
  resourceToken?: string;
  defaultExperience?: DefaultAccountExperienceType;
  useSDKOperations?: boolean;
  subscriptionType?: SubscriptionType;
}

const userContext: Readonly<UserContext> = {} as const;

function updateUserContext(newContext: UserContext): void {
  Object.assign(userContext, newContext);
}

export { userContext, updateUserContext };
