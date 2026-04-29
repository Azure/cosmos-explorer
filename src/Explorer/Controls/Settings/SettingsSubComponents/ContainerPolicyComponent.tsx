import { DefaultButton, Pivot, PivotItem, Stack } from "@fluentui/react";
import { FullTextPolicy, VectorEmbedding, VectorEmbeddingPolicy, VectorIndex } from "Contracts/DataModels";
import {
    FullTextPoliciesComponent,
    getFullTextLanguageOptions,
} from "Explorer/Controls/FullTextSeach/FullTextPoliciesComponent";
import { titleAndInputStackProps } from "Explorer/Controls/Settings/SettingsRenderUtils";
import { ContainerPolicyTabTypes, isDirty } from "Explorer/Controls/Settings/SettingsUtils";
import { VectorEmbeddingPoliciesComponent } from "Explorer/Controls/VectorSearch/VectorEmbeddingPoliciesComponent";
import { Keys, t } from "Localization";
import React from "react";

export interface ContainerPolicyComponentProps {
  vectorEmbeddingPolicy: VectorEmbeddingPolicy;
  vectorEmbeddingPolicyBaseline: VectorEmbeddingPolicy;
  onVectorEmbeddingPolicyChange: (newVectorEmbeddingPolicy: VectorEmbeddingPolicy) => void;
  onVectorEmbeddingPolicyDirtyChange: (isVectorEmbeddingPolicyDirty: boolean) => void;
  onVectorEmbeddingPolicyValidationChange: (isValid: boolean) => void;
  vectorIndexes: VectorIndex[];
  vectorIndexesBaseline: VectorIndex[];
  onVectorIndexesChange: (newVectorIndexes: VectorIndex[]) => void;
  isVectorSearchEnabled: boolean;
  fullTextPolicy: FullTextPolicy;
  fullTextPolicyBaseline: FullTextPolicy;
  onFullTextPolicyChange: (newFullTextPolicy: FullTextPolicy) => void;
  onFullTextPolicyDirtyChange: (isFullTextPolicyDirty: boolean) => void;
  isFullTextSearchEnabled: boolean;
  shouldDiscardContainerPolicies: boolean;
  resetShouldDiscardContainerPolicyChange: () => void;
  isGlobalSecondaryIndex?: boolean;
}

