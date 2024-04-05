import { AzureCliCredentials } from "@azure/ms-rest-nodeauth";
import crypto from "crypto";

/* eslint-disable no-console */

export function generateUniqueName(baseName = "", length = 4): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}

export function generateDatabaseNameWithTimestamp(baseName = "db", length = 1): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}-${Date.now()}`;
}

export async function getAzureCLICredentials(): Promise<AzureCliCredentials> {
  console.log("Shared: getCredentials");
  return await AzureCliCredentials.create();
}

export async function getAzureCLICredentialsToken(): Promise<string> {
  const credentials = await getAzureCLICredentials();
  console.log("Shared: getToken");
  const token = (await credentials.getToken()).accessToken;
  console.log("Shared: token length = " + token?.length ?? "null");
  return token;
}
