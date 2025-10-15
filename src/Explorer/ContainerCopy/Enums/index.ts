export enum CopyJobMigrationType {
    Offline = "offline",
    Online = "online",
}

// all checks will happen 
export enum IdentityType {
    SystemAssigned = "systemassigned", // "SystemAssigned"
    UserAssigned = "userassigned", // "UserAssigned"
    None = "none", // "None"
}

export enum DefaultIdentityType {
    SystemAssignedIdentity = "systemassignedidentity", // "SystemAssignedIdentity"
}

export enum BackupPolicyType {
    Continuous = "Continuous",
    Periodic = "Periodic",
}

export enum CopyJobMigrationStatus {
    Pause = "Pause",
    Resume = "Resume",
    Cancel = "Cancel",
}