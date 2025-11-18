import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  IStyleFunctionOrObject,
  ITextFieldStyleProps,
  ITextFieldStyles,
  Label,
  Stack,
  TextField,
} from "@fluentui/react";
import { FullTextIndex, FullTextPath, FullTextPolicy } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
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
}

export interface FullTextPolicyData {
  path: string;
  language: string;
  pathError: string;
}

const labelStyles = {
  root: {
    fontSize: 12,
    color: "var(--colorNeutralForeground1)",
  },
};

const textFieldStyles: IStyleFunctionOrObject<ITextFieldStyleProps, ITextFieldStyles> = {
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
    width: "40%",
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
    },
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
}): JSX.Element => {
  const getFullTextPathError = (path: string, index?: number): string => {
    let error = "";
    if (!path) {
      error = "Full text path should not be empty";
    }
    if (
      index >= 0 &&
      fullTextPathData?.find(
        (fullTextPath: FullTextPolicyData, dataIndex: number) => dataIndex !== index && fullTextPath.path === path,
      )
    ) {
      error = "Full text path is already defined";
    }
    return error;
  };

  const initializeData = (fullTextPolicy: FullTextPolicy): FullTextPolicyData[] => {
    if (!fullTextPolicy) {
      fullTextPolicy = { defaultLanguage: getFullTextLanguageOptions()[0].key as never, fullTextPaths: [] };
    }

    return fullTextPolicy.fullTextPaths.map((fullTextPath: FullTextPath) => ({
      ...fullTextPath,
      pathError: getFullTextPathError(fullTextPath.path),
    }));
  };

  const [fullTextPathData, setFullTextPathData] = React.useState<FullTextPolicyData[]>(initializeData(fullTextPolicy));
  const [defaultLanguage, setDefaultLanguage] = React.useState<string>(
    fullTextPolicy ? fullTextPolicy.defaultLanguage : (getFullTextLanguageOptions()[0].key as never),
  );

  React.useEffect(() => {
    propagateData();
  }, [fullTextPathData, defaultLanguage]);

  React.useEffect(() => {
    if (discardChanges) {
      setFullTextPathData(initializeData(fullTextPolicy));
      setDefaultLanguage(fullTextPolicy.defaultLanguage);
      onChangesDiscarded();
    }
  }, [discardChanges]);

  const propagateData = () => {
    const newFullTextPolicy: FullTextPolicy = {
      defaultLanguage: defaultLanguage,
      fullTextPaths: fullTextPathData.map((policy: FullTextPolicyData) => ({
        path: policy.path,
        language: policy.language,
      })),
    };
    const fullTextIndexes: FullTextIndex[] = fullTextPathData.map((policy) => ({
      path: policy.path,
    }));
    const validationPassed = fullTextPathData.every((policy: FullTextPolicyData) => policy.pathError === "");
    onFullTextPathChange(newFullTextPolicy, fullTextIndexes, validationPassed);
  };

  const onFullTextPathValueChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const fullTextPaths = [...fullTextPathData];
    if (!fullTextPaths[index]?.path && !value.startsWith("/")) {
      fullTextPaths[index].path = "/" + value;
    } else {
      fullTextPaths[index].path = value;
    }
    fullTextPaths[index].pathError = getFullTextPathError(value, index);
    setFullTextPathData(fullTextPaths);
  };

  const onFullTextPathPolicyChange = (index: number, option: IDropdownOption): void => {
    const policies = [...fullTextPathData];
    policies[index].language = option.key as never;
    setFullTextPathData(policies);
  };

  const onAdd = () => {
    setFullTextPathData([
      ...fullTextPathData,
      {
        path: "",
        language: defaultLanguage,
        pathError: getFullTextPathError(""),
      },
    ]);
  };

  const onDelete = (index: number) => {
    const policies = fullTextPathData.filter((_uniqueKey, j) => index !== j);
    setFullTextPathData(policies);
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      <Stack style={{ marginBottom: 10 }}>
        <Label styles={labelStyles}>Default language</Label>
        <Dropdown
          required={true}
          styles={dropdownStyles}
          options={getFullTextLanguageOptions(englishOnly)}
          selectedKey={defaultLanguage}
          onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
            setDefaultLanguage(option.key as never)
          }
        ></Dropdown>
      </Stack>
      {fullTextPathData &&
        fullTextPathData.length > 0 &&
        fullTextPathData.map((fullTextPolicy: FullTextPolicyData, index: number) => (
          <CollapsibleSectionComponent
            key={index}
            isExpandedByDefault={true}
            title={`Full text path ${index + 1}`}
            showDelete={true}
            onDelete={() => onDelete(index)}
          >
            <Stack horizontal tokens={{ childrenGap: 4 }}>
              <Stack
                styles={{
                  root: {
                    margin: "0 0 6px 20px !important",
                    paddingLeft: 20,
                    width: "80%",
                    borderLeft: "1px solid",
                  },
                }}
              >
                <Stack>
                  <Label styles={labelStyles}>Path</Label>
                  <TextField
                    id={`full-text-policy-path-${index + 1}`}
                    required={true}
                    placeholder="/fullTextPath1"
                    styles={textFieldStyles}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onFullTextPathValueChange(index, event)}
                    value={fullTextPolicy.path || ""}
                    errorMessage={fullTextPolicy.pathError}
                  />
                </Stack>
                <Stack>
                  <Label styles={labelStyles}>Language</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getFullTextLanguageOptions(englishOnly)}
                    selectedKey={fullTextPolicy.language}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onFullTextPathPolicyChange(index, option)
                    }
                  ></Dropdown>
                </Stack>
              </Stack>
            </Stack>
          </CollapsibleSectionComponent>
        ))}
      <DefaultButton
        id={`add-vector-policy`}
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
        onClick={onAdd}
      >
        Add full text path
      </DefaultButton>
    </Stack>
  );
};

export const getFullTextLanguageOptions = (englishOnly?: boolean): IDropdownOption[] => {
  const multiLanguageSupportEnabled: boolean = isFullTextSearchPreviewFeaturesEnabled() && !englishOnly;
  const fullTextLanguageOptions: IDropdownOption[] = [
    {
      key: "en-US",
      text: "English (US)",
    },
    ...(multiLanguageSupportEnabled
      ? [
          {
            key: "fr-FR",
            text: "French",
          },
          {
            key: "de-DE",
            text: "German",
          },
          {
            key: "es-ES",
            text: "Spanish",
          },
        ]
      : []),
  ];

  return fullTextLanguageOptions;
};
