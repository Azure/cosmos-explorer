import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IStyleFunctionOrObject,
  ITextFieldStyleProps,
  ITextFieldStyles,
  Stack,
  TextField,
} from "@fluentui/react";
import { Checkbox, makeStyles, tokens, useId } from "@fluentui/react-components";
import { AccountOverride, FullTextIndex, FullTextPath, FullTextPolicy } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import {
  fullTextLanguages,
  getFullTextDefaultLanguage,
  inheritFullTextPathAnalysis,
  isFullTextPolicyValid,
  isSupportedFullTextPolicy,
  setFullTextDefaultLanguage,
} from "Explorer/Controls/FullTextSeach/FullTextPolicyUtils";
import { StopwordSettings } from "Explorer/Controls/FullTextSeach/StopwordSettings";
import { CosmosFluentProvider } from "Explorer/Theme/ThemeUtil";
import { t } from "Localization";
import * as React from "react";
import { isFullTextSearchPreviewFeaturesEnabled } from "Utils/CapabilityUtils";

export interface FullTextPoliciesComponentProps {
  fullTextPolicy: FullTextPolicy;
  onFullTextPathChange: (
    fullTextPolicy: FullTextPolicy,
    fullTextIndexes: FullTextIndex[],
    validationPassed: boolean,
  ) => void;
  discardChanges?: boolean;
  onChangesDiscarded?: () => void;
  englishOnly?: boolean;
  targetAccountOverride?: AccountOverride;
  allowStopwordCustomization?: boolean;
  isEditing?: boolean;
  fullTextIndexes?: FullTextIndex[];
}

const emptyPolicy: FullTextPolicy = { defaultLanguage: "en-US", fullTextPaths: [] };
const emptyIndexes: FullTextIndex[] = [];

const useStyles = makeStyles({
  editor: {
    minWidth: 0,
    "& .fui-Field__label": {
      paddingLeft: 0,
      paddingRight: 0,
      whiteSpace: "normal",
    },
    "& .fui-Checkbox": {
      maxWidth: "100%",
      minWidth: 0,
    },
    "& .fui-Checkbox__label": {
      minWidth: 0,
      whiteSpace: "normal",
      overflowWrap: "anywhere",
    },
    "& .fui-Textarea__textarea:disabled": {
      color: tokens.colorNeutralForeground2,
    },
    "& .fui-Dropdown__button:disabled": {
      color: tokens.colorNeutralForeground2,
    },
    "& .fui-Checkbox__input:disabled ~ .fui-Checkbox__label": {
      color: tokens.colorNeutralForeground2,
    },
    "& .collapsibleSection": {
      marginTop: tokens.spacingVerticalM,
    },
  },
});

const textFieldStyles: IStyleFunctionOrObject<ITextFieldStyleProps, ITextFieldStyles> = {
  subComponentStyles: {
    label: { root: { color: "var(--colorNeutralForeground1)" } },
  },
  fieldGroup: {
    height: 27,
    backgroundColor: "var(--colorNeutralBackground2)",
    borderColor: "var(--colorNeutralStroke1)",
  },
  field: {
    fontSize: 12,
    padding: "0 8px",
    color: "var(--colorNeutralForeground1)",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  root: {
    selectors: {
      input: {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground1)",
      },
      "input:hover": {
        backgroundColor: "var(--colorNeutralBackground2)",
        borderColor: "var(--colorNeutralStroke1)",
      },
      "input:focus": {
        backgroundColor: "var(--colorNeutralBackground2)",
        borderColor: "var(--colorBrandBackground)",
      },
    },
  },
};

