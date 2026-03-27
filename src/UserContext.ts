import { CosmosDbArtifactType, ResourceTokenInfo } from "Contracts/FabricMessagesContract";
import { ParsedResourceTokenConnectionString } from "Platform/Hosted/Helpers/ResourceTokenUtils";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceOpen } from "Shared/Telemetry/TelemetryProcessor";
import { useCarousel } from "hooks/useCarousel";
import { usePostgres } from "hooks/usePostgres";
import { v4 as uuidv4 } from "uuid";
import { AuthType } from "./AuthType";
import { DatabaseAccount } from "./Contracts/DataModels";
import { SubscriptionType } from "./Contracts/SubscriptionType";
import { Features, extractFeatures } from "./Platform/Hosted/extractFeatures";
import { CollectionCreation, CollectionCreationDefaults } from "./Shared/Constants";

interface ThroughputDefaults {
  fixed: number;
  unlimited:
    | number
    | {
        collectionThreshold: number;
        lessThanOrEqualToThreshold: number;
        greatThanThreshold: number;
      };
  unlimitedmax: number;
  unlimitedmin: number;
  shared: number;
}
export interface CollectionCreationDefaults {
  storage: string;
  throughput: ThroughputDefaults;
}

export interface Node {
  text: string;
  value: string;
  ariaLabel: string;
}

export interface PostgresConnectionStrParams {
  adminLogin: string;
  databaseName: string;
  enablePublicIpAccess: boolean;
  nodes: Node[];
  isMarlinServerGroup: boolean;
  isFreeTier: boolean;
}

export interface VCoreMongoConnectionParams {
  adminLogin: string;
  connectionString: string;
}

export interface FabricArtifactInfo {
  [CosmosDbArtifactType.MIRRORED_KEY]: {
    connectionId: string;
    resourceTokenInfo: ResourceTokenInfo | undefined;
  };
  [CosmosDbArtifactType.MIRRORED_AAD]: undefined;
  [CosmosDbArtifactType.NATIVE]: undefined;
}
export interface FabricContext<T extends CosmosDbArtifactType> {
  fabricClientRpcVersion: string;
  isReadOnly: boolean;
  isVisible: boolean;
  databaseName: string;
  artifactType: CosmosDbArtifactType;
  artifactInfo: FabricArtifactInfo[T];
}

export type AdminFeedbackControlPolicy =
  | "connectedExperiences"
  | "policyAllowFeedback"
  | "policyAllowSurvey"
  | "policyAllowScreenshot"
  | "policyAllowContact"
  | "policyAllowContent"
  | "policyEmailCollectionDefault"
  | "policyScreenshotDefault"
  | "policyContentSamplesDefault";

export type AdminFeedbackPolicySettings = {
  [key in AdminFeedbackControlPolicy]: boolean;
};

export interface UserContext {
  readonly fabricContext?: FabricContext<CosmosDbArtifactType>;
  readonly authType?: AuthType;
  readonly masterKey?: string;
  readonly subscriptionId?: string;
  readonly tenantId?: string;
  readonly userName?: string;
  readonly resourceGroup?: string;
  readonly databaseAccount?: DatabaseAccount;
  readonly endpoint?: string;
  readonly aadToken?: string;
  readonly accessToken?: string;
  readonly authorizationToken?: string;
  readonly resourceToken?: string;
  readonly subscriptionType?: SubscriptionType;
  readonly quotaId?: string;
  // API Type is not yet provided by ARM. You need to manually inspect all the capabilities+kind so we abstract that logic in userContext
  // This is coming in a future Cosmos ARM API version as a prperty on databaseAccount
  apiType: ApiType;
  readonly isTryCosmosDBSubscription?: boolean;
  readonly portalEnv?: PortalEnv;
  readonly features: Features;
  readonly hasWriteAccess: boolean;
  readonly parsedResourceToken?: {
    databaseId: string;
    collectionId: string;
    partitionKey?: string;
  };
  readonly postgresConnectionStrParams?: PostgresConnectionStrParams;
  readonly isReplica?: boolean;
  collectionCreationDefaults: CollectionCreationDefaults;
  sampleDataConnectionInfo?: ParsedResourceTokenConnectionString;
  readonly selectedRegionalEndpoint?: string;
  readonly writeEnabledInSelectedRegion?: boolean;
  readonly vcoreMongoConnectionParams?: VCoreMongoConnectionParams;
  readonly feedbackPolicies?: AdminFeedbackPolicySettings;
  readonly dataPlaneRbacEnabled?: boolean;
  readonly refreshCosmosClient?: boolean;
  throughputBucketsEnabled?: boolean;
  readonly sessionId: string;
}

export type ApiType = "SQL" | "Mongo" | "Gremlin" | "Tables" | "Cassandra" | "Postgres" | "VCoreMongo";
export type PortalEnv = "localhost" | "blackforest" | "fairfax" | "mooncake" | "prod1" | "rx" | "ex" | "prod" | "dev";

const ONE_WEEK_IN_MS = 604800000;

const features = extractFeatures();

const userContext: UserContext = {
  apiType: "SQL",
  hasWriteAccess: true,
  isTryCosmosDBSubscription: false,
  portalEnv: "prod",
  features,
  subscriptionType: CollectionCreation.DefaultSubscriptionType,
  collectionCreationDefaults: CollectionCreationDefaults,
  sessionId: uuidv4(), // Default sessionId - will be overwritten if provided by host
};

export function isAccountNewerThanThresholdInMs(createdAt: string, threshold: number) {
  let createdAtMs: number = Date.parse(createdAt);
  if (isNaN(createdAtMs)) {
    createdAtMs = 0;
  }

  const nowMs: number = Date.now();
  const millisecsSinceAccountCreation = nowMs - createdAtMs;
  return threshold > millisecsSinceAccountCreation;
}

function updateUserContext(newContext: Partial<UserContext>): void {
  if (newContext.databaseAccount) {
    newContext.apiType = apiType(newContext.databaseAccount);

    const isNewAccount = isAccountNewerThanThresholdInMs(
      newContext.databaseAccount?.systemData?.createdAt || "",
      ONE_WEEK_IN_MS,
    );

    if (!localStorage.getItem(newContext.databaseAccount.id)) {
      if (newContext.isTryCosmosDBSubscription || isNewAccount) {
        if (newContext.apiType === "Postgres" && !newContext.isReplica) {
          usePostgres.getState().setShowResetPasswordBubble(true);
          usePostgres.getState().setShowPostgreTeachingBubble(true);
        } else {
          useCarousel.getState().setShouldOpen(true);
          localStorage.setItem(newContext.databaseAccount.id, "true");
          traceOpen(Action.OpenCarousel);
        }
      } else if (newContext.apiType === "Postgres") {
        usePostgres.getState().setShowPostgreTeachingBubble(true);
        localStorage.setItem(newContext.databaseAccount.id, "true");
      }
    }
  }
  Object.assign(userContext, newContext);
}

export function apiType(account: DatabaseAccount | undefined): ApiType {
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
  if (account.kind === "Postgres") {
    return "Postgres";
  }
  if (account.kind === "VCoreMongo") {
    return "VCoreMongo";
  }
  return "SQL";
}

export { updateUserContext, userContext };
