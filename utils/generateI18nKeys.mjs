/**
 * Generates src/Localization/Keys.generated.ts from en/Resources.json.
 *
 * Every leaf value becomes its dot-notation key path, with JSDoc annotations
 * showing the English translation so developers see real text on hover.
 *
 * Libraries:
 *   - values-to-keys   — replaces translation values with dot-path keys
 *   - i18next-resources-for-ts (json2ts) — serialises objects as typed `as const` TS
 *
 * Usage:  node utils/generateI18nKeys.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { json2ts } from "i18next-resources-for-ts";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { replace } from "values-to-keys";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const INPUT = resolve(ROOT, "src/Localization/en/Resources.json");
const OUTPUT = resolve(ROOT, "src/Localization/Keys.generated.ts");

// ── helpers ────────────────────────────────────────────────────────

/**
 * Walk two parallel objects (keyed + original) and produce TS source
 * with JSDoc comments showing the English value at every leaf.
 */
function serialiseWithJSDoc(obj, orig, indent = 2) {
  const pad = " ".repeat(indent);
  const lines = ["{"];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const origVal = orig[key];
    if (typeof val === "object" && val !== null) {
      lines.push(`${pad}${key}: ${serialiseWithJSDoc(val, origVal, indent + 2)},`);
    } else {
      lines.push(`${pad}/** ${origVal} */`);
      lines.push(`${pad}${key}: ${JSON.stringify(val)},`);
    }
  }
  lines.push(`${" ".repeat(Math.max(0, indent - 2))}}`);
  return lines.join("\n");
}

// ── main ───────────────────────────────────────────────────────────

// Keep the original English values for JSDoc annotations
const original = JSON.parse(readFileSync(INPUT, "utf-8"));

// Use values-to-keys to replace every leaf value with its dot-path key
const keyed = replace(JSON.parse(readFileSync(INPUT, "utf-8")));

// Use json2ts to verify the shape is valid for `as const` export
// (We still use our own serialiser because json2ts doesn't add JSDoc comments)
json2ts(keyed); // validates structure; throws on malformed input

const banner = `\
// -----------------------------------------------------------------
// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND
// Regenerate with:  npm run generate:i18n-keys
// -----------------------------------------------------------------
`;

const body = `export const Keys = ${serialiseWithJSDoc(keyed, original)} as const;\n`;

writeFileSync(OUTPUT, banner + body, "utf-8");
// eslint-disable-next-line no-console
console.log(`Generated ${OUTPUT}`);
