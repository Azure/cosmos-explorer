import { AuthType } from "./AuthType";
import { DatabaseAccount } from "./Contracts/DataModels";
import { SubscriptionType } from "./Contracts/SubscriptionType";
import { DefaultAccountExperienceType } from "./DefaultAccountExperienceType";

interface UserContext {
  authType?: AuthType;
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
  quotaId?: string;
}

const userContext: Readonly<UserContext> = {} as const;

function updateUserContext(newContext: UserContext): void {
  Object.assign(userContext, newContext);
}

export { userContext, updateUserContext };
