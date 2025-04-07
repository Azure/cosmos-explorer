/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Firewall handling functionality for CloudShell
 */

import { Terminal } from "xterm";
import { userContext } from "../../../../UserContext";
import { hasFirewallRestrictions } from "../../Shared/CheckFirewallRules";
import { getAccountDetails, updateDatabaseAccount } from "../Data/CloudShellApiClient";
import { askConfirmation } from "../Utils/CommonUtils";
import { terminalLog } from "../Utils/LogFormatter";

export class FirewallHandler {
  /**
   * Checks if firewall configuration is needed for CloudShell
   */
  public static async checkFirewallConfiguration(terminal: Terminal): Promise<boolean> {
    if (!hasFirewallRestrictions()) {
      return false; // No firewall rules to configure
    }

    terminal.writeln(terminalLog.header("Database Firewall Configuration"));
    terminal.writeln(terminalLog.warning("Your database has firewall restrictions enabled"));
    terminal.writeln(terminalLog.warning("CloudShell might need access through these restrictions"));

    const shouldConfigureFirewall = await askConfirmation(
      terminal, 
      "Would you like to check and configure firewall settings?"
    );

    if (!shouldConfigureFirewall) {
      terminal.writeln(terminalLog.info("Skipping firewall configuration"));
      return false;
    }

    return await this.configureFirewallForCloudShell(terminal);
  }

  /**
   * Configures firewall for CloudShell access
   */
  private static async configureFirewallForCloudShell(terminal: Terminal): Promise<boolean> {
    try {
      // Get current database account details
      terminal.writeln(terminalLog.database("Retrieving current firewall configuration..."));
      const dbAccount = userContext.databaseAccount;
      const currentDbAccount = await getAccountDetails(dbAccount.id);
      
      // Check if "Allow Azure Services" is already enabled
      const ipRules = currentDbAccount.properties.ipRules || [];
      const azureServicesEnabled = currentDbAccount.properties.publicNetworkAccess === "Enabled";
      
      if (azureServicesEnabled) {
        terminal.writeln(terminalLog.success("Azure services access is already enabled"));
        return true;
      }
      
      // Ask user to enable Azure services access
      terminal.writeln(terminalLog.warning("Azure services access is not enabled"));
      terminal.writeln(terminalLog.info("CloudShell requires 'Allow Azure Services' to be enabled"));
      
      const enableAzureServices = await askConfirmation(
        terminal,
        "Enable 'Allow Azure Services' for this database?"
      );
      
      if (!enableAzureServices) {
        terminal.writeln(terminalLog.warning("CloudShell may not be able to connect without enabling Azure services access"));
        return false;
      }
      
      // Update database account to enable Azure services access
      terminal.writeln(terminalLog.info("Updating database firewall configuration..."));
      
      // Create update payload - only modify firewall-related properties
      const updatePayload = {
        ...currentDbAccount,
        properties: {
          ...currentDbAccount.properties,
          publicNetworkAccess: "Enabled"
        }
      };
      
      await updateDatabaseAccount(dbAccount.id, updatePayload);
      terminal.writeln(terminalLog.success("Database firewall updated successfully"));
      terminal.writeln(terminalLog.success("Azure services access is now enabled"));
      
      return true;
    } catch (error) {
      terminal.writeln(terminalLog.error(`Error configuring firewall: ${error.message}`));
      return false;
    }
  }
}
