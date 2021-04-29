import { AuthType } from "./AuthType";
import { DatabaseAccount } from "./Contracts/DataModels";
import { SubscriptionType } from "./Contracts/SubscriptionType";
import { extractFeatures, Features } from "./Platform/Hosted/extractFeatures";
import { CollectionCreation } from "./Shared/Constants";

interface UserContext {
  readonly authType?: AuthType;
  readonly masterKey?: string;
  readonly subscriptionId?: string;
  readonly resourceGroup?: string;
  readonly databaseAccount?: DatabaseAccount;
  readonly endpoint?: string;
  readonly accessToken?: string;
  readonly authorizationToken?: string;
  readonly resourceToken?: string;
  readonly useSDKOperations: boolean;
  readonly subscriptionType?: SubscriptionType;
  readonly quotaId?: string;
  // API Type is not yet provided by ARM. You need to manually inspect all the capabilities+kind so we abstract that logic in userContext
  // This is coming in a future Cosmos ARM API version as a prperty on databaseAccount
  apiType?: ApiType;
  readonly isTryCosmosDBSubscription?: boolean;
  readonly portalEnv?: PortalEnv;
  readonly features: Features;
  readonly addCollectionFlight: string;
  readonly hasWriteAccess: boolean;
}

export type ApiType = "SQL" | "Mongo" | "Gremlin" | "Tables" | "Cassandra";
export type PortalEnv = "localhost" | "blackforest" | "fairfax" | "mooncake" | "prod" | "dev";

const features = extractFeatures();
const { enableSDKoperations: useSDKOperations } = features;

const userContext: UserContext = {
  apiType: "SQL",
  hasWriteAccess: true,
  isTryCosmosDBSubscription: false,
  portalEnv: "prod",
  features,
  useSDKOperations,
  addCollectionFlight: CollectionCreation.DefaultAddCollectionDefaultFlight,
  subscriptionType: CollectionCreation.DefaultSubscriptionType,
};

function updateUserContext(newContext: Partial<UserContext>): void {
  if (newContext.databaseAccount) {
    newContext.apiType = apiType(newContext.databaseAccount);
  }
  Object.assign(userContext, newContext);
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
