import { AuthType } from "./AuthType";
import { DatabaseAccount } from "./Contracts/DataModels";
import { SubscriptionType } from "./Contracts/SubscriptionType";
import { DefaultAccountExperienceType } from "./DefaultAccountExperienceType";
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
  readonly defaultExperience?: DefaultAccountExperienceType;
  readonly subscriptionType?: SubscriptionType;
  readonly quotaId?: string;
  // API Type is not yet provided by ARM. You need to manually inspect all the capabilities+kind so we abstract that logic in userContext
  // This is coming in a future Cosmos ARM API version as a prperty on databaseAccount
  readonly apiType?: ApiType;
  readonly isTryCosmosDBSubscription?: boolean;
  readonly portalEnv?: PortalEnv;
  readonly features: Features;
  readonly addCollectionFlight: string;
  readonly hasWriteAccess: boolean;
}

type ApiType = "SQL" | "Mongo" | "Gremlin" | "Tables" | "Cassandra";
export type PortalEnv = "localhost" | "blackforest" | "fairfax" | "mooncake" | "prod" | "dev";

const features = extractFeatures();
const { enableSDKoperations: useSDKOperations } = features;

const userContext: UserContext = {
  hasWriteAccess: true,
  isTryCosmosDBSubscription: false,
  portalEnv: "prod",
  features,
  useSDKOperations,
  addCollectionFlight: CollectionCreation.DefaultAddCollectionDefaultFlight,
};

function updateUserContext(newContext: Partial<UserContext>): void {
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
