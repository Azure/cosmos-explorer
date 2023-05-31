/* eslint-disable no-console */
import { FeedOptions } from "@azure/cosmos";
import { IconButton, Image, Link, Stack, Text, TextField } from "@fluentui/react";
import { QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { getErrorMessage, handleError } from "Common/ErrorHandlingUtils";
import { shouldEnableCrossPartitionKey } from "Common/HeadersUtility";
import { MinimalQueryIterator } from "Common/IteratorUtilities";
import { queryDocuments } from "Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "Common/dataAccess/queryDocumentsPage";
import { QueryResults } from "Contracts/ViewModels";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { SaveQueryPane } from "Explorer/Panes/SaveQueryPane/SaveQueryPane";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { queryPagesUntilContentPresent } from "Utils/QueryUtils";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useState } from "react";
import SplitterLayout from "react-splitter-layout";
import CopilotIcon from "../../../images/Copilot.svg";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";

interface QueryCopilotTabProps {
  initialInput: string;
  explorer: Explorer;
}

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  initialInput,
  explorer,
}: QueryCopilotTabProps): JSX.Element => {
  const [userInput, setUserInput] = useState<string>(initialInput || "");
  const [query, setQuery] = useState<string>("");
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryIterator, setQueryIterator] = useState<MinimalQueryIterator>();
  const [queryResults, setQueryResults] = useState<QueryResults>();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const generateQuery = (): string => {
    switch (userInput) {
      case "Write a query to return all records in this table":
        return "SELECT * FROM c";
      case "Write a query to return all records in this table created in the last thirty days":
        return "SELECT * FROM c WHERE c._ts > (DATEDIFF(s, '1970-01-01T00:00:00Z', GETUTCDATE()) - 2592000) * 1000";
      case `Write a query to return all records in this table created in the last thirty days which also have the record owner as "Contoso"`:
        return `SELECT * FROM c WHERE c.owner = "Contoso" AND c._ts > (DATEDIFF(s, '1970-01-01T00:00:00Z', GETUTCDATE()) - 2592000) * 1000`;
      default:
        return "";
    }
  };

  const onExecuteQueryClick = async (): Promise<void> => {
    const queryToExecute = selectedQuery || query;
    const queryIterator = queryDocuments(QueryCopilotSampleDatabaseId, QueryCopilotSampleContainerId, queryToExecute, {
      enableCrossPartitionQuery: shouldEnableCrossPartitionKey(),
    } as FeedOptions);
    setQueryIterator(queryIterator);

    setTimeout(async () => {
      await queryDocumentsPerPage(0, queryIterator);
    }, 100);
  };

  const queryDocumentsPerPage = async (firstItemIndex: number, queryIterator: MinimalQueryIterator): Promise<void> => {
    try {
      setIsExecuting(true);
      const queryResults: QueryResults = await queryPagesUntilContentPresent(
        firstItemIndex,
        async (firstItemIndex: number) =>
          queryDocumentsPage(QueryCopilotSampleContainerId, queryIterator, firstItemIndex)
      );

      setQueryResults(queryResults);
      setErrorMessage("");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setErrorMessage(errorMessage);
      handleError(errorMessage, "executeQueryCopilotTab");
    } finally {
      setIsExecuting(false);
    }
  };

  const getCommandbarButtons = (): CommandButtonComponentProps[] => {
    const executeQueryBtnLabel = selectedQuery ? "Execute Selection" : "Execute Query";
    const executeQueryBtn = {
      iconSrc: ExecuteQueryIcon,
      iconAlt: executeQueryBtnLabel,
      onCommandClick: () => onExecuteQueryClick(),
      commandButtonLabel: executeQueryBtnLabel,
      ariaLabel: executeQueryBtnLabel,
      hasPopup: false,
    };

    const saveQueryBtn = {
      iconSrc: SaveQueryIcon,
      iconAlt: "Save Query",
      onCommandClick: () =>
        useSidePanel.getState().openSidePanel("Save Query", <SaveQueryPane explorer={explorer} queryToSave={query} />),
      commandButtonLabel: "Save Query",
      ariaLabel: "Save Query",
      hasPopup: false,
    };

    return [executeQueryBtn, saveQueryBtn];
  };

  React.useEffect(() => {
    useCommandBar.getState().setContextButtons(getCommandbarButtons());
  }, [query]);

  return (
    <Stack className="tab-pane" style={{ padding: 24, width: "100%", height: "100%" }}>
      <Stack horizontal verticalAlign="center">
        <Image src={CopilotIcon} />
        <Text style={{ marginLeft: 8, fontWeight: 600, fontSize: 16 }}>Copilot</Text>
      </Stack>
      <Stack horizontal verticalAlign="center" style={{ marginTop: 16, width: "100%" }}>
        <TextField
          value={userInput}
          onChange={(_, newValue) => setUserInput(newValue)}
          style={{ lineHeight: 30 }}
          styles={{ root: { width: "90%" } }}
        />
        <IconButton
          iconProps={{ iconName: "Send" }}
          style={{ marginLeft: 8 }}
          onClick={() => setQuery(generateQuery())}
        />
      </Stack>
      <Text style={{ marginTop: 8, marginBottom: 24, fontSize: 12 }}>
        AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
        <Link href="" target="_blank">
          Read preview terms
        </Link>
      </Text>

      <Stack className="tabPaneContentContainer">
        <SplitterLayout vertical={true} primaryIndex={0} primaryMinSize={100} secondaryMinSize={200}>
          <EditorReact
            language={"sql"}
            content={query}
            isReadOnly={false}
            ariaLabel={"Editing Query"}
            lineNumbers={"on"}
            onContentChanged={(newQuery: string) => setQuery(newQuery)}
            onContentSelected={(selectedQuery: string) => setSelectedQuery(selectedQuery)}
          />
          <QueryResultSection
            isMongoDB={false}
            queryEditorContent={selectedQuery || query}
            error={errorMessage}
            queryResults={queryResults}
            isExecuting={isExecuting}
            executeQueryDocumentsPage={(firstItemIndex: number) => queryDocumentsPerPage(firstItemIndex, queryIterator)}
          />
        </SplitterLayout>
      </Stack>
    </Stack>
  );
};
