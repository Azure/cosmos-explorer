import { Checkbox, Dropdown, Field, makeStyles, Option, Textarea, tokens, useId } from "@fluentui/react-components";
import { FullTextAnalysisSpec } from "Contracts/DataModels";
import { getStopwordPresets, getStopwordValidationError } from "Explorer/Controls/FullTextSeach/FullTextPolicyUtils";
import { t } from "Localization";
import React from "react";

interface StopwordSettingsProps {
  label: string;
  description?: string;
  language: string;
  packageName: string | undefined;
  spec: FullTextAnalysisSpec;
  inheritedFilters?: string[];
  disabled: boolean;
  onChange: (spec: FullTextAnalysisSpec) => void;
}

const useStyles = makeStyles({
  root: {
    minWidth: 0,
    display: "grid",
    rowGap: tokens.spacingVerticalM,
  },
  heading: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  introduction: {
    display: "grid",
    rowGap: tokens.spacingVerticalXS,
  },
  wordLists: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: tokens.spacingHorizontalL,
    minWidth: 0,
  },
  hint: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
});

export const StopwordSettings = ({
  label,
  description,
  language,
  packageName,
  spec,
  inheritedFilters,
  disabled,
  onChange,
}: StopwordSettingsProps): JSX.Element => {
  const styles = useStyles();
  const formatHintId = useId("stopword-format");
  const error = getStopwordValidationError(spec, packageName);
  const addedWordsInvalid =
    !disabled && getStopwordValidationError({ ...spec, removeStopWords: undefined }, packageName) === "invalidWord";
  const removedWordsInvalid =
    !disabled && getStopwordValidationError({ ...spec, addStopWords: undefined }, packageName) === "invalidWord";
  const effectiveFilters = spec.filters ?? (spec.tokenizer === undefined ? inheritedFilters : undefined) ?? [];
  const filteringEnabled = packageName !== "standard" || effectiveFilters.includes("stop");
  const presetLabel = (preset: string): string => {
    switch (preset) {
      case "none":
        return t("fullTextPolicy.none");
      case "basic":
        return t("fullTextPolicy.basic");
      case "extended":
        return t("fullTextPolicy.extended");
      default:
        return preset;
    }
  };
  const presetDescription = (): string | undefined => {
    if (!filteringEnabled) {
      return undefined;
    }
    switch (spec.stopWordListKind) {
      case "none":
        return t("fullTextPolicy.noneDescription");
      case "basic":
        return t("fullTextPolicy.basicDescription");
      case "extended":
        return t("fullTextPolicy.extendedDescription");
      default:
        return !disabled ? t("fullTextPolicy.selectListHint") : undefined;
    }
  };
  const updateWords = (field: "addStopWords" | "removeStopWords", value: string): void =>
    onChange({ ...spec, language, [field]: value === "" ? [] : value.split(/\r?\n/) });

  return (
    <div role="group" aria-label={label} className={styles.root}>
      <div className={styles.introduction}>
        <div className={styles.heading}>{label}</div>
        {description && <div className={styles.hint}>{description}</div>}
      </div>
      {packageName === "standard" && (
        <Checkbox
          label={t("fullTextPolicy.enableStopFilter")}
          checked={filteringEnabled}
          disabled={disabled}
          onChange={(_event, data) =>
            onChange({
              ...spec,
              language,
              tokenizer: spec.tokenizer ?? "word",
              filters:
                data.checked === true
                  ? [...effectiveFilters.filter((filter) => filter !== "stop"), "stop"]
                  : effectiveFilters.filter((filter) => filter !== "stop"),
            })
          }
        />
      )}
      {!filteringEnabled && <div role="status">{t("fullTextPolicy.stopFilterDisabled")}</div>}
      <Field label={t("fullTextPolicy.preset")} hint={presetDescription()}>
        <Dropdown
          style={{ minWidth: 0, width: "100%" }}
          disabled={disabled || !filteringEnabled}
          value={spec.stopWordListKind ? presetLabel(spec.stopWordListKind) : t("fullTextPolicy.serviceDefault")}
          selectedOptions={[spec.stopWordListKind ?? ""]}
          onOptionSelect={(_event, data) => {
            if (data.optionValue === undefined) {
              return;
            }
            const next = { ...spec, language };
            if (data.optionValue === "") {
              delete next.stopWordListKind;
              delete next.addStopWords;
              delete next.removeStopWords;
            } else {
              next.stopWordListKind = data.optionValue;
            }
            onChange(next);
          }}
        >
          <Option value="" text={t("fullTextPolicy.serviceDefault")}>
            {t("fullTextPolicy.resetStopwords")}
          </Option>
          {getStopwordPresets(packageName, language).map((preset) => (
            <Option key={preset} value={preset}>
              {presetLabel(preset)}
            </Option>
          ))}
        </Dropdown>
      </Field>
      <div className={styles.wordLists}>
        <Field
          label={t("fullTextPolicy.addedWords")}
          hint={t("fullTextPolicy.addedWordsDescription")}
          validationState={addedWordsInvalid ? "error" : "none"}
          validationMessage={
            addedWordsInvalid ? { children: t("fullTextPolicy.invalidWord"), role: "alert" } : undefined
          }
        >
          <Textarea
            style={{ width: "100%" }}
            resize="vertical"
            rows={2}
            aria-describedby={formatHintId}
            disabled={disabled || !filteringEnabled || spec.stopWordListKind === undefined}
            value={(spec.addStopWords ?? []).join("\n")}
            onChange={(_event, data) => updateWords("addStopWords", data.value)}
          />
        </Field>
        <Field
          label={t("fullTextPolicy.removedWords")}
          hint={t("fullTextPolicy.removedWordsDescription")}
          validationState={removedWordsInvalid ? "error" : "none"}
          validationMessage={
            removedWordsInvalid ? { children: t("fullTextPolicy.invalidWord"), role: "alert" } : undefined
          }
        >
          <Textarea
            style={{ width: "100%" }}
            resize="vertical"
            rows={2}
            aria-describedby={formatHintId}
            disabled={disabled || !filteringEnabled || spec.stopWordListKind === undefined}
            value={(spec.removeStopWords ?? []).join("\n")}
            onChange={(_event, data) => updateWords("removeStopWords", data.value)}
          />
        </Field>
      </div>
      <div id={formatHintId} className={styles.hint}>
        {t("fullTextPolicy.wordsHint")}
      </div>
      {!disabled && error && error !== "invalidWord" && (
        <div role="alert" style={{ color: "var(--colorPaletteRedForeground1)" }}>
          {t(`fullTextPolicy.${error}`)}
        </div>
      )}
    </div>
  );
};
