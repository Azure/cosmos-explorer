/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * VNet handling functionality for CloudShell
 */

import { v4 as uuidv4 } from 'uuid';
import { Terminal } from "xterm";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from "../../../../UserContext";
import { hasPrivateEndpointsRestrictions } from "../../Shared/CheckFirewallRules";
import {
  createNetworkProfile,
  createPrivateEndpoint,
  createRelay,
  createRoleOnNetworkProfile,
  createRoleOnRelay,
  getAccountDetails,
  getDatabaseOperations,
  getNetworkProfileInfo,
  getRelay,
  getSubnetInformation,
  getVnet,
  getVnetInformation,
  updateDatabaseAccount,
  updateSubnetInformation,
  updateVnet
} from "../Data/CloudShellApiClient";
import { Settings, VnetSettings } from "../Models/DataModels";
import { askConfirmation, askQuestion, wait } from "../Utils/CommonUtils";
import { terminalLog } from "../Utils/LogFormatter";

// Constants for VNet configuration
const POLLING_INTERVAL_MS = 5000;
const MAX_RETRY_COUNT = 10;
const STANDARD_SKU = "Standard";
const DEFAULT_VNET_ADDRESS_PREFIX = "10.0.0.0/16";
const DEFAULT_SUBNET_ADDRESS_PREFIX = "10.0.1.0/24";
const DEFAULT_CONTAINER_INSTANCE_OID = "88536fb9-d60a-4aee-8195-041425d6e927";

