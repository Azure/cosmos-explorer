import crypto from "crypto";

export function generateUniqueName(baseName = "", length = 4): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}

export function generateDatabaseName(baseName = "db", length = 1): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}-${Date.now()}`;
}
