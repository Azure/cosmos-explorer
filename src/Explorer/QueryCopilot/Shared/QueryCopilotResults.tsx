import { QueryDocumentsPerPage } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

export const QueryCopilotResults: React.FC = (): JSX.Element => {
  return (
    <QueryResultSection
      isMongoDB={false}
      queryEditorContent={useQueryCopilot.getState().selectedQuery || useQueryCopilot.getState().query}
      error={useQueryCopilot.getState().errorMessage}
      queryResults={useQueryCopilot.getState().queryResults}
      isExecuting={useQueryCopilot.getState().isExecuting}
      executeQueryDocumentsPage={(firstItemIndex: number) =>
        QueryDocumentsPerPage(firstItemIndex, useQueryCopilot.getState().queryIterator, useQueryCopilot)
      }
    />
  );
};
