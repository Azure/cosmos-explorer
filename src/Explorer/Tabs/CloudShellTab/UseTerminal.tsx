/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { Settings, VnetSettings } from "Explorer/Tabs/CloudShellTab/DataModels";
import { listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { v4 as uuidv4 } from 'uuid';
import { Terminal } from "xterm";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { 
  IsPublicAccessAvailable, 
  hasPrivateEndpointsRestrictions, 
  hasVNetRestrictions 
} from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "../../../UserContext";
import { AttachAddon } from "./AttachAddOn";
import { getCommands } from "./Commands";
import {
  authorizeSession,
  connectTerminal,
  createNetworkProfile,
  createRelay,
  createRoleOnNetworkProfile,
  createRoleOnRelay,
  getAccountDetails,
  getDatabaseOperations,
  getNetworkProfileInfo,
  getNormalizedRegion,
  getRelay,
  getSubnetInformation,
  getUserSettings,
  getVnet,
  getVnetInformation,
  provisionConsole,
  putEphemeralUserSettings,
  registerCloudShellProvider,
  setShellType,
  updateDatabaseAccount,
  updateSubnetInformation,
  updateVnet,
  verifyCloudShellProviderRegistration
} from "./Data";
import { terminalLog } from "./LogFormatter";

// Constants
const DEFAULT_CLOUDSHELL_REGION = "westus";
const POLLING_INTERVAL_MS = 5000;
const MAX_RETRY_COUNT = 10;
const MAX_PING_COUNT = 20 * 60; // 20 minutes (60 seconds/minute)
const STANDARD_SKU = "Standard";
const DEFAULT_VNET_ADDRESS_PREFIX = "10.0.0.0/16";
const DEFAULT_SUBNET_ADDRESS_PREFIX = "10.0.1.0/24";
const DEFAULT_CONTAINER_INSTANCE_OID = "88536fb9-d60a-4aee-8195-041425d6e927";

/**
 * Main function to start a CloudShell terminal
 */
export const startCloudShellTerminal = async (terminal: Terminal, shellType: TerminalKind) => {
  // Set the shell type to use the appropriate API version for all calls
  setShellType(shellType);

  terminal.writeln(terminalLog.header("Initializing Azure CloudShell"));
  await ensureCloudShellProviderRegistered(terminal);

  const { resolvedRegion, defaultCloudShellRegion } = determineCloudShellRegion(terminal);

  // Ask for user consent for region
  const consentGranted = await askForRegionConsent(terminal, resolvedRegion);
  if (!consentGranted) {
    return {}; // Exit if user declined
  }

  const isAllPublicAccessEnabled = await IsPublicAccessAvailable(shellType);

  let settings: Settings | undefined;
  let cloudShellVnetSettings: VnetSettings | undefined;
  let finalVNetSettings: VnetSettings | {};

  if (!isAllPublicAccessEnabled) {
    // Fetch and process user settings for restricted networks
    terminal.writeln(terminalLog.database("Network restrictions detected"));
    terminal.writeln(terminalLog.info("Loading CloudShell configuration..."));
    settings = await getUserSettings();
    if (!settings) {
      terminal.writeln(terminalLog.warning("No existing user settings found."));
    }
    else {    
      cloudShellVnetSettings = await retrieveCloudShellVnetSettings(settings, terminal);
    }
 
    // If CloudShell has VNet settings, check with database config
    if (cloudShellVnetSettings && cloudShellVnetSettings.networkProfileResourceId) {

      //TODO: askForVNetConfigConsent consent should change to support private end point 
      // if shell type is vcore or for any other shell as  private endpoint restrictions
      const isContinueWithSameVnet = await askForVNetConfigConsent(terminal);
      
      if(isContinueWithSameVnet) {
        // TODO: isCloudShellVNetInDatabaseConfig call should handle private endpoint check also. 
        // a private endpoint is associated with the vnet and subnet. 
        // vcore supports only private endpoint, it doesnot support vnet, dbAccount?.properties?.privateEndpointConnections doesn't have any info. ARM call might needs to make to get private endpoint info
        const isVNetInDatabaseConfig = await isCloudShellVNetInDatabaseConfig(cloudShellVnetSettings, terminal);

        if (!isVNetInDatabaseConfig) {
          terminal.writeln(terminalLog.warning("CloudShell VNet is not configured in database access list"));
          // TODO: Add logic in askToAddVNetToDatabase to ask accordingly if user has private endpoint or vnet settings
          const addToDatabase = await askToAddVNetToDatabase(terminal, cloudShellVnetSettings);

          if (addToDatabase) {
            // TODO: Add a logic to add private endpoint to database if user has private endpoint settings in the database
            await addCloudShellVNetToDatabase(cloudShellVnetSettings, terminal);
          } else {
            // User declined to add VNet to database, need to recreate
            terminal.writeln(terminalLog.warning("Will configure new VNet..."));
            cloudShellVnetSettings = undefined;
          }
        } else {
          terminal.writeln(terminalLog.success("CloudShell VNet is already in database configuration"));
        }
      }
      else {
        cloudShellVnetSettings = undefined; // User declined to use existing VNet settings
      }
    }

    if (!cloudShellVnetSettings || !cloudShellVnetSettings.networkProfileResourceId) {

      //TODO: Add logic to check if the user has existing VNet or private endpoint (which would be associated with the Vnet) settings in the database with cloudshell as CloudShellDelegation,
      //  if yes, use that vnet to get network profile and get the existing relay and 
      // use that for cloudshell, else create only those resources which are required and ternminal write the existing relay and vnet settings.which it is going to use.
      terminal.writeln(terminalLog.subheader("Configuring network infrastructure"));
      finalVNetSettings = await configureCloudShellVNet(terminal, resolvedRegion);

       // TODO: Add a logic to add private endpoint to database if user has private endpoint settings in the database
      await addCloudShellVNetToDatabase(finalVNetSettings as VnetSettings, terminal);
    } else {
      terminal.writeln(terminalLog.success("Using existing network configuration"));
      finalVNetSettings = cloudShellVnetSettings;
    }
  } else {
    terminal.writeln(terminalLog.database("Public access enabled. Skipping VNet configuration."));
  }

  terminal.writeln("");
  // Provision CloudShell session
  terminal.writeln(terminalLog.cloudshell(`Provisioning Started....`));

  let sessionDetails: {
    socketUri?: string;
    provisionConsoleResponse?: any;
    targetUri?: string;
  };

  try {
    sessionDetails = await provisionCloudShellSession(resolvedRegion, terminal, finalVNetSettings, isAllPublicAccessEnabled);
  } catch (err) {
    terminal.writeln(terminalLog.error(err));
    terminal.writeln(terminalLog.error("Failed to provision in primary region"));
    terminal.writeln(terminalLog.warning(`Attempting with fallback region: ${defaultCloudShellRegion}`));

    sessionDetails = await provisionCloudShellSession(defaultCloudShellRegion, terminal, finalVNetSettings, isAllPublicAccessEnabled);
  }

  if (!sessionDetails.socketUri) {
    terminal.writeln(terminalLog.error('Unable to provision console. Please try again later.'));
    return {};
  }

  // Configure WebSocket connection
  const socket = await establishTerminalConnection(
    terminal,
    shellType,
    sessionDetails.socketUri,
    sessionDetails.provisionConsoleResponse,
    sessionDetails.targetUri
  );

  return socket;
};

/**
 * Asks the user if they want to use existing network configuration (VNet or private endpoint)
 */
const askForVNetConfigConsent = async (terminal: Terminal, shellType: TerminalKind = null): Promise<boolean> => {
  // Check if this shell type supports only private endpoints
  const isPrivateEndpointOnlyShell = shellType === TerminalKind.VCoreMongo;
  // Check if the database has private endpoints configured
  const hasPrivateEndpoints = hasPrivateEndpointsRestrictions();
  
  // Determine which network type to mention based on shell type and database configuration
  const networkType = isPrivateEndpointOnlyShell || hasPrivateEndpoints ? "private endpoint" : "network";
  
  // Ask for consent
  terminal.writeln("");
  terminal.writeln(terminalLog.prompt(`Use this existing ${networkType} configuration? (Y/N)`));
  terminal.writeln(terminalLog.info(`Answering 'N' will configure a new ${networkType} for CloudShell`));

  return new Promise<boolean>((resolve) => {
    const keyListener = terminal.onKey(({ key }: { key: string }) => {
      keyListener.dispose();
      terminal.writeln("");

      if (key.toLowerCase() === 'y') {
        terminal.writeln(terminalLog.success(`Proceeding with existing ${networkType} configuration`));
        resolve(true);
      } else {
        terminal.writeln(terminalLog.info(`Will configure new ${networkType} settings`));
        resolve(false);
      }
    });
  });
};

/**
 * Checks if the CloudShell VNet is already in the database configuration
 */
const isCloudShellVNetInDatabaseConfig = async (vNetSettings: VnetSettings, terminal: Terminal): Promise<boolean> => {
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
};

/**
 * Asks the user if they want to add the CloudShell VNet to the database configuration
 */
const askToAddVNetToDatabase = async (terminal: Terminal, vNetSettings: VnetSettings): Promise<boolean> => {
  terminal.writeln("");
  terminal.writeln(terminalLog.header("Network Configuration Mismatch"));
  terminal.writeln(terminalLog.warning("Your CloudShell VNet is not in your database's allowed networks"));
  terminal.writeln(terminalLog.warning("To connect from CloudShell, this VNet must be added to your database"));
  terminal.writeln(terminalLog.prompt("Add CloudShell VNet to database configuration? (y/n)"));

  return new Promise<boolean>((resolve) => {
    const keyListener = terminal.onKey(({ key }: { key: string }) => {
      keyListener.dispose();
      terminal.writeln("");

      if (key.toLowerCase() === 'y') {
        terminal.writeln(terminalLog.success("Proceeding to add VNet to database"));
        resolve(true);
      } else {
        terminal.writeln(terminalLog.warning("Skipping VNet configuration for database"));
        resolve(false);
      }
    });
  });
};

/**
 * Adds the CloudShell VNet to the database configuration
 */
const addCloudShellVNetToDatabase = async (vNetSettings: VnetSettings, terminal: Terminal): Promise<void> => {
  try {
    terminal.writeln(terminalLog.header("Updating database network configuration"));

    // Step 1: Get the subnet ID from CloudShell Network Profile
    const { cloudShellSubnetId, cloudShellVnetId } = await getCloudShellNetworkIds(vNetSettings, terminal);

    // Step 2: Get current database account details
    const { currentDbAccount } = await getDatabaseAccountDetails(terminal);

    // Step 3: Check if VNet is already configured in database
    if (await isVNetAlreadyConfigured(cloudShellSubnetId, currentDbAccount, terminal)) {
      return;
    }

    // Step 4: Check network resource statuses
    const { vnetInfo, subnetInfo, operationInProgress } =
      await checkNetworkResourceStatuses(cloudShellSubnetId, cloudShellVnetId, currentDbAccount.id, terminal);

    // Step 5: If no operation in progress, update the subnet and database
    if (!operationInProgress) {
      // Step 5a: Enable CosmosDB service endpoint on subnet if needed
      await enableCosmosDBServiceEndpoint(cloudShellSubnetId, subnetInfo, terminal);

      // Step 5b: Update database account with VNet rule
      await updateDatabaseWithVNetRule(currentDbAccount, cloudShellSubnetId, currentDbAccount.id, terminal);
    } else {
      terminal.writeln(terminalLog.info("Monitoring existing VNet operation..."));
      // Step 6: Monitor the update progress
      await monitorVNetAdditionProgress(cloudShellSubnetId, currentDbAccount.id, terminal);
    }

  } catch (err) {
    terminal.writeln(terminalLog.error(`Error updating database network configuration: ${err.message}`));
    throw err;
  }
};

/**
 * Gets the subnet and VNet IDs from CloudShell Network Profile
 */
const getCloudShellNetworkIds = async (vNetSettings: VnetSettings, terminal: Terminal): Promise<{ cloudShellSubnetId: string; cloudShellVnetId: string }> => {
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
};

/**
 * Gets the database account details
 */
const getDatabaseAccountDetails = async (terminal: Terminal): Promise<{ currentDbAccount: any }> => {
  const dbAccount = userContext.databaseAccount;
  terminal.writeln(terminalLog.database("Verifying current configuration"));
  const currentDbAccount = await getAccountDetails(dbAccount.id);

  return { currentDbAccount };
};

/**
 * Checks if the VNet is already configured in the database
 */
const isVNetAlreadyConfigured = async (cloudShellSubnetId: string, currentDbAccount: any, terminal: Terminal): Promise<boolean> => {
  const vnetAlreadyConfigured = currentDbAccount.properties.virtualNetworkRules &&
    currentDbAccount.properties.virtualNetworkRules.some(
      (rule: any) => rule.id === cloudShellSubnetId
    );

  if (vnetAlreadyConfigured) {
    terminal.writeln(terminalLog.success("CloudShell VNet is already in database configuration"));
    return true;
  }

  return false;
};

/**
 * Checks the status of network resources and ongoing operations
 */
const checkNetworkResourceStatuses = async (
  cloudShellSubnetId: string,
  cloudShellVnetId: string,
  dbAccountId: string,
  terminal: Terminal
): Promise<{ vnetInfo: any; subnetInfo: any; operationInProgress: boolean }> => {
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
};

/**
 * Enables the CosmosDB service endpoint on a subnet if needed
 */
const enableCosmosDBServiceEndpoint = async (cloudShellSubnetId: string, subnetInfo: any, terminal: Terminal): Promise<void> => {
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
};

/**
 * Updates the database account with a new VNet rule
 */
const updateDatabaseWithVNetRule = async (currentDbAccount: any, cloudShellSubnetId: string, dbAccountId: string, terminal: Terminal): Promise<void> => {
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
};

/**
 * Monitors the progress of adding a VNet to the database account
 */
const monitorVNetAdditionProgress = async (cloudShellSubnetId: string, dbAccountId: string, terminal: Terminal): Promise<void> => {
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
};

/**
 * Ensures that the CloudShell provider is registered for the current subscription
 */
const ensureCloudShellProviderRegistered = async (terminal: Terminal): Promise<void> => {
  try {
    terminal.writeln(terminalLog.info("Verifying provider registration..."));
    const response: any = await verifyCloudShellProviderRegistration(userContext.subscriptionId);

    if (response.registrationState !== "Registered") {
      terminal.writeln(terminalLog.warning("Registering CloudShell provider..."));
      await registerCloudShellProvider(userContext.subscriptionId);
      terminal.writeln(terminalLog.success("Provider registration successful"));
    }
  } catch (err) {
    terminal.writeln(terminalLog.error("Unable to verify provider registration"));
    throw err;
  }
};

/**
 * Retrieves existing VNet settings from user settings if available
 */
const retrieveCloudShellVnetSettings = async (settings: Settings, terminal: Terminal): Promise<VnetSettings> => {
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
};

/**
 * Determines the appropriate CloudShell region
 */
const determineCloudShellRegion = (terminal: Terminal): { resolvedRegion: string; defaultCloudShellRegion: string } => {
  const region = userContext.databaseAccount?.location;
  const resolvedRegion = getNormalizedRegion(region, DEFAULT_CLOUDSHELL_REGION);

  return { resolvedRegion, defaultCloudShellRegion: DEFAULT_CLOUDSHELL_REGION };
};

/**
 * Configures a new VNet for CloudShell
 */
const configureCloudShellVNet = async (terminal: Terminal, resolvedRegion: string): Promise<VnetSettings> => {

  // TODO: Use professional and shorter names for resources
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
  const vNetConfigPayload = await createCloudShellVnet(
    resolvedRegion,
    subnetName,
    terminal,
    vnetName,
    vNetSubscriptionId,
    vNetResourceGroup
  );

  // Step 2: Create Network Profile
  await createNetworkProfileWithVnet(
    vNetSubscriptionId,
    vNetResourceGroup,
    vnetName,
    subnetName,
    resolvedRegion,
    terminal,
    networkProfileName
  );

  // Step 3: Create Network Relay
  await createNetworkRelay(
    resolvedRegion,
    terminal,
    relayName,
    vNetSubscriptionId,
    vNetResourceGroup
  );

  // Step 4: Assign Roles
  terminal.writeln(terminalLog.header("Configuring Security Permissions"));
  await assignRoleToNetworkProfile(
    azureContainerInstanceOID,
    vNetSubscriptionId,
    terminal,
    networkProfileName,
    vNetResourceGroup
  );

  await assignRoleToRelay(
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
};

/**
 * Creates a VNet for CloudShell
 */
const createCloudShellVnet = async (
  resolvedRegion: string,
  subnetName: string,
  terminal: Terminal,
  vnetName: string,
  vNetSubscriptionId: string,
  vNetResourceGroup: string
): Promise<any> => {
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
};

/**
 * Creates a Network Profile for CloudShell
 */
const createNetworkProfileWithVnet = async (
  vNetSubscriptionId: string,
  vNetResourceGroup: string,
  vnetName: string,
  subnetName: string,
  resolvedRegion: string,
  terminal: Terminal,
  networkProfileName: string
): Promise<void> => {
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
};

/**
 * Creates a Network Relay for CloudShell
 */
const createNetworkRelay = async (
  resolvedRegion: string,
  terminal: Terminal,
  relayName: string,
  vNetSubscriptionId: string,
  vNetResourceGroup: string
): Promise<void> => {
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
};

/**
 * Assigns a role to a Network Profile
 */
const assignRoleToNetworkProfile = async (
  azureContainerInstanceOID: string,
  vNetSubscriptionId: string,
  terminal: Terminal,
  networkProfileName: string,
  vNetResourceGroup: string
): Promise<void> => {
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
};

/**
 * Assigns a role to a Network Relay
 */
const assignRoleToRelay = async (
  azureContainerInstanceOID: string,
  vNetSubscriptionId: string,
  terminal: Terminal,
  relayName: string,
  vNetResourceGroup: string
): Promise<void> => {
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
};

/**
 * Provisions a CloudShell session
 */
const provisionCloudShellSession = async (
  resolvedRegion: string,
  terminal: Terminal,
  vNetSettings: object,
  isAllPublicAccessEnabled: boolean
): Promise<{ socketUri?: string; provisionConsoleResponse?: any; targetUri?: string }> => {
  return new Promise( async (resolve, reject) => {
    try {

      terminal.writeln(terminalLog.header("Configuring CloudShell Session"));
      // Check if vNetSettings is available and not empty
      const hasVNetSettings = vNetSettings && Object.keys(vNetSettings).length > 0;
      if (hasVNetSettings) {
        const vNetConfig = vNetSettings as VnetSettings;
        const networkProfileId = vNetConfig.networkProfileResourceId;
        const profileName = networkProfileId.split('/').pop();
        
        terminal.writeln(terminalLog.vnet("Enabling private network configuration"));
        terminal.writeln(terminalLog.item("Network Profile", profileName));
        
        if (vNetConfig.relayNamespaceResourceId) {
          const relayName = vNetConfig.relayNamespaceResourceId.split('/').pop();
          terminal.writeln(terminalLog.item("Relay Namespace", relayName));
        }
              
        terminal.writeln(terminalLog.item("Region", resolvedRegion));
        terminal.writeln(terminalLog.success("CloudShell will use this VNet to connect to your database"));
      }
      else {
        terminal.writeln(terminalLog.warning("No VNet configuration provided"));
        terminal.writeln(terminalLog.warning("CloudShell will be provisioned with public network access"));

        if (!isAllPublicAccessEnabled) {
          terminal.writeln(terminalLog.error("Warning: Your database has network restrictions"));
          terminal.writeln(terminalLog.error("CloudShell may not be able to connect without proper VNet configuration"));
        }
      }
      terminal.writeln(terminalLog.warning("Any previous VNet settings will be overridden"));

       // Apply user settings
      await putEphemeralUserSettings(userContext.subscriptionId, resolvedRegion, vNetSettings);
      terminal.writeln(terminalLog.success("Session settings applied"));
      // Provision console
      let provisionConsoleResponse;
      let attemptCounter = 0;

      do {
        provisionConsoleResponse = await provisionConsole(userContext.subscriptionId, resolvedRegion);
        terminal.writeln(terminalLog.progress("Provisioning", provisionConsoleResponse.properties.provisioningState));
        
        attemptCounter++;

        if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
          await wait(POLLING_INTERVAL_MS);
        }
      } while (provisionConsoleResponse.properties.provisioningState !== "Succeeded" && attemptCounter < 10);

      if (provisionConsoleResponse.properties.provisioningState !== "Succeeded") {
        const errorMessage = `Provisioning failed: ${provisionConsoleResponse.properties.provisioningState}`;
        terminal.writeln(terminalLog.error(errorMessage));
        return reject(new Error(errorMessage));
      }
      // Connect terminal
      const connectTerminalResponse = await connectTerminal(
        provisionConsoleResponse.properties.uri,
        { rows: terminal.rows, cols: terminal.cols }
      );

      const targetUri = `${provisionConsoleResponse.properties.uri}/terminals?cols=${terminal.cols}&rows=${terminal.rows}&version=2019-01-01&shell=bash`;
      const termId = connectTerminalResponse.id;

      // Determine socket URI
      let socketUri = connectTerminalResponse.socketUri.replace(":443/", "");
      const targetUriBody = targetUri.replace('https://', '').split('?')[0];

      if (socketUri.indexOf(targetUriBody) === -1) {
        socketUri = `wss://${targetUriBody}/${termId}`;
      }

      if (targetUriBody.includes('servicebus')) {
        const targetUriBodyArr = targetUriBody.split('/');
        socketUri = `wss://${targetUriBodyArr[0]}/$hc/${targetUriBodyArr[1]}/terminals/${termId}`;
      }

      return resolve({ socketUri, provisionConsoleResponse, targetUri });
    } catch (err) {
      terminal.writeln(terminalLog.error(`Provisioning failed: ${err.message}`));
      return reject(err);
    }
  });
};

/**
 * Asks the user for consent to use the specified CloudShell region
 */
const askForRegionConsent = async (terminal: Terminal, resolvedRegion: string): Promise<boolean> => {
  terminal.writeln(terminalLog.header("CloudShell Region Confirmation"));
  terminal.writeln(terminalLog.info("The CloudShell container will be provisioned in a specific Azure region."));
  // Data residency and compliance information
  terminal.writeln(terminalLog.subheader("Important Information"));
  const dbRegion = userContext.databaseAccount?.location || "unknown";
  terminal.writeln(terminalLog.item("Database Region", dbRegion));
  terminal.writeln(terminalLog.item("CloudShell Container Region", resolvedRegion));

  terminal.writeln(terminalLog.subheader("What this means to you?"));
  terminal.writeln(terminalLog.item("Data Residency", "Commands and query results will be processed in this region"));
  terminal.writeln(terminalLog.item("Network", "Database connections will originate from this region"));

  // Consent question
  terminal.writeln("");
  terminal.writeln(terminalLog.prompt("Would you like to provision Azure CloudShell in the '" + resolvedRegion + "' region?"));
  terminal.writeln(terminalLog.prompt("Press 'Y' to continue or 'N' to cancel (Y/N)"));

  return new Promise<boolean>((resolve) => {
    const keyListener = terminal.onKey(({ key }: { key: string }) => {
      keyListener.dispose();
      terminal.writeln("");

      if (key.toLowerCase() === 'y') {
        terminal.writeln(terminalLog.success("Proceeding with CloudShell in " + resolvedRegion));
        terminal.writeln(terminalLog.separator());
        resolve(true);
      } else {
        terminal.writeln(terminalLog.error("CloudShell provisioning canceled"));
        setTimeout(() => terminal.dispose(), 2000);
        resolve(false);
      }
    });
  });
};

/**
 * Establishes a terminal connection via WebSocket
 */
const establishTerminalConnection = async (
  terminal: Terminal,
  shellType: TerminalKind,
  socketUri: string,
  provisionConsoleResponse: any,
  targetUri: string
): Promise<WebSocket> => {
  let socket = new WebSocket(socketUri);

  // Get database keys if available
  const dbName = userContext.databaseAccount.name;
  let keys;
  if (dbName) {
    keys = await listKeys(userContext.subscriptionId, userContext.resourceGroup, dbName);
  }

  // Configure the socket
  const initCommands = getCommands(shellType, keys?.primaryMasterKey);
  socket = configureSocketConnection(socket, socketUri, terminal, initCommands, 0);

  // Attach the terminal addon
  const attachAddon = new AttachAddon(socket);
  terminal.loadAddon(attachAddon);
  terminal.writeln(terminalLog.success("Connection established"));

  // Authorize the session
  try {
    const authorizeResponse = await authorizeSession(provisionConsoleResponse.properties.uri);
    const cookieToken = authorizeResponse.token;

    // Load auth token with a hidden image
    const img = document.createElement("img");
    img.src = `${targetUri}&token=${encodeURIComponent(cookieToken)}`;
    terminal.focus();
  } catch (err) {
    terminal.writeln(terminalLog.error("Authorization failed"));
    socket.close();
    throw err;
  }

  return socket;
};

/**
 * Configures a WebSocket connection for the terminal
 */
const configureSocketConnection = (
  socket: WebSocket,
  uri: string,
  terminal: Terminal,
  initCommands: string,
  socketRetryCount: number
): WebSocket => {
  let jsonData = '';
  let keepAliveID: NodeJS.Timeout = null;
  let pingCount = 0;

  sendTerminalStartupCommands(socket, initCommands);

  socket.onclose = () => {
    if (keepAliveID) {
      clearTimeout(keepAliveID);
      pingCount = 0;
    }
    terminal.writeln(terminalLog.warning("Session terminated. Refresh the page to start a new session."));
  };

  socket.onerror = () => {
    if (socketRetryCount < MAX_RETRY_COUNT && socket.readyState !== WebSocket.CLOSED) {
      configureSocketConnection(socket, uri, terminal, initCommands, socketRetryCount + 1);
    } else {
      socket.close();
    }
  };

  socket.onmessage = (event: MessageEvent<string>) => {
    pingCount = 0; // Reset ping count on message receipt

    let eventData = '';
    if (typeof event.data === "object") {
      try {
        const enc = new TextDecoder("utf-8");
        eventData = enc.decode(event.data as any);
      } catch (e) {
        // Not an array buffer, ignore
      }
    }

    if (typeof event.data === 'string') {
      eventData = event.data;
    }

    // Process event data
    if (eventData.includes("ie_us") && eventData.includes("ie_ue")) {
      const statusData = eventData.split('ie_us')[1].split('ie_ue')[0];
      console.log(statusData);
    } else if (eventData.includes("ie_us")) {
      jsonData += eventData.split('ie_us')[1];
    } else if (eventData.includes("ie_ue")) {
      jsonData += eventData.split('ie_ue')[0];
      console.log(jsonData);
      jsonData = '';
    } else if (jsonData.length > 0) {
      jsonData += eventData;
    }
  };

  return socket;
};

/**
 * Sends startup commands to the terminal
 */
const sendTerminalStartupCommands = (socket: WebSocket, initCommands: string): void => {
  let keepAliveID: NodeJS.Timeout = null;
  let pingCount = 0;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(initCommands);
  } else {
    socket.onopen = () => {
      socket.send(initCommands);

      const keepSocketAlive = (socket: WebSocket) => {
        if (socket.readyState === WebSocket.OPEN) {
          if (pingCount >= MAX_PING_COUNT) {
            socket.close();
          } else {
            socket.send('');
            pingCount++;
            keepAliveID = setTimeout(() => keepSocketAlive(socket), 1000);
          }
        }
      };

      keepSocketAlive(socket);
    };
  }
};

