import { loadMonaco } from "Explorer/LazyMonaco";
import * as monaco from "monaco-editor";
import React, { useEffect, useRef } from "react";
export interface MaterializedViewSourceComponentProps {
  jsonValue: string;
}

export const MaterializedViewSourceComponent: React.FC<MaterializedViewSourceComponentProps> = ({ jsonValue }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

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
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(jsonValue);
    }
  }, [jsonValue]);

  return (
    <div
      ref={editorContainerRef}
      style={{ height: 250, border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" }}
    />
  );
};
