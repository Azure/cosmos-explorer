import { DatabaseAccount } from "./Contracts/DataModels";
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
}

const userContext: Readonly<UserContext> = {} as const;

function updateUserContext(newContext: UserContext): void {
  Object.assign(userContext, newContext);
}

export { userContext, updateUserContext };
