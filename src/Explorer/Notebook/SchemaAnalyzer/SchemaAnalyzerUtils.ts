import { Notebook } from "@nteract/commutable";
import { IContent } from "@nteract/types";
import * as InMemoryContentProviderUtils from "../NotebookComponent/ContentProviders/InMemoryContentProviderUtils";

const notebookName = "schema-analyzer-component-notebook.ipynb";
const notebookPath = InMemoryContentProviderUtils.toContentUri(notebookName);
const notebook: Notebook = {
  cells: [
    {
      cell_type: "code",
      metadata: {},
      execution_count: 0,
      outputs: [],
      source: "",
    },
  ],
  metadata: {
    kernelspec: {
      displayName: "Mongo",
      language: "mongocli",
      name: "mongo",
    },
    language_info: {
      file_extension: "ipynb",
      mimetype: "application/json",
      name: "mongo",
      version: "1.0",
    },
  },
  nbformat: 4,
  nbformat_minor: 4,
};

export const SchemaAnalyzerNotebook: IContent<"notebook"> = {
  name: notebookName,
  path: notebookPath,
  type: "notebook",
  writable: true,
  created: "",
  last_modified: "",
  mimetype: "application/x-ipynb+json",
  content: notebook,
  format: "json",
};
