import { Stack } from "@fluentui/react";
import { VectorEmbeddingPolicy } from "Contracts/DataModels";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { titleAndInputStackProps } from "Explorer/Controls/Settings/SettingsRenderUtils";
import React from "react";

export interface ContainerVectorPolicyComponentProps {
  vectorEmbeddingPolicy: VectorEmbeddingPolicy;
}

export const ContainerVectorPolicyComponent: React.FC<ContainerVectorPolicyComponentProps> = ({
  vectorEmbeddingPolicy,
}) => {
  return (
    <Stack {...titleAndInputStackProps} styles={{ root: { position: "relative" } }}>
      <EditorReact
        language={"json"}
        content={JSON.stringify(vectorEmbeddingPolicy || {}, null, 4)}
        isReadOnly={true}
        wordWrap={"on"}
        ariaLabel={"Container vector policy"}
        lineNumbers={"on"}
        scrollBeyondLastLine={false}
        className={"settingsV2Editor"}
        spinnerClassName={"settingsV2EditorSpinner"}
        fontSize={14}
      />
    </Stack>
  );
};
