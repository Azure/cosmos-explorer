import i18n from "../i18n";
import type enResources from "./en/Resources.json";

/**
 * Derives a union of all dot-notation key paths from a nested JSON object type.
 * e.g. { buttons: { save: "Save" } } → "buttons.save"
 */
type NestedKeyOf<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? NestedKeyOf<T[K], P extends "" ? K : `${P}.${K}`>
    : P extends ""
    ? K
    : `${P}.${K}`;
}[keyof T & string];

/** All valid translation keys derived from en/Resources.json */
export type ResourceKey = NestedKeyOf<typeof enResources>;

/**
 * Type-safe translation function bound to the "Resources" namespace.
 * Use this everywhere—class components, functional components, and non-React code.
 */
export const t = (key: ResourceKey, options?: Record<string, unknown>): string =>
  (i18n.t as (key: string, options?: unknown) => string)(key, { ns: "Resources", ...options });
