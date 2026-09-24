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

  describe("complete supported language and stopword policy matrix", () => {
    it.each(fullTextLanguages)("$value and $legacyId expose only their supported presets", ({ value, legacyId }) => {
      for (const language of [value, legacyId]) {
        expect(getStopwordPresets("standard", language)).toEqual(["none", "basic"]);
        const expectedLegacy = value === "en-US" ? ["none", "extended"] : ["none"];
        expect(getStopwordPresets("legacy", language)).toEqual(expectedLegacy);
        expect(getStopwordPresets(undefined, language)).toEqual(expectedLegacy);
        for (const packageName of ["standard", "legacy", undefined]) {
          for (const preset of ["none", "basic", "extended"]) {
            const valid = packageName === "standard" ? preset !== "extended" : expectedLegacy.includes(preset);
            const spec = {
              language,
              stopWordListKind: preset,
              addStopWords: ["catalog", "Catalog", "catalog", "caf\u00e9"],
            };
            expect(getStopwordValidationError(spec, packageName)).toBe(valid ? undefined : "invalidPreset");
          }
        }
      }
    });

    const transitions = fullTextLanguages.flatMap((from) =>
      fullTextLanguages.map((to) => ({ from: from.value, to: to.value })),
    );
    it.each(transitions)("$from -> $to preserves explicit path overrides and unknown fields", ({ from, to }) => {
      const paths = [
        { path: "/inherited" },
        { path: "/override", language: from, stopWordListKind: "none", addStopWords: ["Original", "original"] },
      ];
      for (const shape of ["legacy", "modern", "both"]) {
        const original: FullTextPolicy = {
          ...(shape !== "modern" ? { defaultLanguage: from } : {}),
          ...(shape !== "legacy"
            ? {
                package: "standard",
                defaultSpec: {
                  language: from,
                  stopWordListKind: "none",
                  addStopWords: ["keep", "Keep", "keep"],
                  tokenizer: "word",
                  filters: ["lowercase", "stop"],
                  future: { preserved: true },
                },
              }
            : {}),
          fullTextPaths: paths,
          futurePolicy: { preserved: true },
        };
        const changed = setFullTextDefaultLanguage(original, to);
        expect(getFullTextDefaultLanguage(changed)).toBe(to);
        expect(changed.fullTextPaths).toEqual(paths);
        expect(changed.futurePolicy).toEqual({ preserved: true });
        expect(getFullTextDefaultLanguage(original)).toBe(from);
        expect(changed.defaultLanguage).toBe(shape === "modern" ? undefined : to);
        expect(changed.defaultSpec).toEqual(shape === "legacy" ? undefined : { ...original.defaultSpec, language: to });
        expect(isFullTextPolicyValid(changed)).toBe(true);
      }
    });

    const listCases = fullTextLanguages.flatMap(({ value }) =>
      [0, 1, 5, 20, 100, 1001].map((count) => ({ language: value, count })),
    );
    it.each(listCases)("$language preserves $count custom words without an invented cap", ({ language, count }) => {
      const words = Array.from(
        { length: count },
        (_, index) => ["catalog", "Catalog", "caf\u00e9", "catalog"][index % 4],
      );
      for (const field of ["addStopWords", "removeStopWords"] as const) {
        const spec = { language, stopWordListKind: "none", [field]: words };
        expect(getStopwordValidationError(spec, "standard")).toBeUndefined();
        expect(getStopwordValidationError(spec, "legacy")).toBeUndefined();
        expect(spec[field]).toBe(words);
      }
    });

    const forbidden = [
      "two words",
      "a\tb",
      "a\nb",
      "a\rb",
      "a\u00a0b",
      "a\u0000b",
      "a\u007fb",
      "a-b",
      "can't",
      "a\u2019b",
      "a\u2014b",
      "a/b",
      "a,b",
      "a.b",
      "C++",
      "$value",
      "a_b",
      "a:b",
    ];
    it.each(fullTextLanguages)("$value rejects forbidden characters anywhere in either list", ({ value: language }) => {
      for (const field of ["addStopWords", "removeStopWords"] as const) {
        for (const invalid of forbidden) {
          const words = Array.from({ length: 20 }, () => "valid");
          words[18] = invalid;
          expect(getStopwordValidationError({ language, stopWordListKind: "none", [field]: words }, "standard")).toBe(
            "invalidWord",
          );
        }
        expect(getStopwordValidationError({ language, [field]: [] }, "standard")).toBe("presetRequired");
        expect(getStopwordValidationError({ stopWordListKind: "none", [field]: ["valid"] }, "standard")).toBe(
          "languageRequired",
        );
      }
    });

    it.each(fullTextLanguages)(
      "$value removes only explicit stopword overrides when inheriting",
      ({ value: language }) => {
        const path = {
          path: "/text",
          language,
          stopWordListKind: "none",
          addStopWords: ["one", "two"],
          removeStopWords: ["three"],
          tokenizer: "word",
          filters: ["lowercase", "stop"],
          future: { unchanged: true },
        };
        expect(inheritFullTextPathAnalysis(path)).toEqual({
          path: "/text",
          tokenizer: "word",
          filters: ["lowercase", "stop"],
          future: { unchanged: true },
        });
        expect(path.addStopWords).toEqual(["one", "two"]);
      },
    );
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
