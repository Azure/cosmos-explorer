import { QueryDocumentsPerPage } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { QueryCopilotState, useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

export const QueryCopilotResults: React.FC = (): JSX.Element => {
  return (
    <QueryResultSection
      isMongoDB={false}
      queryEditorContent={useQueryCopilot.getState().selectedQuery || useQueryCopilot.getState().query}
      errors={useQueryCopilot.getState().errors}
      queryResults={useQueryCopilot.getState().queryResults}
      isExecuting={useQueryCopilot.getState().isExecuting}
      executeQueryDocumentsPage={(firstItemIndex: number) =>
        QueryDocumentsPerPage(
          firstItemIndex,
          useQueryCopilot.getState().queryIterator,
          useQueryCopilot as Partial<QueryCopilotState>,
        )
      }
    />
  );
};
