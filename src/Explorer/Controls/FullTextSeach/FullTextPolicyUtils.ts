import { FullTextAnalysisSpec, FullTextPolicy } from "Contracts/DataModels";

export type StopwordValidationError = "languageRequired" | "presetRequired" | "invalidPreset" | "invalidWord";

export const fullTextLanguages = [
  { value: "en-US", legacyId: "1033", label: "english" },
  { value: "fr-FR", legacyId: "1036", label: "french" },
  { value: "de-DE", legacyId: "1031", label: "german" },
  { value: "es-ES", legacyId: "3082", label: "spanish" },
  { value: "it-IT", legacyId: "1040", label: "italian" },
  { value: "pt-PT", legacyId: "2070", label: "portuguesePortugal" },
  { value: "pt-BR", legacyId: "1046", label: "portugueseBrazil" },
] as const;

export const getFullTextDefaultLanguage = (policy: FullTextPolicy): string =>
  policy.defaultSpec?.language ?? policy.defaultLanguage ?? "en-US";

export const getStopwordPresets = (packageName: string | undefined, language: string): string[] => {
  if (packageName === "standard") {
    return ["none", "basic"];
  }
  if (packageName === undefined || packageName === "legacy") {
    return language === "en-US" || language === "1033" ? ["none", "extended"] : ["none"];
  }
  return [];
};

export const isSupportedFullTextPolicy = (policy: FullTextPolicy): boolean => {
  if (policy.package !== undefined && policy.package !== "legacy" && policy.package !== "standard") {
    return false;
  }
  const specs: (FullTextAnalysisSpec | undefined)[] = [
    { language: policy.defaultLanguage },
    policy.defaultSpec,
    ...policy.fullTextPaths,
  ];
  return specs.every(
    (spec) =>
      !spec ||
      ((!spec.language ||
        fullTextLanguages.some(({ value, legacyId }) => value === spec.language || legacyId === spec.language)) &&
        (spec.stopWordListKind === undefined || ["none", "basic", "extended"].includes(spec.stopWordListKind)) &&
        (spec.tokenizer === undefined || spec.tokenizer === "word") &&
        (spec.filters === undefined ||
          spec.filters.every((filter) => ["lowercase", "ascii", "stop", "stem"].includes(filter)))),
  );
};

export const getStopwordValidationError = (
  spec: FullTextAnalysisSpec | undefined,
  packageName: string | undefined,
): StopwordValidationError | undefined => {
  if (!spec) {
    return undefined;
  }
  const hasWords = spec.addStopWords !== undefined || spec.removeStopWords !== undefined;
  if ((spec.language !== undefined || spec.stopWordListKind !== undefined || hasWords) && !spec.language) {
    return "languageRequired";
  }
  if (hasWords && spec.stopWordListKind === undefined) {
    return "presetRequired";
  }
  if (
    spec.stopWordListKind !== undefined &&
    !getStopwordPresets(packageName, spec.language ?? "en-US").includes(spec.stopWordListKind)
  ) {
    return "invalidPreset";
  }
  // Mirror the server's whitespace/control/punctuation checks without normalizing customer words.
  const invalidWord = /[\s\p{Cc}\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e\p{P}]/u;
  if ([...(spec.addStopWords ?? []), ...(spec.removeStopWords ?? [])].some((word) => invalidWord.test(word))) {
    return "invalidWord";
  }
  return undefined;
};

export const isFullTextPolicyValid = (policy: FullTextPolicy): boolean => {
  // Future policies are read-only in this editor and must not block unrelated settings saves.
  if (!isSupportedFullTextPolicy(policy)) {
    return true;
  }
  const paths = policy.fullTextPaths.map(({ path }) => path);
  return (
    paths.every((path) => path.trim().length > 0) &&
    new Set(paths).size === paths.length &&
    getStopwordValidationError(policy.defaultSpec, policy.package) === undefined &&
    policy.fullTextPaths.every((path) => getStopwordValidationError(path, policy.package) === undefined)
  );
};

export const setFullTextDefaultLanguage = (policy: FullTextPolicy, language: string): FullTextPolicy => ({
  ...policy,
  ...(!policy.defaultSpec || policy.defaultLanguage !== undefined ? { defaultLanguage: language } : {}),
  ...(policy.defaultSpec ? { defaultSpec: { ...policy.defaultSpec, language } } : {}),
});

export const inheritFullTextPathAnalysis = (path: FullTextPolicy["fullTextPaths"][number]) => {
  const result = { ...path };
  delete result.language;
  delete result.stopWordListKind;
  delete result.addStopWords;
  delete result.removeStopWords;
  return result;
};