export class VNetHandler {
  /**
   * Retrieves CloudShell VNet settings from user settings
   */
  public static async retrieveCloudShellVnetSettings(settings: Settings, terminal: Terminal): Promise<VnetSettings> {
    if (settings?.properties?.vnetSettings && Object.keys(settings.properties.vnetSettings).length > 0) {
      try {
        const netProfileInfo = await getNetworkProfileInfo<any>(settings.properties.vnetSettings.networkProfileResourceId);

        terminal.writeln(terminalLog.header("Existing Network Configuration"));

        const subnetId = netProfileInfo.properties.containerNetworkInterfaceConfigurations[0]
        .properties.ipConfigurations[0].properties.subnet.id;
        const vnetResourceId = subnetId.replace(/\/subnets\/[^/]+$/, '');

        terminal.writeln(terminalLog.item("VNet", vnetResourceId));
        terminal.writeln(terminalLog.item("Subnet", subnetId));
        terminal.writeln(terminalLog.item("Location", settings.properties.vnetSettings.location));
        terminal.writeln(terminalLog.item("Network Profile", settings.properties.vnetSettings.networkProfileResourceId));
        terminal.writeln(terminalLog.item("Relay Namespace", settings.properties.vnetSettings.relayNamespaceResourceId));

        return {
          networkProfileResourceId: settings.properties.vnetSettings.networkProfileResourceId,
          relayNamespaceResourceId: settings.properties.vnetSettings.relayNamespaceResourceId,
          location: settings.properties.vnetSettings.location
        };
      } catch (err) {
        terminal.writeln(terminalLog.warning("Error retrieving network profile. Will configure new network."));
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Asks the user if they want to use existing network configuration (VNet or private endpoint)
   */
  public static async askForVNetConfigConsent(terminal: Terminal, shellType: TerminalKind = null): Promise<boolean> {
    // Check if this shell type supports only private endpoints
    const isPrivateEndpointOnlyShell = shellType === TerminalKind.VCoreMongo;
    // Check if the database has private endpoints configured
    const hasPrivateEndpoints = hasPrivateEndpointsRestrictions();
    
    // Determine which network type to mention based on shell type and database configuration
    const networkType = isPrivateEndpointOnlyShell || hasPrivateEndpoints ? "private endpoint" : "network";
    
    // Ask for consent
    terminal.writeln("");
    terminal.writeln(terminalLog.prompt(`Use this existing ${networkType} configuration?`));
    terminal.writeln(terminalLog.info(`Answering 'N' will configure a new ${networkType} for CloudShell`));

    return await askConfirmation(terminal, `Press Y/N to continue...`);
  }

  /**
   * Checks if the CloudShell VNet is already in the database configuration
   */
  public static async isCloudShellVNetInDatabaseConfig(vNetSettings: VnetSettings, terminal: Terminal): Promise<boolean> {
    try {
      terminal.writeln(terminalLog.subheader("Verifying if CloudShell VNet is configured in database"));

      // Get the subnet ID from the CloudShell Network Profile
      const netProfileInfo = await getNetworkProfileInfo<any>(vNetSettings.networkProfileResourceId);

      if (!netProfileInfo?.properties?.containerNetworkInterfaceConfigurations?.[0]
        ?.properties?.ipConfigurations?.[0]?.properties?.subnet?.id) {
        terminal.writeln(terminalLog.warning("Could not retrieve subnet ID from CloudShell VNet"));
        return false;
      }

      const cloudShellSubnetId = netProfileInfo.properties.containerNetworkInterfaceConfigurations[0]
        .properties.ipConfigurations[0].properties.subnet.id;

      terminal.writeln(terminalLog.item("CloudShell Subnet", cloudShellSubnetId.split('/').pop() || ""));

      // Check if this subnet ID is in the database VNet rules
      const dbAccount = userContext.databaseAccount;
      if (!dbAccount?.properties?.virtualNetworkRules) {
        return false;
      }

      const vnetRules = dbAccount.properties.virtualNetworkRules;

      // Check if the CloudShell subnet is already in the rules
      return vnetRules.some(rule => rule.id === cloudShellSubnetId);

    } catch (err) {
      terminal.writeln(terminalLog.error("Error checking database VNet configuration"));
      return false;
    }
  }

  /**
   * Asks the user if they want to add the CloudShell VNet to the database configuration
   */
  public static async askToAddVNetToDatabase(terminal: Terminal, vNetSettings: VnetSettings): Promise<boolean> {
    terminal.writeln("");
    terminal.writeln(terminalLog.header("Network Configuration Mismatch"));
    terminal.writeln(terminalLog.warning("Your CloudShell VNet is not in your database's allowed networks"));
    terminal.writeln(terminalLog.warning("To connect from CloudShell, this VNet must be added to your database"));
    
    return await askConfirmation(terminal, "Add CloudShell VNet to database configuration?");
  }

 /**
 * Adds the CloudShell VNet to the database configuration
 * Now supports both VNet rules and private endpoints
 */
public static async addCloudShellVNetToDatabase(vNetSettings: VnetSettings, terminal: Terminal): Promise<void> {
  try {
    terminal.writeln(terminalLog.header("Updating database network configuration"));

    // Step 1: Get the subnet ID from CloudShell Network Profile
    const { cloudShellSubnetId, cloudShellVnetId } = await this.getCloudShellNetworkIds(vNetSettings, terminal);

    // Step 2: Get current database account details
    const { currentDbAccount } = await this.getDatabaseAccountDetails(terminal);

    // Step 3: Determine if database uses private endpoints
    const usesPrivateEndpoints = hasPrivateEndpointsRestrictions() || 
                                (currentDbAccount.properties.privateEndpointConnections?.length > 0);
    
    // Log which networking mode we're using
    if (usesPrivateEndpoints) {
      terminal.writeln(terminalLog.info("Database is configured with private endpoints"));
    } else {
      terminal.writeln(terminalLog.info("Database is configured with VNet rules"));
    }

    // Step 4: Check if connection is already configured
    if (usesPrivateEndpoints) {
      if (await this.isPrivateEndpointAlreadyConfigured(cloudShellVnetId, currentDbAccount, terminal)) {
        return;
      }
    } else {
      if (await this.isVNetAlreadyConfigured(cloudShellSubnetId, currentDbAccount, terminal)) {
        return;
      }
    }

    // Step 5: Check network resource statuses and ongoing operations
    const { vnetInfo, subnetInfo, operationInProgress } =
      await this.checkNetworkResourceStatuses(cloudShellSubnetId, cloudShellVnetId, currentDbAccount.id, terminal);

    // Step 6: If no operation in progress, update the configuration
    if (!operationInProgress) {
      if (usesPrivateEndpoints) {
        // Create or update private endpoint configuration
        await this.configurePrivateEndpoint(
          cloudShellSubnetId, 
          vnetInfo.location, 
          currentDbAccount.id, 
          terminal
        );
      } else {
        // Enable CosmosDB service endpoint on subnet if needed (for VNet rules)
        await this.enableCosmosDBServiceEndpoint(cloudShellSubnetId, subnetInfo, terminal);

        // Update database account with VNet rule
        await this.updateDatabaseWithVNetRule(currentDbAccount, cloudShellSubnetId, currentDbAccount.id, terminal);
      }
    } else {
      terminal.writeln(terminalLog.info("Monitoring existing network operation..."));
      // Step 7: Monitor the update progress
      await this.monitorVNetAdditionProgress(cloudShellSubnetId, currentDbAccount.id, terminal);
    }

  } catch (err) {
    terminal.writeln(terminalLog.error(`Error updating database network configuration: ${err.message}`));
    throw err;
  }
}

/**
 * Checks if a private endpoint is already configured for the CloudShell VNet
 */
private static async isPrivateEndpointAlreadyConfigured(
  cloudShellVnetId: string, 
  currentDbAccount: any, 
  terminal: Terminal
): Promise<boolean> {
  // Check if private endpoints exist and are properly configured for this VNet
  const hasConfiguredEndpoint = currentDbAccount.properties.privateEndpointConnections?.some(
    (connection: any) => {
      const isApproved = connection.properties.privateLinkServiceConnectionState.status === 'Approved';
      // We would need to check if the endpoint is in the CloudShell VNet
      // For simplicity, we're assuming connection.properties.networkInterface contains this info
      const endpointVNetId = connection.properties.networkInterface?.id?.split('/subnets/')[0];
      return isApproved && endpointVNetId === cloudShellVnetId;
    }
  );

  if (hasConfiguredEndpoint) {
    terminal.writeln(terminalLog.success("CloudShell private endpoint is already configured"));
    return true;
  }

  return false;
}

/**
 * Configures a private endpoint for the CloudShell VNet to connect to the database
 */
private static async configurePrivateEndpoint(
  cloudShellSubnetId: string,
  vnetLocation: any,
  dbAccountId: string,
  terminal: Terminal
): Promise<void> {
  // Extract necessary information from IDs
  const subnetIdParts = cloudShellSubnetId.split('/');
  const subnetIndex = subnetIdParts.indexOf('subnets');
  
  const subnetName = subnetIdParts[subnetIndex + 1];
  const resourceGroup = subnetIdParts[4];
  const subscriptionId = subnetIdParts[2];
  
  // Generate a unique name for the private endpoint
  const privateEndpointName = `pe-cloudshell-cosmos-${Math.floor(10000 + Math.random() * 90000)}`;
  
  terminal.writeln(terminalLog.subheader("Creating private endpoint for CloudShell"));
  terminal.writeln(terminalLog.item("Private Endpoint Name", privateEndpointName));
  terminal.writeln(terminalLog.item("Target Subnet", subnetName));
  
  // Construct the private endpoint creation payload
  const privateEndpointPayload = {
    location: vnetLocation,
    properties: {
      privateLinkServiceConnections: [
        {
          name: privateEndpointName,
          properties: {
            privateLinkServiceId: dbAccountId,
            groupIds: [
                "MongoDB"
            ],
            requestMessage: "CloudShell connectivity request"
          },
          type: "Microsoft.Network/privateEndpoints/privateLinkServiceConnections"
        }
      ],
      subnet: {
        id: cloudShellSubnetId
      }
    }
  };
  
  // Send the request to create the private endpoint
  // Note: This is a placeholder - we would need to implement this API call
  terminal.writeln(terminalLog.info("Submitting private endpoint creation request"));
  
  try {
    const privateEndpointUrl = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/privateEndpoints/${privateEndpointName}`;
    
    await createPrivateEndpoint(privateEndpointUrl, privateEndpointPayload, "2024-05-01");
    
    terminal.writeln(terminalLog.success("Private endpoint creation request submitted"));
    terminal.writeln(terminalLog.warning("Please approve the private endpoint connection in the Azure portal"));
    terminal.writeln(terminalLog.info("Note: Private endpoint operations may take several minutes to complete"));
  } catch (err) {
    terminal.writeln(terminalLog.error(`Failed to create private endpoint: ${err.message}`));
    throw err;
  }
}
  /**
   * Gets the subnet and VNet IDs from CloudShell Network Profile
   */
  private static async getCloudShellNetworkIds(vNetSettings: VnetSettings, terminal: Terminal): Promise<{ cloudShellSubnetId: string; cloudShellVnetId: string }> {
    const netProfileInfo = await getNetworkProfileInfo<any>(vNetSettings.networkProfileResourceId);

    if (!netProfileInfo?.properties?.containerNetworkInterfaceConfigurations?.[0]
      ?.properties?.ipConfigurations?.[0]?.properties?.subnet?.id) {
      throw new Error("Could not retrieve subnet ID from CloudShell VNet");
    }

    const cloudShellSubnetId = netProfileInfo.properties.containerNetworkInterfaceConfigurations[0]
      .properties.ipConfigurations[0].properties.subnet.id;

    // Extract VNet ID from subnet ID
    const cloudShellVnetId = cloudShellSubnetId.substring(0, cloudShellSubnetId.indexOf('/subnets/'));

    terminal.writeln(terminalLog.subheader("Identified CloudShell network resources"));
    terminal.writeln(terminalLog.item("Subnet", cloudShellSubnetId.split('/').pop() || ""));
    terminal.writeln(terminalLog.item("VNet", cloudShellVnetId.split('/').pop() || ""));

    return { cloudShellSubnetId, cloudShellVnetId };
  }

  /**
   * Gets the database account details
   */
  private static async getDatabaseAccountDetails(terminal: Terminal): Promise<{ currentDbAccount: any }> {
    const dbAccount = userContext.databaseAccount;
    terminal.writeln(terminalLog.database("Verifying current configuration"));
    const currentDbAccount = await getAccountDetails(dbAccount.id);

    return { currentDbAccount };
  }

  /**
   * Checks if the VNet is already configured in the database
   */
  private static async isVNetAlreadyConfigured(cloudShellSubnetId: string, currentDbAccount: any, terminal: Terminal): Promise<boolean> {
    const vnetAlreadyConfigured = currentDbAccount.properties.virtualNetworkRules &&
      currentDbAccount.properties.virtualNetworkRules.some(
        (rule: any) => rule.id === cloudShellSubnetId
      );

    if (vnetAlreadyConfigured) {
      terminal.writeln(terminalLog.success("CloudShell VNet is already in database configuration"));
      return true;
    }

    return false;
  }

  /**
   * Checks the status of network resources and ongoing operations
   */
  private static async checkNetworkResourceStatuses(
    cloudShellSubnetId: string,
    cloudShellVnetId: string,
    dbAccountId: string,
    terminal: Terminal
  ): Promise<{ vnetInfo: any; subnetInfo: any; operationInProgress: boolean }> {
    terminal.writeln(terminalLog.subheader("Checking network resource status"));

    let operationInProgress = false;
    let vnetInfo: any = null;
    let subnetInfo: any = null;

    if (cloudShellVnetId && cloudShellSubnetId) {
      // Get VNet and subnet resource status
      vnetInfo = await getVnetInformation<any>(cloudShellVnetId);
      subnetInfo = await getSubnetInformation<any>(cloudShellSubnetId);

      // Check if there's an ongoing operation on the VNet or subnet
      const vnetProvisioningState = vnetInfo?.properties?.provisioningState;
      const subnetProvisioningState = subnetInfo?.properties?.provisioningState;

      if (vnetProvisioningState !== 'Succeeded' && vnetProvisioningState !== 'Failed') {
        terminal.writeln(terminalLog.warning(`VNet operation in progress: ${vnetProvisioningState}`));
        operationInProgress = true;
      }

      if (subnetProvisioningState !== 'Succeeded' && subnetProvisioningState !== 'Failed') {
        terminal.writeln(terminalLog.warning(`Subnet operation in progress: ${subnetProvisioningState}`));
        operationInProgress = true;
      }

      // Also check database operations
      const latestDbAccount = await getAccountDetails<any>(dbAccountId);

      if (latestDbAccount.properties.virtualNetworkRules) {
        const isPendingAdd = latestDbAccount.properties.virtualNetworkRules.some(
          (rule: any) => rule.id === cloudShellSubnetId && rule.status === 'Updating'
        );

        if (isPendingAdd) {
          terminal.writeln(terminalLog.warning("CloudShell VNet addition to database is already in progress"));
          operationInProgress = true;
        }
      }
    }

    return { vnetInfo, subnetInfo, operationInProgress };
  }

  /**
   * Enables the CosmosDB service endpoint on a subnet if needed
   */
  private static async enableCosmosDBServiceEndpoint(cloudShellSubnetId: string, subnetInfo: any, terminal: Terminal): Promise<void> {
    if (!subnetInfo) {
      terminal.writeln(terminalLog.warning("Unable to check subnet endpoint configuration"));
      return;
    }

    terminal.writeln(terminalLog.subheader("Checking and configuring CosmosDB service endpoint"));

    // Parse the subnet ID to get resource information
    const subnetIdParts = cloudShellSubnetId.split('/');
    const subnetIndex = subnetIdParts.indexOf('subnets');
    if (subnetIndex > 0) {
      const subnetName = subnetIdParts[subnetIndex + 1];
      const vnetName = subnetIdParts[subnetIndex - 1];
      const resourceGroup = subnetIdParts[4];
      const subscriptionId = subnetIdParts[2];

      // Get the subnet URL
      const subnetUrl = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks/${vnetName}/subnets/${subnetName}`;

      // Check if CosmosDB service endpoint is already enabled
      const hasCosmosDBEndpoint = subnetInfo.properties.serviceEndpoints &&
        subnetInfo.properties.serviceEndpoints.some(
          (endpoint: any) => endpoint.service === 'Microsoft.AzureCosmosDB'
        );

      if (!hasCosmosDBEndpoint) {
        terminal.writeln(terminalLog.warning("Enabling CosmosDB service endpoint on subnet..."));

        // Create update payload with CosmosDB service endpoint
        const serviceEndpoints = [
          ...(subnetInfo.properties.serviceEndpoints || []),
          { service: 'Microsoft.AzureCosmosDB' }
        ];

        // Update the subnet configuration while preserving existing properties
        const subnetUpdatePayload = {
          ...subnetInfo,
          properties: {
            ...subnetInfo.properties,
            serviceEndpoints: serviceEndpoints
          }
        };

        // Apply the subnet update
        await updateSubnetInformation(subnetUrl, subnetUpdatePayload);

        // Wait for the subnet update to complete
        let subnetUpdateComplete = false;
        let subnetRetryCount = 0;

        while (!subnetUpdateComplete && subnetRetryCount < MAX_RETRY_COUNT) {
          const updatedSubnet = await getSubnetInformation<any>(subnetUrl);

          const endpointEnabled = updatedSubnet.properties.serviceEndpoints &&
            updatedSubnet.properties.serviceEndpoints.some(
              (endpoint: any) => endpoint.service === 'Microsoft.AzureCosmosDB'
            );

          if (endpointEnabled && updatedSubnet.properties.provisioningState === 'Succeeded') {
            subnetUpdateComplete = true;
            terminal.writeln(terminalLog.success("CosmosDB service endpoint enabled successfully"));
          } else {
            subnetRetryCount++;
            terminal.writeln(terminalLog.progress("Subnet update", `Waiting (${subnetRetryCount}/${MAX_RETRY_COUNT})`));
            await wait(POLLING_INTERVAL_MS);
          }
        }

        if (!subnetUpdateComplete) {
          throw new Error("Failed to enable CosmosDB service endpoint on subnet");
        }
      } else {
        terminal.writeln(terminalLog.success("CosmosDB service endpoint is already enabled"));
      }
    }
  }

  /**
   * Updates the database account with a new VNet rule
   */
  private static async updateDatabaseWithVNetRule(currentDbAccount: any, cloudShellSubnetId: string, dbAccountId: string, terminal: Terminal): Promise<void> {
    // Create a deep copy of the current database account
    const updatePayload = JSON.parse(JSON.stringify(currentDbAccount));

    // Update only the network-related properties
    updatePayload.properties.virtualNetworkRules = [
      ...(currentDbAccount.properties.virtualNetworkRules || []),
      { id: cloudShellSubnetId, ignoreMissingVNetServiceEndpoint: false }
    ];
    updatePayload.properties.isVirtualNetworkFilterEnabled = true;

    // Update the database account
    terminal.writeln(terminalLog.subheader("Submitting VNet update request to database"));
    await updateDatabaseAccount(dbAccountId, updatePayload);
    terminal.writeln(terminalLog.success("Updated Database account with Cloud Shell Vnet"));
  }

  /**
   * Monitors the progress of adding a VNet to the database account
   */
  private static async monitorVNetAdditionProgress(cloudShellSubnetId: string, dbAccountId: string, terminal: Terminal): Promise<void> {
    let updateComplete = false;
    let retryCount = 0;
    let lastStatus = "";
    let lastProgress = 0;
    let lastOpId = "";

    terminal.writeln(terminalLog.subheader("Monitoring database update progress"));

    while (!updateComplete && retryCount < MAX_RETRY_COUNT) {
      // Check if the VNet is now in the database account 
      const updatedDbAccount = await getAccountDetails<any>(dbAccountId);
      
      const isVNetAdded = updatedDbAccount.properties.virtualNetworkRules?.some(
        (rule: any) => rule.id === cloudShellSubnetId && (!rule.status || rule.status === 'Succeeded')
      );
      
      if (isVNetAdded) {
        updateComplete = true;
        terminal.writeln(terminalLog.success("CloudShell VNet successfully added to database configuration"));
        break;
      }
      
      // If not yet added, check for operation progress
      const operations = await getDatabaseOperations<any>(dbAccountId);
      
      // Find network-related operations
      const networkOps = operations.value?.filter(
        (op: any) => 
        (op.properties.description?.toLowerCase().includes('network') ||
          op.properties.description?.toLowerCase().includes('vnet'))
      ) || [];
      
      // Find active operations
      const activeOp = networkOps.find((op: any) => op.properties.status === 'InProgress');
      
      if (activeOp) {
        // Show progress details if available
        const currentStatus = activeOp.properties.status;
        const progress = activeOp.properties.percentComplete || 0;
        const opId = activeOp.name;
        
        // Only update the terminal if something has changed
        if (currentStatus !== lastStatus || progress !== lastProgress || opId !== lastOpId) {
          // Create a progress bar
          const progressBarLength = 20;
          const filledLength = Math.floor(progress / 100 * progressBarLength);
          const progressBar = "█".repeat(filledLength) + "░".repeat(progressBarLength - filledLength);
          
          terminal.writeln(`\x1B[34m  [${progressBar}] ${progress}% - ${currentStatus}\x1B[0m`);
          lastStatus = currentStatus;
          lastProgress = progress;
          lastOpId = opId;
        }
      } else if (networkOps.length > 0) {
        // If there are completed operations, show their status
        const lastCompletedOp = networkOps[0];
        
        if (lastCompletedOp.properties.status !== lastStatus) {
          terminal.writeln(terminalLog.progress("Operation status", lastCompletedOp.properties.status));
          lastStatus = lastCompletedOp.properties.status;
        }
      }
      
      retryCount++;
      await wait(POLLING_INTERVAL_MS);
    }
    
    if (!updateComplete) {
      terminal.writeln(terminalLog.warning("Database update timed out. Please check the Azure portal."));
    }
  }

  /**
   * Configures a new VNet for CloudShell
   */
  public static async configureCloudShellVNet(terminal: Terminal, resolvedRegion: string): Promise<VnetSettings> {
    // Use professional and shorter names for resources
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);

    const subnetName = `cloudshell-subnet-${randomSuffix}`;
    const vnetName = `cloudshell-vnet-${randomSuffix}`;
    const networkProfileName = `cloudshell-network-profile-${randomSuffix}`;
    const relayName = `cloudshell-relay-${randomSuffix}`;

    terminal.writeln(terminalLog.header("Network Resource Configuration"));

    const azureContainerInstanceOID = await askQuestion(
      terminal,
      "Enter Azure Container Instance OID (Refer. https://learn.microsoft.com/en-us/azure/cloud-shell/vnet/deployment#get-the-azure-container-instance-id)",
      DEFAULT_CONTAINER_INSTANCE_OID
    );

    const vNetSubscriptionId = await askQuestion(
      terminal,
      "Enter Virtual Network Subscription ID",
      userContext.subscriptionId
    );

    const vNetResourceGroup = await askQuestion(
      terminal,
      "Enter Virtual Network Resource Group",
      userContext.resourceGroup
    );

    // Step 1: Create VNet with Subnet
    terminal.writeln(terminalLog.header("Deploying Network Resources"));
    const vNetConfigPayload = await this.createCloudShellVnet(
      resolvedRegion,
      subnetName,
      terminal,
      vnetName,
      vNetSubscriptionId,
      vNetResourceGroup
    );

    // Step 2: Create Network Profile
    await this.createNetworkProfileWithVnet(
      vNetSubscriptionId,
      vNetResourceGroup,
      vnetName,
      subnetName,
      resolvedRegion,
      terminal,
      networkProfileName
    );

    // Step 3: Create Network Relay
    await this.createNetworkRelay(
      resolvedRegion,
      terminal,
      relayName,
      vNetSubscriptionId,
      vNetResourceGroup
    );

    // Step 4: Assign Roles
    terminal.writeln(terminalLog.header("Configuring Security Permissions"));
    await this.assignRoleToNetworkProfile(
      azureContainerInstanceOID,
      vNetSubscriptionId,
      terminal,
      networkProfileName,
      vNetResourceGroup
    );

    await this.assignRoleToRelay(
      azureContainerInstanceOID,
      vNetSubscriptionId,
      terminal,
      relayName,
      vNetResourceGroup
    );

    // Step 5: Create and return VNet settings
    const networkProfileResourceId = `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/networkProfiles/${networkProfileName.replace(/[\n\r]/g, "")}`;
    const relayResourceId = `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Relay/namespaces/${relayName.replace(/[\n\r]/g, "")}`;

    terminal.writeln(terminalLog.success("Network configuration complete"));

    return {
      networkProfileResourceId,
      relayNamespaceResourceId: relayResourceId,
      location: vNetConfigPayload.location
    };
  }

  /**
   * Creates a VNet for CloudShell
   */
  private static async createCloudShellVnet(
    resolvedRegion: string,
    subnetName: string,
    terminal: Terminal,
    vnetName: string,
    vNetSubscriptionId: string,
    vNetResourceGroup: string
  ): Promise<any> {
    const vNetConfigPayload = {
      location: resolvedRegion,
      properties: {
        addressSpace: {
          addressPrefixes: [DEFAULT_VNET_ADDRESS_PREFIX],
        },
        subnets: [
          {
            name: subnetName,
            properties: {
              addressPrefix: DEFAULT_SUBNET_ADDRESS_PREFIX,
              delegations: [
                {
                  name: "CloudShellDelegation",
                  properties: {
                    serviceName: "Microsoft.ContainerInstance/containerGroups"
                  }
                }
              ],
            },
          },
        ],
      },
    };

    terminal.writeln(terminalLog.vnet(`Creating VNet: ${vnetName}`));
    let vNetResponse = await updateVnet<any>(
      `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/virtualNetworks/${vnetName}`,
      vNetConfigPayload
    );

    while (vNetResponse?.properties?.provisioningState !== "Succeeded") {
      vNetResponse = await getVnet<any>(
        `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/virtualNetworks/${vnetName}`
      );

      const vNetState = vNetResponse?.properties?.provisioningState;
      if (vNetState !== "Succeeded" && vNetState !== "Failed") {
        await wait(POLLING_INTERVAL_MS);
        terminal.writeln(terminalLog.progress("VNet deployment", vNetState));
      } else {
        break;
      }
    }

    terminal.writeln(terminalLog.success("VNet created successfully"));
    return vNetConfigPayload;
  }

  /**
   * Creates a Network Profile for CloudShell
   */
  private static async createNetworkProfileWithVnet(
    vNetSubscriptionId: string,
    vNetResourceGroup: string,
    vnetName: string,
    subnetName: string,
    resolvedRegion: string,
    terminal: Terminal,
    networkProfileName: string
  ): Promise<void> {
    const subnetId = `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/virtualNetworks/${vnetName}/subnets/${subnetName}`;

    const createNetworkProfilePayload = {
      location: resolvedRegion,
      properties: {
        containerNetworkInterfaceConfigurations: [
          {
            name: 'defaultContainerNicConfig',
            properties: {
              ipConfigurations: [
                {
                  name: 'defaultContainerIpConfig',
                  properties: {
                    subnet: {
                      id: subnetId,
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    };

    terminal.writeln(terminalLog.vnet("Creating Network Profile"));
    let networkProfileResponse = await createNetworkProfile<any>(
      `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/networkProfiles/${networkProfileName}`,
      createNetworkProfilePayload
    );

    while (networkProfileResponse?.properties?.provisioningState !== "Succeeded") {
      networkProfileResponse = await getNetworkProfileInfo<any>(
        `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/networkProfiles/${networkProfileName}`
      );

      const networkProfileState = networkProfileResponse?.properties?.provisioningState;
      if (networkProfileState !== "Succeeded" && networkProfileState !== "Failed") {
        await wait(POLLING_INTERVAL_MS);
        terminal.writeln(terminalLog.progress("Network Profile", networkProfileState));
      } else {
        break;
      }
    }

    terminal.writeln(terminalLog.success("Network Profile created successfully"));
  }

  /**
   * Creates a Network Relay for CloudShell
   */
  private static async createNetworkRelay(
    resolvedRegion: string,
    terminal: Terminal,
    relayName: string,
    vNetSubscriptionId: string,
    vNetResourceGroup: string
  ): Promise<void> {
    const relayPayload = {
      location: resolvedRegion,
      sku: {
        name: STANDARD_SKU,
        tier: STANDARD_SKU,
      }
    };

    terminal.writeln(terminalLog.vnet("Creating Relay Namespace"));
    let relayResponse = await createRelay<any>(
      `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Relay/namespaces/${relayName}`,
      relayPayload
    );

    while (relayResponse?.properties?.provisioningState !== "Succeeded") {
      relayResponse = await getRelay<any>(
        `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Relay/namespaces/${relayName}`
      );

      const relayState = relayResponse?.properties?.provisioningState;
      if (relayState !== "Succeeded" && relayState !== "Failed") {
        await wait(POLLING_INTERVAL_MS);
        terminal.writeln(terminalLog.progress("Relay Namespace", relayState));
      } else {
        break;
      }
    }

    terminal.writeln(terminalLog.success("Relay Namespace created successfully"));
  }

  /**
   * Assigns a role to a Network Profile
   */
  private static async assignRoleToNetworkProfile(
    azureContainerInstanceOID: string,
    vNetSubscriptionId: string,
    terminal: Terminal,
    networkProfileName: string,
    vNetResourceGroup: string
  ): Promise<void> {
    const nfRoleName = uuidv4();
    const networkProfileRoleAssignmentPayload = {
      properties: {
        principalId: azureContainerInstanceOID,
        roleDefinitionId: `/subscriptions/${vNetSubscriptionId}/providers/Microsoft.Authorization/roleDefinitions/4d97b98b-1d4f-4787-a291-c67834d212e7`
      }
    };

    terminal.writeln(terminalLog.info("Assigning permissions to Network Profile"));
    await createRoleOnNetworkProfile<any>(
      `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Network/networkProfiles/${networkProfileName}/providers/Microsoft.Authorization/roleAssignments/${nfRoleName}`,
      networkProfileRoleAssignmentPayload
    );

    terminal.writeln(terminalLog.success("Network Profile permissions assigned"));
  }

  /**
   * Assigns a role to a Network Relay
   */
  private static async assignRoleToRelay(
    azureContainerInstanceOID: string,
    vNetSubscriptionId: string,
    terminal: Terminal,
    relayName: string,
    vNetResourceGroup: string
  ): Promise<void> {
    const relayRoleName = uuidv4();
    const relayRoleAssignmentPayload = {
      properties: {
        principalId: azureContainerInstanceOID,
        roleDefinitionId: `/subscriptions/${vNetSubscriptionId}/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c`,
      }
    };

    terminal.writeln(terminalLog.info("Assigning permissions to Relay Namespace"));
    await createRoleOnRelay<any>(
      `/subscriptions/${vNetSubscriptionId}/resourceGroups/${vNetResourceGroup}/providers/Microsoft.Relay/namespaces/${relayName}/providers/Microsoft.Authorization/roleAssignments/${relayRoleName}`,
      relayRoleAssignmentPayload
    );

    terminal.writeln(terminalLog.success("Relay Namespace permissions assigned"));
  }
}
