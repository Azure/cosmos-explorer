import { configContext } from "ConfigContext";

const getArmBaseUrl = (): string => {
  const base = configContext.ARM_ENDPOINT;
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const buildArmUrl = (path: string, apiVersion: string): string => {
  if (!path || !apiVersion) {
    return "";
  }
  return `${getArmBaseUrl()}${path}?api-version=${apiVersion}`;
};

export { buildArmUrl, getArmBaseUrl };
