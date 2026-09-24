import {
  DefaultButton,
  Dropdown,
  IButton,
  IDropdownOption,
  IDropdownStyles,
  IStyleFunctionOrObject,
  ITextField,
  ITextFieldStyleProps,
  ITextFieldStyles,
  Stack,
  TextField,
} from "@fluentui/react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  makeStyles,
  tokens,
  useId,
} from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import { AccountOverride, FullTextIndex, FullTextPath, FullTextPolicy } from "Contracts/DataModels";
import {
  fullTextLanguages,
  getFullTextDefaultLanguage,
  getStopwordValidationError,
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
  },
  pathsHeading: {
    margin: 0,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  pathSection: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    minWidth: 0,
  },
  pathHeaderRow: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
  },
  pathHeader: {
    flex: 1,
    minWidth: 0,
    margin: 0,
  },
  pathHeaderButton: {
    paddingLeft: 0,
    paddingRight: tokens.spacingHorizontalS,
    minHeight: "56px",
    minWidth: 0,
  },
  pathIdentity: {
    display: "grid",
    rowGap: tokens.spacingVerticalXXS,
    minWidth: 0,
    textAlign: "left",
  },
  pathName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: tokens.fontWeightSemibold,
  },
  pathStatus: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    fontWeight: tokens.fontWeightRegular,
    whiteSpace: "normal",
  },
  pathError: {
    color: tokens.colorPaletteRedForeground1,
  },
  pathPanel: {
    margin: 0,
    paddingBottom: tokens.spacingVerticalL,
  },
  pathFields: {
    minWidth: 0,
    paddingLeft: tokens.spacingHorizontalL,
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
  const addPathButton = React.useRef<IButton>(null);
  const newPathInput = React.useRef<ITextField>(null);
  const focusNewPath = React.useRef(false);
  const pathDescriptionId = useId("full-text-path-description");
  const incomingPolicy = fullTextPolicy ?? emptyPolicy;
  const [policy, setPolicy] = React.useState<FullTextPolicy>(incomingPolicy);
  const initialPolicy = React.useRef(incomingPolicy);
  const callbacks = React.useRef({ onFullTextPathChange, onChangesDiscarded });
  callbacks.current = { onFullTextPathChange, onChangesDiscarded };
  const canCustomize = allowStopwordCustomization && isFullTextSearchPreviewFeaturesEnabled(targetAccountOverride);
  const showStopwords = canCustomize && (isEditing || policy.package === "standard");
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
    if (focusNewPath.current) {
      focusNewPath.current = false;
      newPathInput.current?.focus();
    }
  }, [policy.fullTextPaths.length]);

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
        {showStopwords && (
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
        <h3 className={styles.pathsHeading}>
          {t("fullTextPolicy.pathsHeading", { count: policy.fullTextPaths.length })}
        </h3>
        {policy.fullTextPaths.length === 0 && <div>{t("fullTextPolicy.emptyPaths")}</div>}
        {policy.fullTextPaths.map((path, index) => {
          const indexed = isEditing && fullTextIndexes.some((entry) => entry.path === path.path);
          const pathLocked = readOnly || indexed;
          const inherited = path.language === undefined;
          const pathError = !path.path.trim()
            ? t("fullTextPolicy.pathRequired")
            : policy.fullTextPaths.some((entry, entryIndex) => entryIndex !== index && entry.path === path.path)
            ? t("fullTextPolicy.pathDuplicate")
            : undefined;
          const needsAttention = !readOnly && (pathError || getStopwordValidationError(path, policy.package));
          const analysisMode = t(inherited ? "fullTextPolicy.inheritsDefaults" : "fullTextPolicy.overridesDefaults");
          const pathSummary = indexed
            ? t("fullTextPolicy.indexedPathSummary", { mode: analysisMode })
            : readOnly
            ? t("fullTextPolicy.readOnlyPathSummary", { mode: analysisMode })
            : analysisMode;
          return (
            <Accordion key={index} className={styles.pathSection} collapsible defaultOpenItems={["path"]}>
              <AccordionItem value="path">
                <div className={styles.pathHeaderRow}>
                  <AccordionHeader
                    as="h4"
                    className={styles.pathHeader}
                    button={{ className: styles.pathHeaderButton }}
                  >
                    <span className={styles.pathIdentity}>
                      <span className={styles.pathName} title={path.path}>
                        {path.path || t("fullTextPolicy.newPath")}
                      </span>
                      <span className={styles.pathStatus}>
                        {pathSummary}
                        {needsAttention && (
                          <span className={styles.pathError}>
                            {" - "}
                            {t("fullTextPolicy.needsAttention")}
                          </span>
                        )}
                      </span>
                    </span>
                  </AccordionHeader>
                  {!pathLocked && (
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label={t("fullTextPolicy.deletePath", { index: index + 1 })}
                      title={t("fullTextPolicy.deletePath", { index: index + 1 })}
                      onClick={() => {
                        setPolicy((current) => ({
                          ...current,
                          fullTextPaths: current.fullTextPaths.filter((_path, pathIndex) => pathIndex !== index),
                        }));
                        addPathButton.current?.focus();
                      }}
                    />
                  )}
                </div>
                <AccordionPanel className={styles.pathPanel}>
                  <Stack className={styles.pathFields} tokens={{ childrenGap: 4 }}>
                    {pathLocked && !readOnly && <div role="status">{t("fullTextPolicy.pathLocked")}</div>}
                    <Stack>
                      <TextField
                        label={t("fullTextPolicy.path")}
                        ariaLabel={t("fullTextPolicy.path")}
                        id={`${pathDescriptionId}-path-${index + 1}`}
                        componentRef={index === policy.fullTextPaths.length - 1 ? newPathInput : undefined}
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
                    {showStopwords && (
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
                          {inherited
                            ? t("fullTextPolicy.inheritedLanguageDescription", {
                                language:
                                  languageOptions(defaultLanguage).find((option) => option.key === defaultLanguage)
                                    ?.text ?? defaultLanguage,
                              })
                            : t("fullTextPolicy.overrideDescription")}
                        </div>
                      </>
                    )}
                    {(!inherited || !showStopwords) && (
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
                    )}
                    {showStopwords && !inherited && (
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
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          );
        })}
        <DefaultButton
          componentRef={addPathButton}
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
          onClick={() => {
            focusNewPath.current = true;
            setPolicy((current) => ({
              ...current,
              fullTextPaths: [
                ...current.fullTextPaths,
                current.package === "standard"
                  ? { path: "" }
                  : { path: "", language: getFullTextDefaultLanguage(current) },
              ],
            }));
          }}
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
