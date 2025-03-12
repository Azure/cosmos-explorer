import { PrimaryButton } from "@fluentui/react";
import { loadMonaco } from "Explorer/LazyMonaco";
import { useDatabases } from "Explorer/useDatabases";
import * as monaco from "monaco-editor";
import React, { useEffect, useRef } from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";

export interface MaterializedViewSourceComponentProps {
  collection: ViewModels.Collection;
}

export const MaterializedViewSourceComponent: React.FC<MaterializedViewSourceComponentProps> = ({ collection }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

  const materializedViews = collection?.materializedViews() ?? [];

  // Helper function to fetch the definition and partition key of targetContainer by traversing through all collections and matching id from MaterializedViews[] with collection id.
  const getViewDetails = (viewId: string): { definition: string; partitionKey: string[] } => {
    let definition = "";
    let partitionKey: string[] = [];

    useDatabases.getState().databases.find((database) => {
      const collection = database.collections().find((collection) => collection.id() === viewId);
      if (collection) {
        const materializedViewDefinition = collection.materializedViewDefinition();
        materializedViewDefinition && (definition = materializedViewDefinition.definition);
        collection.partitionKey?.paths && (partitionKey = collection.partitionKey.paths);
      }
    });

    return { definition, partitionKey };
  };

  //JSON value for the editor using the fetched id and definitions.
  const jsonValue = JSON.stringify(
    materializedViews.map((view) => {
      const { definition, partitionKey } = getViewDetails(view.id);
      return {
        name: view.id,
        partitionKey: partitionKey.join(", "),
        definition,
      };
    }),
    null,
    2,
  );

  // Initialize Monaco editor with the computed JSON value.
  useEffect(() => {
    let disposed = false;
    const initMonaco = async () => {
      const monacoInstance = await loadMonaco();
      if (disposed || !editorContainerRef.current) {
        return;
      }

      editorRef.current = monacoInstance.editor.create(editorContainerRef.current, {
        value: jsonValue,
        language: "json",
        ariaLabel: "Materialized Views JSON",
        readOnly: true,
      });
    };

    initMonaco();
    return () => {
      disposed = true;
      editorRef.current?.dispose();
    };
  }, [jsonValue]);

  // Update the editor when the jsonValue changes.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(jsonValue);
    }
  }, [jsonValue]);

  return (
    <div>
      <div
        ref={editorContainerRef}
        style={{
          height: 250,
          border: "1px solid #ccc",
          borderRadius: 4,
          overflow: "hidden",
        }}
      />
      <PrimaryButton text="Add view" styles={{ root: { width: "fit-content", marginTop: 12 } }} onClick={() => {}} />
    </div>
  );
};
