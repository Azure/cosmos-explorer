export enum CopyJobMigrationType {
  Offline = "offline",
  Online = "online",
}

export enum IdentityType {
  SystemAssigned = "systemassigned",
  UserAssigned = "userassigned",
  None = "none",
}

export enum DefaultIdentityType {
  SystemAssignedIdentity = "systemassignedidentity",
}

export enum BackupPolicyType {
  Continuous = "Continuous",
  Periodic = "Periodic",
}

export enum CopyJobStatusType {
  Pending = "Pending",
  InProgress = "InProgress",
  Running = "Running",
  Partitioning = "Partitioning",
  Paused = "Paused",
  Skipped = "Skipped",
  Completed = "Completed",
  Cancelled = "Cancelled",
  Failed = "Failed",
  Faulted = "Faulted",
}

export enum CopyJobActions {
  pause = "pause",
  resume = "resume",
  cancel = "cancel",
  complete = "complete",
}
