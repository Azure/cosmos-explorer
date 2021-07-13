import { StorageKey } from "./StorageUtility";
import * as StringUtility from "./StringUtility";

export const hasItem = (key: StorageKey): boolean => !!sessionStorage.getItem(StorageKey[key]);

export const getEntryString = (key: StorageKey): string | null => sessionStorage.getItem(StorageKey[key]);

export const getEntryNumber = (key: StorageKey): number =>
  StringUtility.toNumber(sessionStorage.getItem(StorageKey[key]));

export const getEntry = (key: string): string | null => sessionStorage.getItem(key);

export const removeEntry = (key: StorageKey): void => sessionStorage.removeItem(StorageKey[key]);

export const setEntryString = (key: StorageKey, value: string): void => sessionStorage.setItem(StorageKey[key], value);

export const setEntry = (key: string, value: string): void => sessionStorage.setItem(key, value);

export const setEntryNumber = (key: StorageKey, value: number): void =>
  sessionStorage.setItem(StorageKey[key], value.toString());
