import { StringUtility } from "./StringUtility";

export class LocalStorageUtility {
  public static hasItem(key: StorageKey): boolean {
    return !!localStorage.getItem(StorageKey[key]);
  }

  public static getEntryString(key: StorageKey): string | null {
    return localStorage.getItem(StorageKey[key]);
  }

  public static getEntryNumber(key: StorageKey): number {
    return StringUtility.toNumber(localStorage.getItem(StorageKey[key]));
  }

  public static getEntryBoolean(key: StorageKey): boolean {
    return StringUtility.toBoolean(localStorage.getItem(StorageKey[key]));
  }

  public static setEntryString(key: StorageKey, value: string): void {
    localStorage.setItem(StorageKey[key], value);
  }

  public static removeEntry(key: StorageKey): void {
    return localStorage.removeItem(StorageKey[key]);
  }

  public static setEntryNumber(key: StorageKey, value: number): void {
    localStorage.setItem(StorageKey[key], value.toString());
  }

  public static setEntryBoolean(key: StorageKey, value: boolean): void {
    localStorage.setItem(StorageKey[key], value.toString());
  }
}

export class SessionStorageUtility {
  public static hasItem(key: StorageKey): boolean {
    return !!sessionStorage.getItem(StorageKey[key]);
  }

  public static getEntryString(key: StorageKey): string | null {
    return sessionStorage.getItem(StorageKey[key]);
  }

  public static getEntryNumber(key: StorageKey): number {
    return StringUtility.toNumber(localStorage.getItem(StorageKey[key]));
  }

  public static removeEntry(key: StorageKey): void {
    return sessionStorage.removeItem(StorageKey[key]);
  }

  public static setEntryString(key: StorageKey, value: string): void {
    sessionStorage.setItem(StorageKey[key], value);
  }

  public static setEntryNumber(key: StorageKey, value: number): void {
    sessionStorage.setItem(StorageKey[key], value.toString());
  }
}

export enum StorageKey {
  ActualItemPerPage,
  CustomItemPerPage,
  DatabaseAccountId,
  EncryptedKeyToken,
  IsCrossPartitionQueryEnabled,
  MaxDegreeOfParellism,
  IsGraphAutoVizDisabled,
  TenantId,
  MostRecentActivity,
  SetPartitionKeyUndefined,
  GalleryCalloutDismissed
}