const dropdownStyles: Partial<IDropdownStyles> = {
  root: {
    width: "100%",
    marginTop: "10px",
    selectors: {
      "&:hover .ms-Dropdown-title": {
        color: "var(--colorNeutralForeground1)",
        backgroundColor: "var(--colorNeutralBackground2)",
        borderColor: "var(--colorNeutralStroke1)",
      },
      "&:hover span.ms-Dropdown-title": {
        color: "var(--colorNeutralForeground1)",
      },
      "&:focus .ms-Dropdown-title": {
        color: "var(--colorNeutralForeground1)",
        backgroundColor: "var(--colorNeutralBackground2)",
      },
      "&:focus span.ms-Dropdown-title": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  label: {
    color: "var(--colorNeutralForeground1)",
  },
  dropdown: {
    backgroundColor: "var(--colorNeutralBackground2)",
    borderColor: "var(--colorNeutralStroke1)",
    color: "var(--colorNeutralForeground1)",
  },
  title: {
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground1)",
    borderColor: "var(--colorNeutralStroke1)",
    selectors: {
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:focus": {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:hover .ms-Dropdown-titleText": {
        color: "var(--colorNeutralForeground1)",
      },
      "&:focus .ms-Dropdown-titleText": {
        color: "var(--colorNeutralForeground1)",
      },
      "& .ms-Dropdown-titleText": {
        color: "var(--colorNeutralForeground1)",
      },
      "&.ms-Dropdown-title--hasPlaceholder": {
        color: "var(--colorNeutralForeground2)",
      },
    },
  },
  errorMessage: {
    color: "var(--colorNeutralForeground1)",
  },
  caretDown: {
    color: "var(--colorNeutralForeground1)",
  },
  callout: {
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  dropdownItems: {
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  dropdownItem: {
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground1)",
    minHeight: "36px",
    lineHeight: "36px",
    selectors: {
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:hover .ms-Dropdown-optionText": {
        color: "var(--colorNeutralForeground1)",
      },
      "&:focus": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:active": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        color: "var(--colorNeutralForeground1)",
      },
      "& .ms-Dropdown-optionText": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "var(--colorNeutralForeground1)",
    minHeight: "36px",
    lineHeight: "36px",
    selectors: {
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:hover .ms-Dropdown-optionText": {
        color: "var(--colorNeutralForeground1)",
      },
      "&:focus": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:active": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        color: "var(--colorNeutralForeground1)",
      },
      "& .ms-Dropdown-optionText": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  dropdownOptionText: {
    color: "var(--colorNeutralForeground1)",
  },
  dropdownItemHeader: {
    color: "var(--colorNeutralForeground1)",
  },
};

export const FullTextPoliciesComponent: React.FunctionComponent<FullTextPoliciesComponentProps> = ({
  fullTextPolicy,
  onFullTextPathChange,
  discardChanges,
  onChangesDiscarded,
  englishOnly,
  targetAccountOverride,
  allowStopwordCustomization = false,
  isEditing = false,
  fullTextIndexes = emptyIndexes,
}): JSX.Element => {
  const styles = useStyles();
  const pathDescriptionId = useId("full-text-path-description");
  const incomingPolicy = fullTextPolicy ?? emptyPolicy;
  const [policy, setPolicy] = React.useState<FullTextPolicy>(incomingPolicy);
  const initialPolicy = React.useRef(incomingPolicy);
  const callbacks = React.useRef({ onFullTextPathChange, onChangesDiscarded });
  callbacks.current = { onFullTextPathChange, onChangesDiscarded };
  const canCustomize = allowStopwordCustomization && isFullTextSearchPreviewFeaturesEnabled(targetAccountOverride);
  const supported = isSupportedFullTextPolicy(policy);
  const hasCustomization =
    policy.package === "standard" ||
    policy.defaultSpec !== undefined ||
    policy.fullTextPaths.some(
      (path) =>
        path.stopWordListKind !== undefined || path.addStopWords !== undefined || path.removeStopWords !== undefined,
    );
  const readOnly = !supported || (hasCustomization && !canCustomize);
  const defaultsLocked = readOnly || (isEditing && fullTextIndexes.length > 0);
  const defaultLanguage = getFullTextDefaultLanguage(policy);
  const canToggleCustomization =
    !isEditing &&
    initialPolicy.current.defaultSpec === undefined &&
    initialPolicy.current.package === undefined &&
    initialPolicy.current.fullTextPaths.every((path) =>
      Object.keys(path).every((key) => key === "path" || key === "language"),
    );

  React.useEffect(() => {
    setPolicy(incomingPolicy);
  }, [incomingPolicy]);

  React.useEffect(() => {
    if (discardChanges) {
      setPolicy(incomingPolicy);
      callbacks.current.onChangesDiscarded?.();
    }
  }, [discardChanges, incomingPolicy]);

  React.useEffect(() => {
    callbacks.current.onFullTextPathChange(
      policy,
      isEditing ? fullTextIndexes : policy.fullTextPaths.map(({ path }) => ({ path })),
      isFullTextPolicyValid(policy),
    );
  }, [policy, isEditing, fullTextIndexes, readOnly]);

  const updatePath = (index: number, update: (path: FullTextPath) => FullTextPath): void =>
    setPolicy((current) => ({
      ...current,
      fullTextPaths: current.fullTextPaths.map((path, pathIndex) => (pathIndex === index ? update(path) : path)),
    }));

  const languageOptions = (currentLanguage: string): IDropdownOption[] => {
    const options = getFullTextLanguageOptions(englishOnly, targetAccountOverride);
    if (!options.some((option) => option.key === currentLanguage)) {
      options.push({ key: currentLanguage, text: currentLanguage, disabled: true });
    }
    return options;
  };

  return (
    <CosmosFluentProvider className={styles.editor}>
      <Stack tokens={{ childrenGap: 4 }}>
        {readOnly && (
          <div role="status">{t(supported ? "fullTextPolicy.capabilityRequired" : "fullTextPolicy.unsupported")}</div>
        )}
        <Stack style={{ marginBottom: 10 }}>
          <Dropdown
            label={t("fullTextPolicy.defaultLanguage")}
            required={true}
            disabled={defaultsLocked}
            styles={dropdownStyles}
            options={languageOptions(defaultLanguage)}
            selectedKey={defaultLanguage}
            onChange={(_event, option) => {
              if (option && typeof option.key === "string") {
                setPolicy((current) => setFullTextDefaultLanguage(current, option.key.toString()));
              }
            }}
          ></Dropdown>
        </Stack>
        {canCustomize && canToggleCustomization && (
          <Checkbox
            label={t("fullTextPolicy.customize")}
            checked={policy.package === "standard"}
            disabled={readOnly}
            onChange={(_event, data) => {
              if (data.checked === true) {
                setPolicy((current) => ({
                  ...current,
                  package: "standard",
                  defaultSpec: {
                    language: getFullTextDefaultLanguage(current),
                    stopWordListKind: "basic",
                    tokenizer: "word",
                    filters: ["lowercase", "stop"],
                  },
                  fullTextPaths: current.fullTextPaths.map((path) =>
                    path.language === getFullTextDefaultLanguage(current) &&
                    Object.keys(path).every((key) => key === "path" || key === "language")
                      ? { path: path.path }
                      : path,
                  ),
                }));
              } else {
                setPolicy((current) => {
                  const language = getFullTextDefaultLanguage(current);
                  const next = {
                    ...current,
                    defaultLanguage: language,
                    fullTextPaths: current.fullTextPaths.map((path) => {
                      const legacyPath = { ...inheritFullTextPathAnalysis(path), language: path.language ?? language };
                      delete legacyPath.tokenizer;
                      delete legacyPath.filters;
                      return legacyPath;
                    }),
                  };
                  delete next.package;
                  delete next.defaultSpec;
                  return next;
                });
              }
            }}
          />
        )}
        {canCustomize && (isEditing || policy.package === "standard") && (
          <>
            {!isEditing && <div>{t("fullTextPolicy.customizeDescription")}</div>}
            {defaultsLocked && !readOnly && <div role="status">{t("fullTextPolicy.defaultLocked")}</div>}
            <StopwordSettings
              label={t("fullTextPolicy.defaultStopwords")}
              description={t("fullTextPolicy.defaultDescription")}
              language={defaultLanguage}
              packageName={policy.package}
              spec={{ ...policy.defaultSpec, language: defaultLanguage }}
              disabled={defaultsLocked}
              onChange={(defaultSpec) => setPolicy((current) => ({ ...current, defaultSpec }))}
            />
          </>
        )}
        {policy.fullTextPaths.map((path, index) => {
          const pathLocked = readOnly || (isEditing && fullTextIndexes.some((entry) => entry.path === path.path));
          const inherited = path.language === undefined;
          const pathError = !path.path.trim()
            ? t("fullTextPolicy.pathRequired")
            : policy.fullTextPaths.some((entry, entryIndex) => entryIndex !== index && entry.path === path.path)
            ? t("fullTextPolicy.pathDuplicate")
            : undefined;
          return (
            <CollapsibleSectionComponent
              key={index}
              isExpandedByDefault={true}
              title={t("fullTextPolicy.pathTitle", { index: index + 1 })}
              showDelete={!pathLocked}
              deleteLabel={t("fullTextPolicy.deletePath", { index: index + 1 })}
              onDelete={() =>
                setPolicy((current) => ({
                  ...current,
                  fullTextPaths: current.fullTextPaths.filter((_path, pathIndex) => pathIndex !== index),
                }))
              }
            >
              <Stack horizontal tokens={{ childrenGap: 4 }}>
                <Stack
                  styles={{
                    root: {
                      margin: "0 0 12px 12px !important",
                      paddingLeft: 12,
                      flex: 1,
                      minWidth: 0,
                      borderLeft: "1px solid var(--colorNeutralStroke2)",
                    },
                  }}
                >
                  {pathLocked && !readOnly && <div role="status">{t("fullTextPolicy.pathLocked")}</div>}
                  <Stack>
                    <TextField
                      label={t("fullTextPolicy.path")}
                      ariaLabel={t("fullTextPolicy.path")}
                      id={`full-text-policy-path-${index + 1}`}
                      required={true}
                      disabled={pathLocked}
                      placeholder="/fullTextPath1"
                      styles={textFieldStyles}
                      onChange={(_event, value) =>
                        updatePath(index, (current) => {
                          const next = (value ?? "").trim();
                          return {
                            ...current,
                            path: !current.path && next.length > 0 && !next.startsWith("/") ? `/${next}` : next,
                          };
                        })
                      }
                      value={path.path}
                      errorMessage={pathError}
                    />
                  </Stack>
                  {canCustomize && (isEditing || policy.package === "standard") && (
                    <>
                      <Checkbox
                        label={t("fullTextPolicy.inherit")}
                        aria-describedby={`${pathDescriptionId}-${index}`}
                        disabled={pathLocked}
                        checked={inherited}
                        onChange={(_event, data) =>
                          updatePath(index, (current) =>
                            data.checked === true
                              ? inheritFullTextPathAnalysis(current)
                              : { ...current, language: defaultLanguage },
                          )
                        }
                      />
                      <div id={`${pathDescriptionId}-${index}`} style={{ color: "var(--colorNeutralForeground2)" }}>
                        {t(inherited ? "fullTextPolicy.inheritedDescription" : "fullTextPolicy.overrideDescription")}
                      </div>
                    </>
                  )}
                  <Stack>
                    <Dropdown
                      label={t("fullTextPolicy.language")}
                      disabled={pathLocked || inherited}
                      styles={dropdownStyles}
                      options={languageOptions(path.language ?? defaultLanguage)}
                      selectedKey={path.language ?? defaultLanguage}
                      onChange={(_event, option) => {
                        if (option && typeof option.key === "string") {
                          updatePath(index, (current) => ({ ...current, language: option.key.toString() }));
                        }
                      }}
                    ></Dropdown>
                  </Stack>
                  {canCustomize && !inherited && (isEditing || policy.package === "standard") && (
                    <StopwordSettings
                      label={t("fullTextPolicy.pathStopwords", { path: path.path })}
                      language={path.language}
                      packageName={policy.package}
                      spec={path}
                      inheritedFilters={policy.defaultSpec?.filters}
                      disabled={pathLocked}
                      onChange={(spec) => updatePath(index, (current) => ({ ...spec, path: current.path }))}
                    />
                  )}
                </Stack>
              </Stack>
            </CollapsibleSectionComponent>
          );
        })}
        <DefaultButton
          id="add-full-text-policy"
          disabled={readOnly}
          styles={{
            root: {
              maxWidth: 170,
              fontSize: 12,
              color: "var(--colorNeutralForeground1)",
              backgroundColor: "transparent",
              borderColor: "var(--colorNeutralStroke1)",
            },
            rootHovered: {
              color: "var(--colorNeutralForeground1)",
              backgroundColor: "transparent",
              borderColor: "var(--colorNeutralForeground1)",
            },
            rootPressed: {
              color: "var(--colorNeutralForeground1)",
              backgroundColor: "transparent",
              borderColor: "var(--colorNeutralForeground1)",
            },
            rootDisabled: {
              backgroundColor: "transparent",
            },
          }}
          onClick={() =>
            setPolicy((current) => ({
              ...current,
              fullTextPaths: [
                ...current.fullTextPaths,
                current.package === "standard"
                  ? { path: "" }
                  : { path: "", language: getFullTextDefaultLanguage(current) },
              ],
            }))
          }
        >
          {t("fullTextPolicy.addPath")}
        </DefaultButton>
      </Stack>
    </CosmosFluentProvider>
  );
};

export const getFullTextLanguageOptions = (
  englishOnly?: boolean,
  targetAccountOverride?: AccountOverride,
): IDropdownOption[] => {
  const multiLanguageSupportEnabled: boolean =
    isFullTextSearchPreviewFeaturesEnabled(targetAccountOverride) && !englishOnly;
  return fullTextLanguages
    .filter((language) => language.value === "en-US" || multiLanguageSupportEnabled)
    .map(({ value, label }) => ({ key: value, text: t(`fullTextPolicy.${label}`) }));
};
