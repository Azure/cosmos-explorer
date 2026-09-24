import { FullTextPolicy } from "Contracts/DataModels";
import {
  fullTextLanguages,
  getFullTextDefaultLanguage,
  getStopwordPresets,
  getStopwordValidationError,
  inheritFullTextPathAnalysis,
  isFullTextPolicyValid,
  isSupportedFullTextPolicy,
  setFullTextDefaultLanguage,
} from "./FullTextPolicyUtils";

describe("full-text policy helpers", () => {
  const policy: FullTextPolicy = {
    package: "standard",
    defaultSpec: { language: "en-US", stopWordListKind: "basic", filters: ["lowercase", "stop"] },
    fullTextPaths: [{ path: "/text" }],
  };

  it("lists exactly the seven verified locale choices", () => {
    expect(fullTextLanguages.map(({ value }) => value)).toEqual([
      "en-US",
      "fr-FR",
      "de-DE",
      "es-ES",
      "it-IT",
      "pt-PT",
      "pt-BR",
    ]);
  });

  it("resolves defaults without changing the wire policy", () => {
    expect(getFullTextDefaultLanguage({ fullTextPaths: [] })).toBe("en-US");
    expect(getFullTextDefaultLanguage({ defaultLanguage: "fr-FR", fullTextPaths: [] })).toBe("fr-FR");
    expect(getFullTextDefaultLanguage({ ...policy, defaultLanguage: "fr-FR" })).toBe("en-US");
  });

  it.each<[string | undefined, string, string[]]>([
    [undefined, "en-US", ["none", "extended"]],
    ["legacy", "1033", ["none", "extended"]],
    ["legacy", "fr-FR", ["none"]],
    ["standard", "en-US", ["none", "basic"]],
    ["standard", "fr-FR", ["none", "basic"]],
    ["future", "en-US", []],
  ])("uses package/language-specific presets for %s / %s", (packageName, language, expected) => {
    expect(getStopwordPresets(packageName, language)).toEqual(expected);
  });

  it("preserves unknown fields and does not introduce a legacy defaultLanguage into a modern policy", () => {
    const original: FullTextPolicy = {
      ...policy,
      futurePolicySetting: { enabled: true },
      defaultSpec: { ...policy.defaultSpec, futureAnalysisSetting: ["unchanged"] },
    };
    const changed = setFullTextDefaultLanguage(original, "fr-FR");
    expect(changed).toEqual({
      ...original,
      defaultSpec: { ...original.defaultSpec, language: "fr-FR" },
    });
    expect(changed.defaultLanguage).toBeUndefined();
    expect(original.defaultSpec?.language).toBe("en-US");
  });

  it("keeps both language fields consistent when the service returned both", () => {
    const changed = setFullTextDefaultLanguage({ ...policy, defaultLanguage: "en-US" }, "de-DE");
    expect(changed.defaultLanguage).toBe("de-DE");
    expect(changed.defaultSpec?.language).toBe("de-DE");
  });

  it("resets only language/stopword overrides while preserving other analysis settings", () => {
    const path = {
      path: "/text",
      language: "fr-FR",
      stopWordListKind: "none",
      addStopWords: ["cosmos"],
      removeStopWords: ["the"],
      tokenizer: "word",
      filters: ["lowercase", "stop"],
      futureSetting: { value: 1 },
    };
    expect(inheritFullTextPathAnalysis(path)).toEqual({
      path: "/text",
      tokenizer: "word",
      filters: ["lowercase", "stop"],
      futureSetting: { value: 1 },
    });
    expect(path.addStopWords).toEqual(["cosmos"]);
  });

  it("requires explicit language and preset when custom lists are supplied, including empty lists", () => {
    expect(getStopwordValidationError({ addStopWords: [] }, "standard")).toBe("languageRequired");
    expect(getStopwordValidationError({ language: "en-US", removeStopWords: [] }, "standard")).toBe("presetRequired");
    expect(
      getStopwordValidationError({ language: "en-US", stopWordListKind: "none", addStopWords: [] }, "standard"),
    ).toBeUndefined();
    expect(getStopwordValidationError({ language: "fr-FR", stopWordListKind: "extended" }, "legacy")).toBe(
      "invalidPreset",
    );
  });

  it.each(["two words", "word-word", "can't", "C++", "$money", "a\tb", "a\u0000b", "a\u2014b"])(
    "rejects a custom word containing a forbidden character: %s",
    (word) => {
      expect(
        getStopwordValidationError({ language: "en-US", stopWordListKind: "none", addStopWords: [word] }, "standard"),
      ).toBe("invalidWord");
    },
  );

  it("does not silently normalize or impose an invented count limit on custom words", () => {
    const words = ["Cosmos", "cosmos", "caf\u00e9", "", ...Array.from({ length: 1001 }, (_, i) => `word${i}`)];
    const spec = { language: "en-US", stopWordListKind: "basic", addStopWords: words, removeStopWords: ["Cosmos"] };
    expect(getStopwordValidationError(spec, "standard")).toBeUndefined();
    expect(spec.addStopWords).toBe(words);
    expect(spec.removeStopWords).toEqual(["Cosmos"]);
  });

  it("validates paths and their overrides separately from container defaults", () => {
    expect(isFullTextPolicyValid(policy)).toBe(true);
    expect(isFullTextPolicyValid({ ...policy, fullTextPaths: [{ path: "" }] })).toBe(false);
    expect(isFullTextPolicyValid({ ...policy, fullTextPaths: [{ path: "/text" }, { path: "/text" }] })).toBe(false);
    expect(
      isFullTextPolicyValid({
        ...policy,
        fullTextPaths: [{ path: "/text", language: "en-US", addStopWords: ["extra"] }],
      }),
    ).toBe(false);
  });

  it.each([
    { ...policy, package: "future" },
    { ...policy, defaultSpec: { language: "en-US", stopWordListKind: "future" } },
    { ...policy, defaultSpec: { language: "japanese" } },
    { ...policy, defaultSpec: { language: "en-US", tokenizer: "future" } },
    { ...policy, defaultSpec: { language: "en-US", filters: ["future"] } },
  ])("marks future analysis read-only without blocking an unrelated save", (futurePolicy) => {
    expect(isSupportedFullTextPolicy(futurePolicy)).toBe(false);
    expect(isFullTextPolicyValid(futurePolicy)).toBe(true);
  });
});
