import { DirectionalHint, Icon, Link, Stack, Text, TooltipHost } from "@fluentui/react";
import * as Constants from "Common/Constants";
import { configContext, Platform } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { getFullTextLanguageOptions } from "Explorer/Controls/FullTextSeach/FullTextPoliciesComponent";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import React from "react";
import { userContext } from "UserContext";
import { isFeatureSupported, PlatformFeature } from "Utils/PlatformFeatureUtils";

export function getPartitionKeyTooltipText(): string {
  if (userContext.apiType === "Mongo") {
    return "The shard key (field) is used to split your data across many replica sets (shards) to achieve unlimited scalability. It’s critical to choose a field that will evenly distribute your data.";
  }

  let tooltipText = `The ${getPartitionKeyName(
    true,
  )} is used to automatically distribute data across partitions for scalability. Choose a property in your JSON document that has a wide range of values and evenly distributes request volume.`;

  if (userContext.apiType === "SQL") {
    tooltipText += " For small read-heavy workloads or write-heavy workloads of any size, id is often a good choice.";
  }

  return tooltipText;
}

export function getPartitionKeyName(isLowerCase?: boolean): string {
  const partitionKeyName = userContext.apiType === "Mongo" ? "Shard key" : "Partition key";

  return isLowerCase ? partitionKeyName.toLocaleLowerCase() : partitionKeyName;
}

export function getPartitionKeyPlaceHolder(index?: number): string {
  switch (userContext.apiType) {
    case "Mongo":
      return "e.g., categoryId";
    case "Gremlin":
      return "e.g., /address";
    case "SQL":
      return `${
        index === undefined
          ? "Required - first partition key e.g., /TenantId"
          : index === 0
          ? "second partition key e.g., /UserId"
          : "third partition key e.g., /SessionId"
      }`;
    default:
      return "e.g., /address/zipCode";
  }
}

export function getPartitionKey(isQuickstart?: boolean): string {
  if (userContext.apiType !== "SQL" && userContext.apiType !== "Mongo") {
    return "";
  }
  if (userContext.features.partitionKeyDefault) {
    return userContext.apiType === "SQL" ? "/id" : "_id";
  }
  if (userContext.features.partitionKeyDefault2) {
    return userContext.apiType === "SQL" ? "/pk" : "pk";
  }
  if (isQuickstart) {
    return userContext.apiType === "SQL" ? "/categoryId" : "categoryId";
  }
  return "";
}

export function isFreeTierAccount(): boolean {
  return userContext.databaseAccount?.properties?.enableFreeTier;
}

export function UniqueKeysHeader(): JSX.Element {
  const tooltipContent =
    "Unique keys provide developers with the ability to add a layer of data integrity to their database. By creating a unique key policy when a container is created, you ensure the uniqueness of one or more values per partition key.";

  return (
    <Stack horizontal style={{ marginBottom: -2 }}>
      <Text className="panelTextBold" variant="small">
        Unique keys
      </Text>
      <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={tooltipContent}>
        <Icon iconName="Info" className="panelInfoIcon" tabIndex={0} ariaLabel={tooltipContent} />
      </TooltipHost>
    </Stack>
  );
}

export function shouldShowAnalyticalStoreOptions(): boolean {
  if (
    !isFeatureSupported(PlatformFeature.AnalyticalStore) ||
    isFabricNative() ||
    configContext.platform === Platform.Emulator
  ) {
    return false;
  }

  switch (userContext.apiType) {
    case "SQL":
    case "Mongo":
      return true;
    default:
      return false;
  }
}

export function AnalyticalStoreHeader(): JSX.Element {
  const tooltipContent =
    "Enable analytical store capability to perform near real-time analytics on your operational data, without impacting the performance of transactional workloads.";
  return (
    <Stack horizontal style={{ marginBottom: -2 }}>
      <Text className="panelTextBold" variant="small">
        Analytical Store
      </Text>
      <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={tooltipContent}>
        <Icon iconName="Info" className="panelInfoIcon" tabIndex={0} ariaLabel={tooltipContent} />
      </TooltipHost>
    </Stack>
  );
}

export function AnalyticalStorageContent(): JSX.Element {
  return (
    <Text variant="small">
      Enable analytical store capability to perform near real-time analytics on your operational data, without impacting
      the performance of transactional workloads.{" "}
      <Link
        aria-label={Constants.ariaLabelForLearnMoreLink.AnalyticalStore}
        target="_blank"
        href="https://aka.ms/analytical-store-overview"
      >
        Learn more
      </Link>
    </Text>
  );
}

export function isSynapseLinkEnabled(): boolean {
  if (!userContext.databaseAccount) {
    return false;
  }

  const { properties } = userContext.databaseAccount;
  if (!properties) {
    return false;
  }

  if (properties.enableAnalyticalStorage) {
    return true;
  }

  return properties.capabilities?.some(
    (capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics,
  );
}

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView();
}

export function ContainerVectorPolicyTooltipContent(): JSX.Element {
  return (
    <Text variant="small">
      Describe any properties in your data that contain vectors, so that they can be made available for similarity
      queries.{" "}
      <Link target="_blank" href="https://aka.ms/CosmosDBVectorSetup">
        Learn more
      </Link>
    </Text>
  );
}

export function parseUniqueKeys(uniqueKeys: string[]): DataModels.UniqueKeyPolicy {
  if (uniqueKeys?.length === 0) {
    return undefined;
  }

  const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = { uniqueKeys: [] };
  uniqueKeys.forEach((uniqueKey: string) => {
    if (uniqueKey) {
      const validPaths: string[] = uniqueKey.split(",")?.filter((path) => path?.length > 0);
      const trimmedPaths: string[] = validPaths?.map((path) => path.trim());
      if (trimmedPaths?.length > 0) {
        if (userContext.apiType === "Mongo") {
          trimmedPaths.map((path) => {
            const transformedPath = path.split(".").join("/");
            if (transformedPath[0] !== "/") {
              return "/" + transformedPath;
            }
            return transformedPath;
          });
        }
        uniqueKeyPolicy.uniqueKeys.push({ paths: trimmedPaths });
      }
    }
  });

  return uniqueKeyPolicy;
}

export const SharedDatabaseDefault: DataModels.IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [],
  excludedPaths: [
    {
      path: "/*",
    },
  ],
};

export const FullTextPolicyDefault: DataModels.FullTextPolicy = {
  defaultLanguage: getFullTextLanguageOptions()[0].key as never,
  fullTextPaths: [],
};

export const AllPropertiesIndexed: DataModels.IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [
    {
      path: "/*",
      indexes: [
        {
          kind: "Range",
          dataType: "Number",
          precision: -1,
        },
        {
          kind: "Range",
          dataType: "String",
          precision: -1,
        },
      ],
    },
  ],
  excludedPaths: [],
};
