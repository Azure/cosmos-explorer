export default {
  // Copy Job Command Bar
  feedbackButtonLabel: "Feedback",
  feedbackButtonAriaLabel: "Provide feedback on copy jobs",
  refreshButtonLabel: "Refresh",
  refreshButtonAriaLabel: "Refresh copy jobs",
  createCopyJobButtonLabel: "Create Copy Job",
  createCopyJobButtonAriaLabel: "Create a new container copy job",

  // No Copy Jobs Found
  noCopyJobsTitle: "No copy jobs to show",
  createCopyJobButtonText: "Create a container copy job",

  // Create Copy Job Panel
  createCopyJobPanelTitle: "Copy container",

  // Select Account Screen
  selectAccountDescription: "Please select a source account from which to copy.",
  subscriptionDropdownLabel: "Subscription",
  subscriptionDropdownPlaceholder: "Select a subscription",
  sourceAccountDropdownLabel: "Account",
  sourceAccountDropdownPlaceholder: "Select an account",
  migrationTypeCheckboxLabel: "Copy container in offline mode",

  // Select Source and Target Containers Screen
  selectSourceAndTargetContainersDescription:
    "Please select a source container and a destination container to copy to.",
  sourceContainerSubHeading: "Source container",
  targetContainerSubHeading: "Destination container",
  databaseDropdownLabel: "Database",
  databaseDropdownPlaceholder: "Select a database",
  containerDropdownLabel: "Container",
  containerDropdownPlaceholder: "Select a container",

  // Preview and Create Screen
  jobNameLabel: "Job name",
  sourceSubscriptionLabel: "Source subscription",
  sourceAccountLabel: "Source account",
  sourceDatabaseLabel: "Source database",
  sourceContainerLabel: "Source container",
  targetDatabaseLabel: "Destination database",
  targetContainerLabel: "Destination container",

  // Assign Permissions Screen
  assignPermissions: {
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  toggleBtn: {
    onText: "On",
    offText: "Off",
  },
  addManagedIdentity: {
    title: "System assigned managed identity enabled",
    description:
      "Enable a system assigned managed identity for the destination account to allow the copy job to access it.",
    toggleLabel: "System assigned managed identity",
    managedIdentityTooltip:
      "A system assigned managed identity is restricted to one per resource and is tied to the lifecycle of this resource. You can grant permissions to the managed identity by using Azure role-based access control (Azure RBAC). The managed identity is authenticated with Microsoft Entra ID, so you don't have to store any credentials in code.",
    userAssignedIdentityTooltip: "You can select an existing user assigned identity or create a new one.",
    userAssignedIdentityLabel: "You may also select a user assigned managed identity.",
    createUserAssignedIdentityLink: "Create User Assigned Managed Identity",
    enablementTitle: "Enable system assigned managed identity",
    enablementDescription: (identityName: string) =>
      identityName
        ? `'${identityName}' will be registered with Microsoft Entra ID. Once it is registered, '${identityName}' can be granted permissions to access resources protected by Microsoft Entra ID. Do you want to enable the system assigned managed identity for '${identityName}'?`
        : "",
  },
  defaultManagedIdentity: {
    title: "System assigned managed identity enabled as default",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tooltip:
      "A system assigned managed identity is restricted to one per resource and is tied to the lifecycle of this resource. You can grant permissions to the managed identity by using Azure role-based access control (Azure RBAC). The managed identity is authenticated with Microsoft Entra ID, so you don't have to store any credentials in code.",
    popoverTitle: "System assigned managed identity set as default",
    popoverDescription:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
  },
  readPermissionAssigned: {
    title: "Read permission assigned to default identity",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tooltip:
      "A system assigned managed identity is restricted to one per resource and is tied to the lifecycle of this resource. You can grant permissions to the managed identity by using Azure role-based access control (Azure RBAC). The managed identity is authenticated with Microsoft Entra ID, so you don't have to store any credentials in code.",
    popoverTitle: "Read permission assigned to default identity",
    popoverDescription:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
  },
  pointInTimeRestore: {
    title: "Point In Time Restore enabled",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    buttonText: "Enable Point In Time Restore",
  },
  onlineCopyEnabled: {
    title: "Online copy enabled",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    buttonText: "Enable Online Copy",
  },
  MonitorJobs: {
    Columns: {
      lastUpdatedTime: "Date & time",
      name: "Job name",
      status: "Status",
      completionPercentage: "Completion %",
      duration: "Duration",
      error: "Error message",
      mode: "Mode",
      actions: "Actions",
    },
    Actions: {
      pause: "Pause",
      resume: "Resume",
      cancel: "Cancel",
      complete: "Complete",
      viewDetails: "View Details",
    },
    Status: {
      Pending: "Pending",
      InProgress: "In Progress",
      Running: "In Progress",
      Partitioning: "In Progress",
      Paused: "Paused",
      Completed: "Completed",
      Failed: "Failed",
      Faulted: "Failed",
      Skipped: "Cancelled",
      Cancelled: "Cancelled",
    },
  },
};
