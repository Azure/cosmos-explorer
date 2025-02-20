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

  // Get the materialized views from the provided collection.
  const materializedViews = collection?.materializedViews() ?? [];

  // Helper function to fetch the view definition by matching viewId with collection id.
  const getViewDefinition = (viewId: string): string => {
    let definition = "";
    useDatabases.getState().databases.forEach((database) => {
      database.collections().forEach((coll) => {
        const materializedViewDefinition = coll.materializedViewDefinition();
        if (materializedViewDefinition && coll.id() === viewId) {
          definition = materializedViewDefinition.definition;
        }
      });
    });
    return definition;
  };

  // Build the JSON value for the editor using the fetched definitions.
  const jsonValue = JSON.stringify(
    materializedViews.map((view) => ({
      name: view.id,
      definition: getViewDefinition(view.id),
    })),
    null,
    2,
  );

  // Initialize Monaco editor with the computed JSON value.
  useEffect(() => {
    let disposed = false;
    const initMonaco = async () => {
      const monacoInstance = await loadMonaco();
      if (disposed || !editorContainerRef.current) return;

      editorRef.current = monacoInstance.editor.create(editorContainerRef.current, {
        value: jsonValue,
        language: "json",
        ariaLabel: "Materialized Views JSON",
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
      <PrimaryButton
        text="Add view"
        styles={{ root: { width: "fit-content", marginTop: 12 } }}
        onClick={() => console.log("Add view clicked")}
      />
    </div>
  );
};
