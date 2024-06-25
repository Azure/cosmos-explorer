import {
  Stack,
} from "@fluentui/react";
import QueryError from "Common/QueryError";
import React from "react";
import RunQuery from "../../../../images/RunQuery.png";
import InfoColor from "../../../../images/info_color.svg";
import { QueryResults } from "../../../Contracts/ViewModels";
import { ErrorList } from "./ErrorList";
import { ResultsView } from "./ResultsView";

export interface ResultsViewProps {
  isMongoDB: boolean;
  queryResults: QueryResults;
  executeQueryDocumentsPage: (firstItemIndex: number) => Promise<void>;
}

interface QueryResultProps extends ResultsViewProps {
  queryEditorContent: string;
  errors: QueryError[];
}

const ExecuteQueryCallToAction: React.FC = () => {
  return <div className="queryEditorWatermark">
    <p>
      <img src={RunQuery} alt="Execute Query Watermark" />
    </p>
    <p className="queryEditorWatermarkText">Execute a query to see the results</p>
  </div>
};

export const QueryResultSection: React.FC<QueryResultProps> = ({
  isMongoDB,
  queryEditorContent,
  errors,
  queryResults,
  executeQueryDocumentsPage,
}: QueryResultProps): JSX.Element => {
  const maybeSubQuery = queryEditorContent && /.*\(.*SELECT.*\)/i.test(queryEditorContent);

  return (
    <Stack style={{ height: "100%" }}>
      {isMongoDB && queryEditorContent.length === 0 && (
        <div className="mongoQueryHelper">
          Start by writing a Mongo query, for example: <strong>{"{'id':'foo'}"}</strong> or{" "}
          <strong>
            {"{ "}
            {" }"}
          </strong>{" "}
          to get all the documents.
        </div>
      )}
      {maybeSubQuery && (
        <div className="warningErrorContainer" aria-live="assertive">
          <div className="warningErrorContent">
            <span>
              <img className="paneErrorIcon" src={InfoColor} alt="Error" />
            </span>
            <span className="warningErrorDetailsLinkContainer">
              We detected you may be using a subquery. To learn more about subqueries effectively,{" "}
              <a
                href="https://learn.microsoft.com/azure/cosmos-db/nosql/query/subquery"
                target="_blank"
                rel="noreferrer noopener"
              >
                visit the documentation
              </a>
            </span>
          </div>
        </div>
      )}
      {/* <!-- Query Results & Errors Content Container - Start--> */}
      <div className="queryResultErrorContentContainer">
        {errors.length > 0
          ? <ErrorList errors={errors} />
          : queryResults
            ? <ResultsView queryResults={queryResults} executeQueryDocumentsPage={executeQueryDocumentsPage} isMongoDB={isMongoDB} />
            : <ExecuteQueryCallToAction />}
      </div>
    </Stack>
  );
};
