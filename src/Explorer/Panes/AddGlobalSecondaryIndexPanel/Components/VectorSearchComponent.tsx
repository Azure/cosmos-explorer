import { Stack } from "@fluentui/react";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { VectorEmbeddingPoliciesComponent } from "Explorer/Controls/VectorSearch/VectorEmbeddingPoliciesComponent";
import {
  ContainerVectorPolicyTooltipContent,
  scrollToSection,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";

export interface VectorSearchComponentProps {
  vectorEmbeddingPolicy: VectorEmbedding[];
  setVectorEmbeddingPolicy: React.Dispatch<React.SetStateAction<VectorEmbedding[]>>;
  vectorIndexingPolicy: VectorIndex[];
  setVectorIndexingPolicy: React.Dispatch<React.SetStateAction<VectorIndex[]>>;
  setVectorPolicyValidated: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VectorSearchComponent = (props: VectorSearchComponentProps): JSX.Element => {
  const {
    vectorEmbeddingPolicy,
    setVectorEmbeddingPolicy,
    vectorIndexingPolicy,
    setVectorIndexingPolicy,
    setVectorPolicyValidated,
  } = props;

  return (
    <Stack>
      <CollapsibleSectionComponent
        title="Container Vector Policy"
        isExpandedByDefault={false}
        onExpand={() => {
          scrollToSection("collapsibleVectorPolicySectionContent");
        }}
        tooltipContent={ContainerVectorPolicyTooltipContent()}
      >
        <Stack id="collapsibleVectorPolicySectionContent" styles={{ root: { position: "relative" } }}>
          <Stack styles={{ root: { paddingLeft: 40 } }}>
            <VectorEmbeddingPoliciesComponent
              vectorEmbeddings={vectorEmbeddingPolicy}
              vectorIndexes={vectorIndexingPolicy}
              onVectorEmbeddingChange={(
                vectorEmbeddingPolicy: VectorEmbedding[],
                vectorIndexingPolicy: VectorIndex[],
                vectorPolicyValidated: boolean,
              ) => {
                setVectorEmbeddingPolicy(vectorEmbeddingPolicy);
                setVectorIndexingPolicy(vectorIndexingPolicy);
                setVectorPolicyValidated(vectorPolicyValidated);
              }}
            />
          </Stack>
        </Stack>
      </CollapsibleSectionComponent>
    </Stack>
  );
};
