import { Link, tokens } from "@fluentui/react-components";
import QueryError from "Common/QueryError";
import { IndeterminateProgressBar } from "Explorer/Controls/IndeterminateProgressBar";
import { MessageBanner } from "Explorer/Controls/MessageBanner";
import { useQueryTabStyles } from "Explorer/Tabs/QueryTab/Styles";
import React from "react";
import RunQuery from "../../../../images/RunQuery.png";
import { QueryResults } from "../../../Contracts/ViewModels";
import { ErrorList } from "./ErrorList";
import { ResultsView } from "./ResultsView";
import useZoomLevel from "hooks/useZoomLevel";
import { conditionalClass } from "Utils/StyleUtils";

export interface ResultsViewProps {
  isMongoDB: boolean;
  queryResults: QueryResults;
  executeQueryDocumentsPage: (firstItemIndex: number) => Promise<void>;
}

interface QueryResultProps extends ResultsViewProps {
  queryEditorContent: string;
  errors: QueryError[];
  isExecuting: boolean;
}

const ExecuteQueryCallToAction: React.FC = () => {
  const styles = useQueryTabStyles();
  const isZoomed = useZoomLevel();
  return (
    <div data-test="QueryTab/ResultsPane/ExecuteCTA" className={styles.executeCallToAction}>
      <div>
        <p>
          <img
            className={`${styles.responsiveImg} ${conditionalClass(isZoomed, styles.zoomedImageSize)}`}
            src={RunQuery}
            aria-hidden="true"
          />
        </p>
        <p style={{ color: tokens.colorNeutralForeground1 }}>Execute a query to see the results</p>
      </div>
    </div>
  );
};

export const QueryResultSection: React.FC<QueryResultProps> = ({
  isMongoDB,
  queryEditorContent,
  errors,
  queryResults,
  executeQueryDocumentsPage,
  isExecuting,
}: QueryResultProps): JSX.Element => {
  const styles = useQueryTabStyles();
  const maybeSubQuery = queryEditorContent && /.*\(.*SELECT.*\)/i.test(queryEditorContent);

  return (
    <div data-test="QueryTab/ResultsPane" className={styles.queryResultsPanel}>
      {isExecuting && <IndeterminateProgressBar />}
      <MessageBanner
        messageId="QueryEditor.EmptyMongoQuery"
        visible={isMongoDB && queryEditorContent.length === 0}
        className={styles.queryResultsMessage}
      >
        Start by writing a Mongo query, for example: <strong>{"{'id':'foo'}"}</strong> or{" "}
        <strong>
          {"{ "}
          {" }"}
        </strong>{" "}
        to get all the documents.
      </MessageBanner>
      {/* {maybeSubQuery && ( */}
      <MessageBanner
        messageId="QueryEditor.SubQueryWarning"
        visible={maybeSubQuery}
        className={styles.queryResultsMessage}
      >
        We detected you may be using a subquery. To learn more about subqueries effectively,{" "}
        <Link
          href="https://learn.microsoft.com/azure/cosmos-db/nosql/query/subquery"
          target="_blank"
          rel="noreferrer noopener"
        >
          visit the documentation
        </Link>
      </MessageBanner>
      {/* <!-- Query Results & Errors Content Container - Start--> */}
      {errors.length > 0 ? (
        <ErrorList errors={errors} />
      ) : queryResults ? (
        <ResultsView
          queryResults={queryResults}
          executeQueryDocumentsPage={executeQueryDocumentsPage}
          isMongoDB={isMongoDB}
        />
      ) : (
        <ExecuteQueryCallToAction />
      )}
    </div>
  );
};
