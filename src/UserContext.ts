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
  serverId?: string;
  // API Type is not yet provided by ARM. You need to manually inspect all the capabilities+kind so we abstract that logic in userContext
  // This is coming in a future Cosmos ARM API version as a prperty on databaseAccount
  apiType?: ApiType;
}

type ApiType = "SQL" | "Mongo" | "Gremlin" | "Tables" | "Cassandra";

const userContext: UserContext = {};

function updateUserContext(newContext: UserContext): void {
  Object.assign(userContext, newContext);
  Object.assign(userContext, { apiType: apiType(userContext.databaseAccount) });
}

function apiType(account: DatabaseAccount | undefined): ApiType {
  if (!account) {
    return "SQL";
  }
  const capabilities = account.properties?.capabilities;
  if (capabilities) {
    if (capabilities.find((c) => c.name === "EnableCassandra")) {
      return "Cassandra";
    }
    if (capabilities.find((c) => c.name === "EnableGremlin")) {
      return "Gremlin";
    }
    if (capabilities.find((c) => c.name === "EnableMongo")) {
      return "Mongo";
    }
    if (capabilities.find((c) => c.name === "EnableTable")) {
      return "Tables";
    }
  }
  if (account.kind === "MongoDB" || account.kind === "Parse") {
    return "Mongo";
  }
  return "SQL";
}

export { userContext, updateUserContext };
