/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Network access configuration handler for CloudShell
 */

import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { IsPublicAccessAvailable } from "../../Shared/CheckFirewallRules";
import { getUserSettings } from "../Data/CloudShellApiClient";
import { VnetSettings } from "../Models/DataModels";
import { terminalLog } from "../Utils/LogFormatter";
import { VNetHandler } from "./VNetHandler";

export class NetworkAccessHandler {
  /**
   * Configures network access for the CloudShell based on shell type and network restrictions
   */
  public static async configureNetworkAccess(
    terminal: Terminal, 
    region: string, 
    shellType: TerminalKind
  ): Promise<{
    vNetSettings: any;
    isAllPublicAccessEnabled: boolean;
  }> {
    // Check if public access is available for this shell type
    const isAllPublicAccessEnabled = await IsPublicAccessAvailable(shellType);

    // If public access is enabled, no need for VNet configuration
    if (isAllPublicAccessEnabled) {
      terminal.writeln(terminalLog.database("Public access enabled. Skipping VNet configuration."));
      return {
        vNetSettings: {},
        isAllPublicAccessEnabled: true
      };
    }

    // Public access is restricted, we need to configure a VNet or use existing one
    terminal.writeln(terminalLog.database("Network restrictions detected"));
    terminal.writeln(terminalLog.info("Loading CloudShell configuration..."));

    // Get existing settings if available
    const settings = await getUserSettings();
    if (!settings) {
      terminal.writeln(terminalLog.warning("No existing user settings found."));
    }

    // Retrieve CloudShell VNet settings if available
    let cloudShellVnetSettings: VnetSettings | undefined;
    if (settings) {
      cloudShellVnetSettings = await VNetHandler.retrieveCloudShellVnetSettings(settings, terminal);
    }

    // If CloudShell has VNet settings, check with database config
    let finalVNetSettings = {};
    if (cloudShellVnetSettings && cloudShellVnetSettings.networkProfileResourceId) {
      // Check if we should use existing VNet settings
      const isContinueWithSameVnet = await VNetHandler.askForVNetConfigConsent(terminal, shellType);
      
      if (isContinueWithSameVnet) {
        // Check if the VNet is already configured in the database
        const isVNetInDatabaseConfig = await VNetHandler.isCloudShellVNetInDatabaseConfig(cloudShellVnetSettings, terminal);

        if (!isVNetInDatabaseConfig) {
          terminal.writeln(terminalLog.warning("CloudShell VNet is not configured in database access list"));
          const addToDatabase = await VNetHandler.askToAddVNetToDatabase(terminal, cloudShellVnetSettings);

          if (addToDatabase) {
            await VNetHandler.addCloudShellVNetToDatabase(cloudShellVnetSettings, terminal);
            finalVNetSettings = cloudShellVnetSettings;
          } else {
            // User declined to add VNet to database, need to recreate
            terminal.writeln(terminalLog.warning("Will configure new VNet..."));
            cloudShellVnetSettings = undefined;
          }
        } else {
          terminal.writeln(terminalLog.success("CloudShell VNet is already in database configuration"));
          finalVNetSettings = cloudShellVnetSettings;
        }
      } else {
        cloudShellVnetSettings = undefined; // User declined to use existing VNet settings
      }
    }

    // If we don't have valid VNet settings, create new ones
    if (!cloudShellVnetSettings || !cloudShellVnetSettings.networkProfileResourceId) {
      terminal.writeln(terminalLog.subheader("Configuring network infrastructure"));
      finalVNetSettings = await VNetHandler.configureCloudShellVNet(terminal, region);
      
      // Add the new VNet to the database
      await VNetHandler.addCloudShellVNetToDatabase(finalVNetSettings as VnetSettings, terminal);
    }

    return {
      vNetSettings: finalVNetSettings,
      isAllPublicAccessEnabled: false
    };
  }
}
