import { userContext } from "../../../../UserContext";

export const CLOUDSHELL_IP_RECOMMENDATIONS = {
  centralindia: [
    { startIP: "4.247.135.109", endIP: "4.247.135.109" },
    { startIP: "74.225.207.63", endIP: "74.225.207.63" },
  ],
  southeastasia: [{ startIP: "4.194.5.74", endIP: "4.194.213.10" }],
  centraluseuap: [
    { startIP: "52.158.186.182", endIP: "52.158.186.182" },
    { startIP: "172.215.26.246", endIP: "172.215.26.246" },
    { startIP: "134.138.154.177", endIP: "134.138.154.177" },
    { startIP: "134.138.129.52", endIP: "134.138.129.52" },
    { startIP: "172.215.31.177", endIP: "172.215.31.177" },
  ],
  eastus2euap: [
    { startIP: "135.18.43.51", endIP: "135.18.43.51" },
    { startIP: "20.252.175.33", endIP: "20.252.175.33" },
    { startIP: "40.89.88.111", endIP: "40.89.88.111" },
    { startIP: "135.18.17.187", endIP: "135.18.17.187" },
    { startIP: "135.18.67.251", endIP: "135.18.67.251" },
  ],
  eastus: [
    { startIP: "40.71.199.151", endIP: "40.71.199.151" },
    { startIP: "20.42.18.188", endIP: "20.42.18.188" },
    { startIP: "52.190.17.9", endIP: "52.190.17.9" },
    { startIP: "20.120.96.152", endIP: "20.120.96.152" },
  ],
  northeurope: [
    { startIP: "74.234.65.146", endIP: "74.234.65.146" },
    { startIP: "52.169.70.113", endIP: "52.169.70.113" },
  ],
  southcentralus: [
    { startIP: "4.151.247.81", endIP: "4.151.247.81" },
    { startIP: "20.225.211.35", endIP: "20.225.211.35" },
    { startIP: "4.151.48.133", endIP: "4.151.48.133" },
    { startIP: "4.151.247.225", endIP: "4.151.247.225" },
  ],
  westeurope: [
    { startIP: "52.166.126.216", endIP: "52.166.126.216" },
    { startIP: "108.142.162.20", endIP: "108.142.162.20" },
    { startIP: "52.178.13.125", endIP: "52.178.13.125" },
    { startIP: "172.201.33.160", endIP: "172.201.33.160" },
  ],
  westus: [
    { startIP: "20.245.161.131", endIP: "20.245.161.131" },
    { startIP: "57.154.182.51", endIP: "57.154.182.51" },
    { startIP: "40.118.133.244", endIP: "40.118.133.244" },
    { startIP: "20.253.192.12", endIP: "20.253.192.12" },
    { startIP: "20.43.245.209", endIP: "20.43.245.209" },
    { startIP: "20.66.22.66", endIP: "20.66.22.66" },
  ],
} as const;

export interface CloudShellIPRange {
  startIP: string;
  endIP: string;
}

export function getCloudShellIPsForRegion(region: string): readonly CloudShellIPRange[] {
  const normalizedRegion = region.toLowerCase();
  return CLOUDSHELL_IP_RECOMMENDATIONS[normalizedRegion as keyof typeof CLOUDSHELL_IP_RECOMMENDATIONS] || [];
}

export function getClusterRegion(): string {
  const location = userContext?.databaseAccount?.location;
  if (location) {
    return location.toLowerCase();
  }
  return "";
}
