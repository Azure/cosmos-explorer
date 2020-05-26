// TODO: Should be owned by parent iframe
export enum PlatformType {
  // RuntimeProxy and MongoEmulator no longer used, but kept here to preserve enum structure
  RuntimeProxy,
  MongoEmulator,

  Hosted,
  Emulator,
  Portal
}
