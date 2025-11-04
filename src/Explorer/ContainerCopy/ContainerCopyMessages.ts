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

  // Copy Job Details
  copyJobDetailsPanelTitle: (jobName: string) => jobName || "Job Details",
  errorTitle: "Error Details",
  selectedContainers: "Selected Containers",

  // Create Copy Job Panel
  createCopyJobPanelTitle: "Create copy job",

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
      "To copy data from the source to the destination container, ensure that the managed identity of the destination account has read access to the source account by completing the following steps.",
  },
  toggleBtn: {
    onText: "On",
    offText: "Off",
  },
  addManagedIdentity: {
    title: "System-assigned managed identity enabled.",
    description:
      "A system-assigned managed identity is restricted to one per resource and is tied to the lifecycle of this resource. Once enabled, you can grant permissions to the managed identity by using Azure role-based access control (Azure RBAC). The managed identity is authenticated with Microsoft Entra ID, so you don’t have to store any credentials in code.",
    descriptionHrefText: "Learn more about Managed identities.",
    descriptionHref: "https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview",
    toggleLabel: "System assigned managed identity",
    tooltip: {
      content: "Learn more about",
      hrefText: "Managed Identities.",
      href: "https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview",
    },
    userAssignedIdentityTooltip: "You can select an existing user assigned identity or create a new one.",
    userAssignedIdentityLabel: "You may also select a user assigned managed identity.",
    createUserAssignedIdentityLink: "Create User Assigned Managed Identity",
    enablementTitle: "Enable system assigned managed identity",
    enablementDescription: (accountName: string) =>
      accountName
        ? `Enable system-assigned managed identity on the ${accountName}. To confirm, click the "Yes" button. `
        : "",
  },
  defaultManagedIdentity: {
    title: "System-assigned managed identity set as default.",
    description: (accountName: string) =>
      `Set the system-assigned managed identity as default for "${accountName}" by switching it on.`,
    tooltip: {
      content: "Learn more about",
      hrefText: "Default Managed Identities.",
      href: "https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview",
    },
    popoverTitle: "System assigned managed identity set as default",
    popoverDescription: (accountName: string) =>
      `Assign the system-assigned managed identity as the default for "${accountName}". To confirm, click the "Yes" button. `,
  },
  readPermissionAssigned: {
    title: "Read permissions assigned to the default identity.",
    description:
      "To allow data copy from source to the destination container, provide read access of the source account to the default identity of the destination account.",
    tooltip: {
      content: "Learn more about",
      hrefText: "Read permissions.",
      href: "https://learn.microsoft.com/azure/cosmos-db/nosql/how-to-connect-role-based-access-control",
    },
    popoverTitle: "Read permissions assigned to default identity.",
    popoverDescription:
      "Assign read permissions of the source account to the default identity of the destination account. To confirm click the “Yes” button. ",
  },
  pointInTimeRestore: {
    title: "Point In Time Restore enabled",
    description: (accessName: string) =>
      `To facilitate online container copy jobs, please update your "${accessName}" backup policy from periodic to continuous backup. Enabling continuous backup is required for this functionality.`,
    tooltip: {
      content: "Learn more about",
      hrefText: "Continuous Backup",
      href: "https://learn.microsoft.com/en-us/azure/cosmos-db/continuous-backup-restore-introduction",
    },
    buttonText: "Enable Point In Time Restore",
  },
  onlineCopyEnabled: {
    title: "Online copy enabled",
    description: (accountName: string) => `Use Azure CLI to enable Online copy on "${accountName}".`,
    hrefText: "Learn more about online copy jobs",
    href: "https://learn.microsoft.com/en-us/azure/cosmos-db/container-copy?tabs=online-copy&pivots=api-nosql#enable-online-copy",
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
