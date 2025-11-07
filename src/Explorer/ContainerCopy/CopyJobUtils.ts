import { DatabaseAccount } from "Contracts/DataModels";
import { CopyJobErrorType, CopyJobType } from "./Types/CopyJobTypes";

const azurePortalMpacEndpoint = "https://ms.portal.azure.com/";

export const buildResourceLink = (resource: DatabaseAccount): string => {
  const resourceId = resource.id;
  let parentOrigin = window.location.ancestorOrigins?.[0] ?? window.location.origin;

  if (/\/\/localhost:/.test(parentOrigin)) {
    parentOrigin = azurePortalMpacEndpoint;
  } else if (/\/\/cosmos\.azure/.test(parentOrigin)) {
    parentOrigin = parentOrigin.replace("cosmos.azure", "portal.azure");
  }

  parentOrigin = parentOrigin.replace(/\/$/, "");

  return `${parentOrigin}/#resource${resourceId}`;
};

export const COSMOS_SQL_COMPONENT = "CosmosDBSql";

export const COPY_JOB_API_VERSION = "2025-05-01-preview";

export function buildDataTransferJobPath({
  subscriptionId,
  resourceGroup,
  accountName,
  jobName,
  action,
}: {
  subscriptionId: string;
  resourceGroup: string;
  accountName: string;
  jobName?: string;
  action?: string;
}) {
  let path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/dataTransferJobs`;
  if (jobName) {
    path += `/${jobName}`;
  }
  if (action) {
    path += `/${action}`;
  }
  return path;
}

export function convertTime(timeStr: string): string | null {
  const timeParts = timeStr.split(":").map(Number);

  if (timeParts.length !== 3 || timeParts.some(isNaN)) {
    return null;
  }
  const formatPart = (value: number, unit: string) => {
    if (unit === "seconds") {
      value = Math.round(value);
    }
    return value > 0 ? `${value.toString().padStart(2, "0")} ${unit}` : "";
  };

  const [hours, minutes, seconds] = timeParts;
  const formattedTimeParts = [
    formatPart(hours, "hours"),
    formatPart(minutes, "minutes"),
    formatPart(seconds, "seconds"),
  ]
    .filter(Boolean)
    .join(", ");

  return formattedTimeParts || "0 seconds";
}

export function formatUTCDateTime(utcStr: string): { formattedDateTime: string; timestamp: number } | null {
  const date = new Date(utcStr);
  if (isNaN(date.getTime())) {
    return null;
  }

  return {
    formattedDateTime: new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: "UTC",
    }).format(date),
    timestamp: date.getTime(),
  };
}

export function convertToCamelCase(str: string): string {
  const formattedStr = str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
  return formattedStr;
}

export function extractErrorMessage(error: CopyJobErrorType): CopyJobErrorType {
  return {
    ...error,
    message: error.message.split("\r\n\r\n")[0],
  };
}

export function getAccountDetailsFromResourceId(accountId: string | undefined) {
  if (!accountId) {
    return null;
  }
  const pattern = new RegExp(
    "/subscriptions/([^/]+)/resourceGroups/([^/]+)/providers/Microsoft\\.DocumentDB/databaseAccounts/([^/]+)",
    "i",
  );
  const matches = accountId.match(pattern);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, subscriptionId, resourceGroup, accountName] = matches || [];
  return { subscriptionId, resourceGroup, accountName };
}

export function isEqual(prevJobs: CopyJobType[], newJobs: CopyJobType[]): boolean {
  if (prevJobs.length !== newJobs.length) {
    return false;
  }
  return prevJobs.every((prevJob: CopyJobType) => {
    const newJob = newJobs.find((job) => job.Name === prevJob.Name);
    if (!newJob) {
      return false;
    }
    return prevJob.Status === newJob.Status;
  });
}