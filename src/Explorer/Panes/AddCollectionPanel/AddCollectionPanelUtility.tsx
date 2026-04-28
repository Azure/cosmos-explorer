import { DirectionalHint, Icon, Link, Stack, Text, TooltipHost } from "@fluentui/react";
import * as Constants from "Common/Constants";
import { configContext, Platform } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { AccountOverride } from "Contracts/DataModels";
import { getFullTextLanguageOptions } from "Explorer/Controls/FullTextSeach/FullTextPoliciesComponent";
import { Keys, t } from "Localization";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import React from "react";
import { userContext } from "UserContext";

export function getPartitionKeyTooltipText(): string {
  if (userContext.apiType === "Mongo") {
    return t(Keys.panes.addCollectionUtility.shardKeyTooltip);
  }

  let tooltipText = t(Keys.panes.addCollectionUtility.partitionKeyTooltip, {
    partitionKeyName: getPartitionKeyName(true),
  });

  if (userContext.apiType === "SQL") {
    tooltipText += t(Keys.panes.addCollectionUtility.partitionKeyTooltipSqlSuffix);
  }

  return tooltipText;
}

export function getPartitionKeyName(isLowerCase?: boolean): string {
  const partitionKeyName =
    userContext.apiType === "Mongo"
      ? t(Keys.panes.addCollectionUtility.shardKeyLabel)
      : t(Keys.panes.addCollectionUtility.partitionKeyLabel);

  return isLowerCase ? partitionKeyName.toLocaleLowerCase() : partitionKeyName;
}

export function getPartitionKeyPlaceHolder(index?: number): string {
  switch (userContext.apiType) {
    case "Mongo":
      return t(Keys.panes.addCollectionUtility.shardKeyPlaceholder);
    case "Gremlin":
      return t(Keys.panes.addCollectionUtility.partitionKeyPlaceholderDefault);
    case "SQL":
      return `${
        index === undefined
          ? t(Keys.panes.addCollectionUtility.partitionKeyPlaceholderFirst)
          : index === 0
          ? t(Keys.panes.addCollectionUtility.partitionKeyPlaceholderSecond)
          : t(Keys.panes.addCollectionUtility.partitionKeyPlaceholderThird)
      }`;
    default:
      return t(Keys.panes.addCollectionUtility.partitionKeyPlaceholderGraph);
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

export function isFreeTierAccount(targetAccountOverride?: AccountOverride): boolean {
  if (targetAccountOverride) {
    return targetAccountOverride.enableFreeTier ?? false;
  }
  return userContext.databaseAccount?.properties?.enableFreeTier;
}

export function UniqueKeysHeader(): JSX.Element {
  const tooltipContent = t(Keys.panes.addCollectionUtility.uniqueKeysTooltip);

  return (
    <Stack horizontal style={{ marginBottom: -2 }}>
      <Text className="panelTextBold" variant="small">
        {t(Keys.panes.addCollectionUtility.uniqueKeysLabel)}
      </Text>
      <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={tooltipContent}>
        <Icon iconName="Info" className="panelInfoIcon" tabIndex={0} ariaLabel={tooltipContent} />
      </TooltipHost>
    </Stack>
  );
}

export function shouldShowAnalyticalStoreOptions(): boolean {
  if (isFabricNative() || configContext.platform === Platform.Emulator) {
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
  const tooltipContent = t(Keys.panes.addCollectionUtility.analyticalStoreTooltip);
  return (
    <Stack horizontal style={{ marginBottom: -2 }}>
      <Text className="panelTextBold" variant="small">
        {t(Keys.panes.addCollectionUtility.analyticalStoreLabel)}
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
      {t(Keys.panes.addCollectionUtility.analyticalStoreDescription)}{" "}
      <Link
        aria-label={Constants.ariaLabelForLearnMoreLink.AnalyticalStore}
        target="_blank"
        href="https://aka.ms/analytical-store-overview"
      >
        {t(Keys.common.learnMore)}
      </Link>
    </Text>
  );
}

export function isSynapseLinkEnabled(targetAccountOverride?: AccountOverride): boolean {
  if (targetAccountOverride) {
    if (targetAccountOverride.enableAnalyticalStorage) {
      return true;
    }
    return targetAccountOverride.capabilities?.some(
      (capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics,
    );
  }

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
      {t(Keys.panes.addCollectionUtility.vectorPolicyTooltip)}{" "}
      <Link target="_blank" href="https://aka.ms/CosmosDBVectorSetup">
        {t(Keys.common.learnMore)}
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
