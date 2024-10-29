import { Stack } from "@fluentui/react";
import { VectorEmbedding, VectorEmbeddingPolicy } from "Contracts/DataModels";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { titleAndInputStackProps } from "Explorer/Controls/Settings/SettingsRenderUtils";
import { isDirty } from "Explorer/Controls/Settings/SettingsUtils";
import { VectorEmbeddingPoliciesComponent } from "Explorer/Controls/VectorSearch/VectorEmbeddingPoliciesComponent";
import React from "react";

export interface ContainerVectorPolicyComponentProps {
  vectorEmbeddingPolicy: VectorEmbeddingPolicy;
  vectorEmbeddingPolicyBaseline: VectorEmbeddingPolicy;
  onVectorEmbeddingPolicyChange: (newVectorEmbeddingPolicy: VectorEmbeddingPolicy) => void;
  onVectorEmbeddingPolicyDirtyChange: (isVectorEmbeddingPolicyDirty: boolean) => void;
  shouldDiscardVectorEmbeddingPolicy: boolean;
  resetShouldDiscardVectorEmbeddingPolicyChange: () => void;
}

//CTODO: add unit tests
export const ContainerVectorPolicyComponent: React.FC<ContainerVectorPolicyComponentProps> = ({
  vectorEmbeddingPolicy,
  vectorEmbeddingPolicyBaseline,
  onVectorEmbeddingPolicyChange,
  onVectorEmbeddingPolicyDirtyChange,
  shouldDiscardVectorEmbeddingPolicy,
  resetShouldDiscardVectorEmbeddingPolicyChange,
}) => {
  const [vectorEmbeddings, setVectorEmbeddings] = React.useState<VectorEmbedding[]>();
  const [vectorEmbeddingsBaseline, setVectorEmbeddingsBaseline] = React.useState<VectorEmbedding[]>();
  const [discardChanges, setDiscardChanges] = React.useState<boolean>(false);

  React.useEffect(() => {
    setVectorEmbeddings(vectorEmbeddingPolicy.vectorEmbeddings);
    setVectorEmbeddingsBaseline(vectorEmbeddingPolicyBaseline.vectorEmbeddings);
  }, [vectorEmbeddingPolicy]);

  React.useEffect(() => {
    if (shouldDiscardVectorEmbeddingPolicy) {
      setVectorEmbeddings(vectorEmbeddingPolicyBaseline.vectorEmbeddings);
      setDiscardChanges(true);
      resetShouldDiscardVectorEmbeddingPolicyChange();
    }
  });

  const checkAndSendVectorEmbeddingPolicyToSettings = (newVectorEmbeddings: VectorEmbedding[]): void => {
    if (isDirty(newVectorEmbeddings, vectorEmbeddingsBaseline)) {
      onVectorEmbeddingPolicyDirtyChange(true);
      onVectorEmbeddingPolicyChange({ vectorEmbeddings: newVectorEmbeddings });
    } else {
      resetShouldDiscardVectorEmbeddingPolicyChange();
    }
  };

  const onChangesDicarded = (): void => {
    setDiscardChanges(false);
  }

  return (
    <Stack {...titleAndInputStackProps} styles={{ root: { position: "relative", maxWidth: "400px" } }}>
      {vectorEmbeddings && (
        <>
          <VectorEmbeddingPoliciesComponent
            vectorEmbeddings={vectorEmbeddings}
            vectorIndexes={undefined}
            onVectorEmbeddingChange={(vectorEmbeddings: VectorEmbedding[], _vectorIndexes, _validationPassed) =>
              checkAndSendVectorEmbeddingPolicyToSettings(vectorEmbeddings)}
            discardChanges={discardChanges}
            onChangesDiscarded={onChangesDicarded}
          />
          <br />
          <br />
          <EditorReact
            language={"json"}
            content={JSON.stringify(vectorEmbeddings || {}, null, 4)}
            isReadOnly={true}
            wordWrap={"on"}
            ariaLabel={"Container vector policy"}
            lineNumbers={"on"}
            scrollBeyondLastLine={false}
            className={"settingsV2Editor"}
            spinnerClassName={"settingsV2EditorSpinner"}
            fontSize={14}
          />
        </>
      )}
    </Stack>
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