/**
 * Utility function to ask a question in the terminal
 */
const askQuestion = (terminal: Terminal, question: string, defaultAnswer: string = ""): Promise<string> => {
  return new Promise<string>((resolve) => {
    const prompt = terminalLog.prompt(`${question} (${defaultAnswer}): `);
    terminal.writeln(prompt);
    terminal.focus();
    let response = "";

    const dataListener = terminal.onData((data: string) => {
      if (data === "\r") { // Enter key pressed
        terminal.writeln(""); // Move to a new line
        dataListener.dispose();
        if (response.trim() === "") {
          response = defaultAnswer; // Use default answer if no input
        }
        return resolve(response.trim());
      } else if (data === "\u007F" || data === "\b") { // Handle backspace
        if (response.length > 0) {
          response = response.slice(0, -1);
          terminal.write("\x1B[D \x1B[D"); // Move cursor back, clear character
        }
      } else if (data.charCodeAt(0) >= 32) { // Ignore control characters
        response += data;
        terminal.write(data); // Display typed characters
      }
    });

    // Prevent cursor movement beyond the prompt
    terminal.onKey(({ domEvent }: { domEvent: KeyboardEvent }) => {
      if (domEvent.key === "ArrowLeft" && response.length === 0) {
        domEvent.preventDefault(); // Stop moving left beyond the question
      }
    });
  });
};

/**
 * Utility function to wait for a specified duration
 */
const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));