import { Dropdown, IDropdownOption, Label, Stack, TextField } from "@fluentui/react";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { VectorEmbeddingSource } from "Contracts/DataModels";
import {
  getAuthTypeOptions,
  isValidHttpsUrl,
  parseSourcePaths,
} from "Explorer/Controls/VectorSearch/VectorSearchUtils";
import { dropdownStyles, labelStyles, textFieldStyles } from "Explorer/Controls/VectorSearch/vectorSearchStyles";
import { Keys, t } from "Localization";
import type { ResourceKey } from "Localization/t";
import React, { FunctionComponent, useState } from "react";

export interface IVectorEmbeddingSourceComponentProps {
  index: number;
  disabled: boolean;
  initialEmbeddingSource?: VectorEmbeddingSource;
  discardChanges?: boolean;
  onChange: (embeddingSource: VectorEmbeddingSource | undefined, isValid: boolean) => void;
}

const defaultAuthType: VectorEmbeddingSource["authType"] = "Entra";

const validateSourcePaths = (raw: string): string => {
  const parsed = parseSourcePaths(raw);
  if (parsed.length === 0) {
    return t(Keys.controls.vectorEmbeddingPolicies.sourcePathsRequiredError);
  }
  const seen = new Set<string>();
  for (const p of parsed) {
    if (seen.has(p)) {
      return t(Keys.controls.vectorEmbeddingPolicies.sourcePathDuplicateError);
    }
    seen.add(p);
  }
  return "";
};

const validateRequired = (value: string | undefined, errorKey: ResourceKey): string => {
  if (!value || value.trim().length === 0) {
    return t(errorKey);
  }
  return "";
};

const validateEndpoint = (value: string | undefined): string => {
  if (!value || value.trim().length === 0) {
    return t(Keys.controls.vectorEmbeddingPolicies.endpointRequiredError);
  }
  if (!isValidHttpsUrl(value.trim())) {
    return t(Keys.controls.vectorEmbeddingPolicies.endpointInvalidError);
  }
  return "";
};

