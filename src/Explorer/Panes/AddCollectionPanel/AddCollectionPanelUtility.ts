import { userContext } from "UserContext";

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
