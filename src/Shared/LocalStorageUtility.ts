import { StorageKey } from "./StorageUtility";
import * as StringUtility from "./StringUtility";

export const hasItem = (key: StorageKey): boolean => !!localStorage.getItem(StorageKey[key]);

export const getEntryString = (key: StorageKey): string | null => localStorage.getItem(StorageKey[key]);

export const getEntryNumber = (key: StorageKey): number =>
  StringUtility.toNumber(localStorage.getItem(StorageKey[key]));

export const getEntryBoolean = (key: StorageKey): boolean =>
  StringUtility.toBoolean(localStorage.getItem(StorageKey[key]));

export const setEntryString = (key: StorageKey, value: string): void => localStorage.setItem(StorageKey[key], value);

export const removeEntry = (key: StorageKey): void => localStorage.removeItem(StorageKey[key]);

export const setEntryNumber = (key: StorageKey, value: number): void =>
  localStorage.setItem(StorageKey[key], value.toString());

export const setEntryBoolean = (key: StorageKey, value: boolean): void =>
  localStorage.setItem(StorageKey[key], value.toString());

export const setEntryObject = (key: StorageKey, value: unknown): void => {
  localStorage.setItem(StorageKey[key], JSON.stringify(value));
};
export const getEntryObject = <T>(key: StorageKey): T | null => {
  const item = localStorage.getItem(StorageKey[key]);
  if (item) {
    return JSON.parse(item) as T;
  }
  return null;
};