export const ContainerPolicyComponent: React.FC<ContainerPolicyComponentProps> = ({
  vectorEmbeddingPolicy,
  vectorEmbeddingPolicyBaseline,
  onVectorEmbeddingPolicyChange,
  onVectorEmbeddingPolicyDirtyChange,
  onVectorEmbeddingPolicyValidationChange,
  vectorIndexes,
  vectorIndexesBaseline,
  onVectorIndexesChange,
  isVectorSearchEnabled,
  fullTextPolicy,
  fullTextPolicyBaseline,
  onFullTextPolicyChange,
  onFullTextPolicyDirtyChange,
  isFullTextSearchEnabled,
  shouldDiscardContainerPolicies,
  resetShouldDiscardContainerPolicyChange,
}) => {
  const [selectedTab, setSelectedTab] = React.useState<ContainerPolicyTabTypes>(
    ContainerPolicyTabTypes.VectorPolicyTab,
  );
  const [vectorEmbeddings, setVectorEmbeddings] = React.useState<VectorEmbedding[]>(
    vectorEmbeddingPolicy?.vectorEmbeddings ?? [],
  );
  const [vectorEmbeddingsBaseline, setVectorEmbeddingsBaseline] = React.useState<VectorEmbedding[]>(
    vectorEmbeddingPolicyBaseline?.vectorEmbeddings ?? [],
  );
  const [discardVectorChanges, setDiscardVectorChanges] = React.useState<boolean>(false);
  const [fullTextSearchPolicy, setFullTextSearchPolicy] = React.useState<FullTextPolicy>();
  const [fullTextSearchPolicyBaseline, setFullTextSearchPolicyBaseline] = React.useState<FullTextPolicy>();
  const [discardFullTextChanges, setDiscardFullTextChanges] = React.useState<boolean>(false);

  React.useEffect(() => {
    setVectorEmbeddings(vectorEmbeddingPolicy?.vectorEmbeddings);
    setVectorEmbeddingsBaseline(vectorEmbeddingPolicyBaseline?.vectorEmbeddings);
  }, [vectorEmbeddingPolicy, vectorEmbeddingPolicyBaseline]);

  React.useEffect(() => {
    setFullTextSearchPolicy(fullTextPolicy);
    setFullTextSearchPolicyBaseline(fullTextPolicyBaseline);
  }, [fullTextPolicy, fullTextPolicyBaseline]);

  React.useEffect(() => {
    if (shouldDiscardContainerPolicies) {
      setVectorEmbeddings(vectorEmbeddingPolicyBaseline?.vectorEmbeddings);
      setDiscardVectorChanges(true);
      setFullTextSearchPolicy(fullTextPolicyBaseline);
      setDiscardFullTextChanges(true);
      resetShouldDiscardContainerPolicyChange();
    }
  });

  const checkAndSendVectorEmbeddingPoliciesToSettings = (
    newVectorEmbeddings: VectorEmbedding[],
    newVectorIndexes: VectorIndex[],
    validationPassed: boolean,
  ): void => {
    onVectorEmbeddingPolicyValidationChange(validationPassed);
    const isVectorDirty: boolean = isDirty(newVectorEmbeddings, vectorEmbeddingsBaseline);
    onVectorEmbeddingPolicyDirtyChange(isVectorDirty);
    if (isVectorDirty) {
      onVectorEmbeddingPolicyChange({ vectorEmbeddings: newVectorEmbeddings });
    }
    if (isDirty(newVectorIndexes ?? [], vectorIndexesBaseline ?? [])) {
      onVectorIndexesChange(newVectorIndexes);
    }
  };

  const checkAndSendFullTextPolicyToSettings = (newFullTextPolicy: FullTextPolicy): void => {
    if (isDirty(newFullTextPolicy, fullTextSearchPolicyBaseline)) {
      onFullTextPolicyDirtyChange(true);
      onFullTextPolicyChange(newFullTextPolicy);
    } else {
      resetShouldDiscardContainerPolicyChange();
    }
  };

  const onVectorChangesDiscarded = (): void => {
    setDiscardVectorChanges(false);
  };

  const onFullTextChangesDiscarded = (): void => {
    setDiscardFullTextChanges(false);
  };

  const onPivotChange = (item: PivotItem): void => {
    const selectedTab = ContainerPolicyTabTypes[item.props.itemKey as keyof typeof ContainerPolicyTabTypes];
    setSelectedTab(selectedTab);
  };

  return (
    <div>
      <Pivot
        onLinkClick={onPivotChange}
        selectedKey={ContainerPolicyTabTypes[selectedTab]}
        styles={{
          root: {
            color: "var(--colorNeutralForeground1)",
          },
          link: {
            color: "var(--colorNeutralForeground1)",
            backgroundColor: "transparent",
            selectors: {
              ":hover": {
                color: "var(--colorNeutralForeground1)",
                backgroundColor: "transparent",
              },
              ":active": {
                color: "var(--colorNeutralForeground1)",
                backgroundColor: "transparent",
              },
            },
          },
          linkIsSelected: {
            color: "var(--colorNeutralForeground1)",
            backgroundColor: "transparent",
            selectors: {
              ":before": {
                color: "var(--colorNeutralForeground1)",
                backgroundColor: "var(--colorBrandForeground1)",
              },
              ":hover": {
                color: "var(--colorNeutralForeground1)",
                backgroundColor: "transparent",
              },
              ":active": {
                color: "var(--colorNeutralForeground1)",
                backgroundColor: "transparent",
              },
            },
          },
          linkContent: {
            color: "inherit",
          },
          text: {
            color: "inherit",
          },
        }}
      >
        {isVectorSearchEnabled && (
          <PivotItem
            itemKey={ContainerPolicyTabTypes[ContainerPolicyTabTypes.VectorPolicyTab]}
            style={{ marginTop: 20, color: "var(--colorNeutralForeground1)" }}
            headerText={t(Keys.controls.settings.containerPolicy.vectorPolicy)}
          >
            <Stack {...titleAndInputStackProps} styles={{ root: { position: "relative", maxWidth: "400px" } }}>
              <VectorEmbeddingPoliciesComponent
                vectorEmbeddingsBaseline={vectorEmbeddingsBaseline}
                vectorEmbeddings={vectorEmbeddings}
                vectorIndexes={vectorIndexes ?? []}
                onVectorEmbeddingChange={(
                  newVectorEmbeddings: VectorEmbedding[],
                  newVectorIndexes: VectorIndex[],
                  validationPassed: boolean,
                ) =>
                  checkAndSendVectorEmbeddingPoliciesToSettings(newVectorEmbeddings, newVectorIndexes, validationPassed)
                }
                discardChanges={discardVectorChanges}
                onChangesDiscarded={onVectorChangesDiscarded}
              />
            </Stack>
          </PivotItem>
        )}
        {isFullTextSearchEnabled && (
          <PivotItem
            itemKey={ContainerPolicyTabTypes[ContainerPolicyTabTypes.FullTextPolicyTab]}
            style={{ marginTop: 20, color: "var(--colorNeutralForeground1)" }}
            headerText={t(Keys.controls.settings.containerPolicy.fullTextPolicy)}
          >
            <Stack {...titleAndInputStackProps} styles={{ root: { position: "relative", maxWidth: "400px" } }}>
              {fullTextSearchPolicy ? (
                <FullTextPoliciesComponent
                  fullTextPolicy={fullTextSearchPolicy}
                  onFullTextPathChange={(newFullTextPolicy: FullTextPolicy) =>
                    checkAndSendFullTextPolicyToSettings(newFullTextPolicy)
                  }
                  discardChanges={discardFullTextChanges}
                  onChangesDiscarded={onFullTextChangesDiscarded}
                />
              ) : (
                <DefaultButton
                  id={"create-full-text-policy"}
                  styles={{
                    root: {
                      fontSize: 12,
                      color: "var(--colorNeutralForeground1)",
                      backgroundColor: "transparent",
                      borderColor: "var(--colorNeutralForeground1)",
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
                    checkAndSendFullTextPolicyToSettings({
                      defaultLanguage: getFullTextLanguageOptions()[0].key as never,
                      fullTextPaths: [],
                    });
                  }}
                >
                  {t(Keys.controls.settings.containerPolicy.createFullTextPolicy)}
                </DefaultButton>
              )}
            </Stack>
          </PivotItem>
        )}
      </Pivot>
    </div>
  );
};
