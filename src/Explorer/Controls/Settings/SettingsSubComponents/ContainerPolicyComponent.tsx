import { DefaultButton, Pivot, PivotItem, Stack } from "@fluentui/react";
import { FullTextPolicy, VectorEmbedding, VectorEmbeddingPolicy } from "Contracts/DataModels";
import { FullTextPoliciesComponent, getFullTextLanguageOptions } from "Explorer/Controls/FullTextSeach/FullTextPoliciesComponent";
import { titleAndInputStackProps } from "Explorer/Controls/Settings/SettingsRenderUtils";
import { ContainerPolicyTabTypes, isDirty } from "Explorer/Controls/Settings/SettingsUtils";
import { VectorEmbeddingPoliciesComponent } from "Explorer/Controls/VectorSearch/VectorEmbeddingPoliciesComponent";
import React from "react";

export interface ContainerPolicyComponentProps {
  vectorEmbeddingPolicy: VectorEmbeddingPolicy;
  vectorEmbeddingPolicyBaseline: VectorEmbeddingPolicy;
  onVectorEmbeddingPolicyChange: (newVectorEmbeddingPolicy: VectorEmbeddingPolicy) => void;
  onVectorEmbeddingPolicyDirtyChange: (isVectorEmbeddingPolicyDirty: boolean) => void;
  fullTextPolicy: FullTextPolicy;
  fullTextPolicyBaseline: FullTextPolicy;
  onFullTextPolicyChange: (newFullTextPolicy: FullTextPolicy) => void;
  onFullTextPolicyDirtyChange: (isFullTextPolicyDirty: boolean) => void;
  shouldDiscardContainerPolicies: boolean;
  resetShouldDiscardContainerPolicyChange: () => void;
}

