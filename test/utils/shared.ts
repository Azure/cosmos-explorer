import { AzureCliCredentials } from "@azure/ms-rest-nodeauth";
import crypto from "crypto";

export function generateUniqueName(baseName = "", length = 4): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}

export function generateDatabaseNameWithTimestamp(baseName = "db", length = 1): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}-${Date.now()}`;
}

export async function getAzureCLICredentials(): Promise<AzureCliCredentials> {
  return await AzureCliCredentials.create();
}

export async function getAzureCLICredentialsToken(): Promise<string> {
  const credentials = await getAzureCLICredentials();
  const token = (await credentials.getToken()).accessToken;
  return token;
}
