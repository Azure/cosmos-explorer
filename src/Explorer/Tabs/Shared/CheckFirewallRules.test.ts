import { DatabaseAccount, FirewallRule } from "Contracts/DataModels";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { updateUserContext } from "UserContext";
import { mockFunction } from "Utils/JestUtils";
import { armRequest } from "Utils/arm/request";
import React from "react";

jest.mock("Utils/arm/request");
const armRequestMock = mockFunction(armRequest);

describe("CheckFirewallRule tests", () => {
  const apiVersion = "2023-03-15-preview";
  const rulePredicate = (rule: FirewallRule) =>
    rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255";
  let isAllPublicIPAddressEnabled: boolean;
  const setIsAllPublicIPAddressEnabled = jest.fn((value) => (isAllPublicIPAddressEnabled = value));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useStateMock: any = (initState: any) => [initState, setIsAllPublicIPAddressEnabled];
  jest.spyOn(React, "useState").mockImplementation(useStateMock);

  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        id: "testResourceId",
      } as DatabaseAccount,
    });
  });

  it("returns 'all public IP addresses' is enabled for account with the proper firewall rule", async () => {
    armRequestMock.mockResolvedValueOnce({
      value: [
        {
          id: "resourceId",
          name: "AllowAll",
          type: "Microsoft.DocumentDB/mongoClusters/firewallRules",
          properties: {
            provisioningState: "Succeeded",
            startIpAddress: "0.0.0.0",
            endIpAddress: "255.255.255.255",
          },
        },
      ],
    });

    await checkFirewallRules(apiVersion, rulePredicate, setIsAllPublicIPAddressEnabled);

    expect(isAllPublicIPAddressEnabled).toBe(true);
  });

  it("returns 'all public IP addresses' is NOT enabled for account without the proper firewall rule", async () => {
    armRequestMock.mockResolvedValueOnce([
      {
        id: "resourceId",
        name: "AllowAll",
        type: "Microsoft.DocumentDB/mongoClusters/firewallRules",
        properties: {
          provisioningState: "Succeeded",
          startIpAddress: "10.10.10.10",
          endIpAddress: "10.10.10.10",
        },
      },
    ]);

    await checkFirewallRules(apiVersion, rulePredicate, setIsAllPublicIPAddressEnabled);

    expect(isAllPublicIPAddressEnabled).toBe(false);
  });

  it("sets message for account without the proper firewall rule", async () => {
    armRequestMock.mockResolvedValueOnce([
      {
        id: "resourceId",
        name: "AllowAll",
        type: "Microsoft.DocumentDB/mongoClusters/firewallRules",
        properties: {
          provisioningState: "Succeeded",
          startIpAddress: "0.0.0.0",
          endIpAddress: "255.255.255.255",
        },
      },
    ]);

    const warningMessage = "This is a warning message";
    let warningMessageResult: string;
    const warningMessageFunc = (msg: string) => (warningMessageResult = msg);

    await checkFirewallRules(apiVersion, rulePredicate, undefined, warningMessageFunc, warningMessage);

    expect(warningMessageResult).toEqual(warningMessage);
  });
});
