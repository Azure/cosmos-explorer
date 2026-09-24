import { Checkbox, Dropdown, Field, Option, Textarea } from "@fluentui/react-components";
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
  const error = getStopwordValidationError(spec, packageName);
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
  const updateWords = (field: "addStopWords" | "removeStopWords", value: string): void =>
    onChange({ ...spec, language, [field]: value === "" ? [] : value.split(/\r?\n/) });

  return (
    <div role="group" aria-label={label} style={{ minWidth: 0, display: "grid", gap: 8 }}>
      <div style={{ paddingTop: 8, fontWeight: 600 }}>{label}</div>
      {description && <div style={{ color: "var(--colorNeutralForeground2)" }}>{description}</div>}
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
      <Field label={t("fullTextPolicy.preset")}>
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
      <Field label={t("fullTextPolicy.addedWords")} hint={t("fullTextPolicy.wordsHint")}>
        <Textarea
          style={{ width: "100%" }}
          resize="vertical"
          rows={3}
          disabled={disabled || !filteringEnabled || spec.stopWordListKind === undefined}
          value={(spec.addStopWords ?? []).join("\n")}
          onChange={(_event, data) => updateWords("addStopWords", data.value)}
        />
      </Field>
      <Field label={t("fullTextPolicy.removedWords")}>
        <Textarea
          style={{ width: "100%" }}
          resize="vertical"
          rows={3}
          disabled={disabled || !filteringEnabled || spec.stopWordListKind === undefined}
          value={(spec.removeStopWords ?? []).join("\n")}
          onChange={(_event, data) => updateWords("removeStopWords", data.value)}
        />
      </Field>
      {!disabled && error && (
        <div role="alert" style={{ color: "var(--colorPaletteRedForeground1)" }}>
          {t(`fullTextPolicy.${error}`)}
        </div>
      )}
    </div>
  );
};
