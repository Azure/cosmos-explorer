import Immutable from "immutable";
import * as monaco from "./monaco";
/**
 * Code Mirror to Monaco constants.
 */
export enum Mode {
  markdown = "markdown",
  raw = "plaintext",
  python = "python",
  csharp = "csharp"
}

/**
 * Maps Code Mirror mode to a valid Monaco Editor supported langauge
 * defaults to plaintext if map not found.
 * @param mode Code Mirror mode
 * @returns Monaco language
 */
export function mapCodeMirrorModeToMonaco(mode: string | { name: string }): string {
  let language = "";

  // Parse codemirror mode object
  if (typeof mode === "string") {
    language = mode;
  }
  // Vanilla object
  else if (typeof mode === "object" && mode.name) {
    language = mode.name;
  }
  // Immutable Map
  else if (Immutable.Map.isMap(mode) && mode.has("name")) {
    language = mode.get("name");
  }

  // Need to handle "ipython" as a special case since it is not a registered language
  if (language === "ipython") {
    return Mode.python;
  } else if (language === "text/x-csharp") {
    return Mode.csharp;
  } else if (monaco.languages.getEncodedLanguageId(language) > 0) {
    return language;
  }
  return Mode.raw;
}