export const VectorEmbeddingSourceComponent: FunctionComponent<IVectorEmbeddingSourceComponentProps> = ({
  index,
  disabled,
  initialEmbeddingSource,
  discardChanges,
  onChange,
}): JSX.Element => {
  // The integrated-embedding capability gate lives at the parent's call site
  // (VectorEmbeddingPoliciesComponent). Don't add a gate here — gating before the
  // hooks below would violate the Rules of Hooks.
  const suffix = index + 1;

  const [sourcePathsRaw, setSourcePathsRaw] = useState<string>(initialEmbeddingSource?.sourcePaths?.join(", ") || "");
  const [deploymentName, setDeploymentName] = useState<string>(initialEmbeddingSource?.deploymentName || "");
  const [modelName, setModelName] = useState<string>(initialEmbeddingSource?.modelName || "");
  const [endpoint, setEndpoint] = useState<string>(initialEmbeddingSource?.endpoint || "");
  const [authType, setAuthType] = useState<VectorEmbeddingSource["authType"]>(
    initialEmbeddingSource?.authType || defaultAuthType,
  );

  const hasAnyValue =
    sourcePathsRaw.trim().length > 0 ||
    deploymentName.trim().length > 0 ||
    modelName.trim().length > 0 ||
    endpoint.trim().length > 0;

  const sourcePathsError = hasAnyValue ? validateSourcePaths(sourcePathsRaw) : "";
  const deploymentNameError = hasAnyValue
    ? validateRequired(deploymentName, Keys.controls.vectorEmbeddingPolicies.deploymentNameRequiredError)
    : "";
  const modelNameError = hasAnyValue
    ? validateRequired(modelName, Keys.controls.vectorEmbeddingPolicies.modelNameRequiredError)
    : "";
  const endpointError = hasAnyValue ? validateEndpoint(endpoint) : "";

  const isValid = !hasAnyValue || (!sourcePathsError && !deploymentNameError && !modelNameError && !endpointError);

  // Memoize the synthesized source so that equal field values yield the same object reference.
  // Without this, every render would mint a new object literal, defeating the parent's
  // reference-equality guard in onEmbeddingSourceChange and producing an infinite render loop
  // once all five fields become valid.
  const source = React.useMemo<VectorEmbeddingSource | undefined>(() => {
    if (!hasAnyValue || !isValid) {
      return undefined;
    }
    return {
      sourcePaths: parseSourcePaths(sourcePathsRaw),
      deploymentName: deploymentName.trim(),
      modelName: modelName.trim(),
      endpoint: endpoint.trim(),
      authType,
    };
  }, [hasAnyValue, isValid, sourcePathsRaw, deploymentName, modelName, endpoint, authType]);

  React.useEffect(() => {
    if (!discardChanges) {
      return;
    }
    setSourcePathsRaw(initialEmbeddingSource?.sourcePaths?.join(", ") || "");
    setDeploymentName(initialEmbeddingSource?.deploymentName || "");
    setModelName(initialEmbeddingSource?.modelName || "");
    setEndpoint(initialEmbeddingSource?.endpoint || "");
    setAuthType(initialEmbeddingSource?.authType || defaultAuthType);
  }, [discardChanges, initialEmbeddingSource]);

  React.useEffect(() => {
    onChange(source, isValid);
    // `onChange` is intentionally omitted from the dependency array. The parent recreates
    // its inline arrow on every render, and including it here would re-fire this effect
    // on every parent render — feeding back into the parent's setState and producing an
    // infinite loop. The effect's behavior depends only on `source` / `isValid`, which are
    // memoized from local state, so capturing a stale `onChange` reference is safe: the
    // underlying state mutation (setVectorEmbeddingPolicyData) is identity-stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, isValid]);

  return (
    <Stack style={{ marginTop: 8 }}>
      <CollapsibleSectionComponent
        disabled={disabled}
        title={`${t(Keys.controls.vectorEmbeddingPolicies.embeddingSourceSection)} (${t(Keys.common.preview)})`}
        tooltipContent={t(Keys.controls.vectorEmbeddingPolicies.embeddingSourceTooltip)}
        isExpandedByDefault={!!initialEmbeddingSource}
        dataTest={`VectorEmbeddingSource/Section/${suffix}`}
      >
        <Stack style={{ marginLeft: "10px", marginTop: 4 }} tokens={{ childrenGap: 4 }}>
          <Stack>
            <Label disabled={disabled} styles={labelStyles}>
              {t(Keys.controls.vectorEmbeddingPolicies.sourcePaths)}
            </Label>
            <TextField
              disabled={disabled}
              id={`vector-policy-embeddingSource-sourcePaths-${suffix}`}
              data-test={`VectorEmbeddingSource/SourcePaths/${suffix}`}
              placeholder={t(Keys.controls.vectorEmbeddingPolicies.sourcePathsPlaceholder)}
              styles={textFieldStyles}
              value={sourcePathsRaw}
              onChange={(_event, newValue) => setSourcePathsRaw(newValue || "")}
              errorMessage={sourcePathsError}
            />
          </Stack>
          <Stack>
            <Label disabled={disabled} styles={labelStyles}>
              {t(Keys.controls.vectorEmbeddingPolicies.deploymentName)}
            </Label>
            <TextField
              disabled={disabled}
              id={`vector-policy-embeddingSource-deploymentName-${suffix}`}
              data-test={`VectorEmbeddingSource/DeploymentName/${suffix}`}
              styles={textFieldStyles}
              value={deploymentName}
              onChange={(_event, newValue) => setDeploymentName(newValue || "")}
              errorMessage={deploymentNameError}
            />
          </Stack>
          <Stack>
            <Label disabled={disabled} styles={labelStyles}>
              {t(Keys.controls.vectorEmbeddingPolicies.modelName)}
            </Label>
            <TextField
              disabled={disabled}
              id={`vector-policy-embeddingSource-modelName-${suffix}`}
              data-test={`VectorEmbeddingSource/ModelName/${suffix}`}
              styles={textFieldStyles}
              value={modelName}
              onChange={(_event, newValue) => setModelName(newValue || "")}
              errorMessage={modelNameError}
            />
          </Stack>
          <Stack>
            <Label disabled={disabled} styles={labelStyles}>
              {t(Keys.controls.vectorEmbeddingPolicies.endpoint)}
            </Label>
            <TextField
              disabled={disabled}
              id={`vector-policy-embeddingSource-endpoint-${suffix}`}
              data-test={`VectorEmbeddingSource/Endpoint/${suffix}`}
              placeholder={t(Keys.controls.vectorEmbeddingPolicies.endpointPlaceholder)}
              styles={textFieldStyles}
              value={endpoint}
              onChange={(_event, newValue) => setEndpoint(newValue || "")}
              errorMessage={endpointError}
            />
          </Stack>
          <Stack>
            <Label disabled={disabled} styles={labelStyles}>
              {t(Keys.controls.vectorEmbeddingPolicies.authType)}
            </Label>
            <Dropdown
              disabled={disabled}
              id={`vector-policy-embeddingSource-authType-${suffix}`}
              data-test={`VectorEmbeddingSource/AuthType/${suffix}`}
              styles={dropdownStyles}
              options={getAuthTypeOptions()}
              selectedKey={authType}
              onChange={(_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
                if (option) {
                  setAuthType(option.key as VectorEmbeddingSource["authType"]);
                }
              }}
            />
          </Stack>
        </Stack>
      </CollapsibleSectionComponent>
    </Stack>
  );
};