//CTODO: add unit tests
export const ContainerPolicyComponent: React.FC<ContainerPolicyComponentProps> = ({
  vectorEmbeddingPolicy,
  vectorEmbeddingPolicyBaseline,
  onVectorEmbeddingPolicyChange,
  onVectorEmbeddingPolicyDirtyChange,
  fullTextPolicy,
  fullTextPolicyBaseline,
  onFullTextPolicyChange,
  onFullTextPolicyDirtyChange,
  shouldDiscardContainerPolicies,
  resetShouldDiscardContainerPolicyChange,
}) => {
  const [selectedTab, setSelectedTab] = React.useState<ContainerPolicyTabTypes>(ContainerPolicyTabTypes.VectorPolicyTab);
  const [vectorEmbeddings, setVectorEmbeddings] = React.useState<VectorEmbedding[]>();
  const [vectorEmbeddingsBaseline, setVectorEmbeddingsBaseline] = React.useState<VectorEmbedding[]>();
  const [discardVectorChanges, setDiscardVectorChanges] = React.useState<boolean>(false);
  const [fullTextSearchPolicy, setFullTextSearchPolicy] = React.useState<FullTextPolicy>();
  const [fullTextSearchPolicyBaseline, setFullTextSearchPolicyBaseline] = React.useState<FullTextPolicy>();
  const [discardFullTextChanges, setDiscardFullTextChanges] = React.useState<boolean>(false);


  React.useEffect(() => {
    setVectorEmbeddings(vectorEmbeddingPolicy.vectorEmbeddings);
    setVectorEmbeddingsBaseline(vectorEmbeddingPolicyBaseline.vectorEmbeddings);
  }, [vectorEmbeddingPolicy]);

  React.useEffect(() => {
    setFullTextSearchPolicy(fullTextPolicy);
    setFullTextSearchPolicyBaseline(fullTextPolicyBaseline);
  }, [fullTextPolicy, fullTextPolicyBaseline])

  React.useEffect(() => {
    if (shouldDiscardContainerPolicies) {
      setVectorEmbeddings(vectorEmbeddingPolicyBaseline.vectorEmbeddings);
      setDiscardVectorChanges(true);
      setFullTextSearchPolicy(fullTextPolicyBaseline);
      setDiscardFullTextChanges(true);
      resetShouldDiscardContainerPolicyChange();
    }
  });

  const checkAndSendVectorEmbeddingPoliciesToSettings = (newVectorEmbeddings: VectorEmbedding[]): void => {
    if (isDirty(newVectorEmbeddings, vectorEmbeddingsBaseline)) {
      onVectorEmbeddingPolicyDirtyChange(true);
      onVectorEmbeddingPolicyChange({ vectorEmbeddings: newVectorEmbeddings });
    } else {
      resetShouldDiscardContainerPolicyChange();
    }
  };

  const checkAndSendFullTextPolicyToSettings = (newFullTextPolicy: FullTextPolicy): void => {
    if (isDirty(newFullTextPolicy, fullTextSearchPolicyBaseline)) {
      onFullTextPolicyDirtyChange(true);
      onFullTextPolicyChange(newFullTextPolicy);
    } else {
      resetShouldDiscardContainerPolicyChange();
    }
  }

  const onVectorChangesDiscarded = (): void => {
    setDiscardVectorChanges(false);
  }

  const onFullTextChangesDiscarded = (): void => {
    setDiscardFullTextChanges(false);
  }

  const onPivotChange = (item: PivotItem): void => {
    const selectedTab = ContainerPolicyTabTypes[item.props.itemKey as keyof typeof ContainerPolicyTabTypes];
    setSelectedTab(selectedTab);
  };

  return (
    <div>
      <Pivot
        onLinkClick={onPivotChange}
        selectedKey={ContainerPolicyTabTypes[selectedTab]}
      >
        <PivotItem
          itemKey={ContainerPolicyTabTypes[ContainerPolicyTabTypes.VectorPolicyTab]}
          style={{ marginTop: 20 }}
          headerText="Vector Policy"
        >
          <Stack {...titleAndInputStackProps} styles={{ root: { position: "relative", maxWidth: "400px" } }}>
            {vectorEmbeddings && (
              <VectorEmbeddingPoliciesComponent
                disabled={true}
                vectorEmbeddings={vectorEmbeddings}
                vectorIndexes={undefined}
                onVectorEmbeddingChange={(vectorEmbeddings: VectorEmbedding[], _vectorIndexes, _validationPassed) =>
                  checkAndSendVectorEmbeddingPoliciesToSettings(vectorEmbeddings)}
                discardChanges={discardVectorChanges}
                onChangesDiscarded={onVectorChangesDiscarded}
              />
            )}
          </Stack>
        </PivotItem>
        <PivotItem
          itemKey={ContainerPolicyTabTypes[ContainerPolicyTabTypes.FullTextPolicyTab]}
          style={{ marginTop: 20 }}
          headerText="Full Text Policy"
        >
          <Stack {...titleAndInputStackProps} styles={{ root: { position: "relative", maxWidth: "400px" } }}>
            {fullTextSearchPolicy ? (
              <FullTextPoliciesComponent
                fullTextPolicy={fullTextSearchPolicy}
                onFullTextPathChange={(newFullTextPolicy: FullTextPolicy, _fullTextIndexes, _validationPassed) =>
                  checkAndSendFullTextPolicyToSettings(newFullTextPolicy)}
                displayIndexFields={false}
                discardChanges={discardFullTextChanges}
                onChangesDiscarded={onFullTextChangesDiscarded}
              />
            ) : (
              <DefaultButton
                id={"create-full-text-policy"}
                styles={{ root: { fontSize: 12 } }}
                onClick={() => {
                  checkAndSendFullTextPolicyToSettings({
                    defaultLanguage: getFullTextLanguageOptions()[0].key as never,
                    fullTextPaths: []
                  });
                }}
              >Create new full text search policy</DefaultButton>
            )}
          </Stack>
        </PivotItem>
      </Pivot>
    </div>
  );
};

const orderObjectKeys = (unorderedObject: any): any => {
  return Object.keys(unorderedObject)
    .sort()
    .reduce(
      (obj: any, key) => {
        obj[key] = unorderedObject[key];
        return obj;
      },
      {}
    );
};