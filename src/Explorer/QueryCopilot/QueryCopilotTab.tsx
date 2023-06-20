/* eslint-disable no-console */
import { FeedOptions } from "@azure/cosmos";
import {
  Callout,
  CommandBarButton,
  DirectionalHint,
  IconButton,
  Image,
  Link,
  Separator,
  Spinner,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import {
  QueryCopilotSampleContainerId,
  QueryCopilotSampleContainerSchema,
  QueryCopilotSampleDatabaseId,
} from "Common/Constants";
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
import { submitFeedback } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { queryPagesUntilContentPresent } from "Utils/QueryUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
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

interface GenerateSQLQueryResponse {
  apiVersion: string;
  sql: string;
  explanation: string;
  generateStart: string;
  generateEnd: string;
}

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  initialInput,
  explorer,
}: QueryCopilotTabProps): JSX.Element => {
  const hideFeedbackModalForLikedQueries = useQueryCopilot((state) => state.hideFeedbackModalForLikedQueries);
  const [userInput, setUserInput] = useState<string>(initialInput || "");
  const [generatedQuery, setGeneratedQuery] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [isGeneratingQuery, setIsGeneratingQuery] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [likeQuery, setLikeQuery] = useState<boolean>();
  const [showCallout, setShowCallout] = useState<boolean>(false);
  const [queryIterator, setQueryIterator] = useState<MinimalQueryIterator>();
  const [queryResults, setQueryResults] = useState<QueryResults>();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const generateSQLQuery = async (): Promise<void> => {
    try {
      setIsGeneratingQuery(true);
      const payload = {
        containerSchema: QueryCopilotSampleContainerSchema,
        userPrompt: userInput,
      };
      const response = await fetch("https://copilotorchestrater.azurewebsites.net/generateSQLQuery", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
      if (generateSQLQueryResponse?.sql) {
        let query = `-- **Prompt:** ${userInput}\r\n`;
        if (generateSQLQueryResponse.explanation) {
          query += `-- **Explanation of query:** ${generateSQLQueryResponse.explanation}\r\n`;
        }
        query += generateSQLQueryResponse.sql;
        setQuery(query);
        setGeneratedQuery(generateSQLQueryResponse.sql);
      }
    } catch (error) {
      handleError(error, "executeNaturalLanguageQuery");
      throw error;
    } finally {
      setIsGeneratingQuery(false);
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
  }, [query, selectedQuery]);

  React.useEffect(() => {
    if (initialInput) {
      generateSQLQuery();
    }
  }, []);

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
          disabled={isGeneratingQuery}
        />
        <IconButton
          iconProps={{ iconName: "Send" }}
          disabled={isGeneratingQuery}
          style={{ marginLeft: 8 }}
          onClick={() => generateSQLQuery()}
        />
        {isGeneratingQuery && <Spinner style={{ marginLeft: 8 }} />}
      </Stack>
      <Text style={{ marginTop: 8, marginBottom: 24, fontSize: 12 }}>
        AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
        <Link href="" target="_blank">
          Read preview terms
        </Link>
      </Text>

      <Stack style={{ backgroundColor: "#FFF8F0", padding: "2px 8px" }} horizontal verticalAlign="center">
        <Text style={{ fontWeight: 600, fontSize: 12 }}>Provide feedback on the query generated</Text>
        {showCallout && !hideFeedbackModalForLikedQueries && (
          <Callout
            style={{ padding: 8 }}
            target="#likeBtn"
            onDismiss={() => {
              setShowCallout(false);
              submitFeedback({ generatedQuery, likeQuery, description: "", userPrompt: userInput });
            }}
            directionalHint={DirectionalHint.topCenter}
          >
            <Text>
              Thank you. Need to give{" "}
              <Link
                onClick={() => {
                  setShowCallout(false);
                  useQueryCopilot.getState().openFeedbackModal(generatedQuery, true, userInput);
                }}
              >
                more feedback?
              </Link>
            </Text>
          </Callout>
        )}
        <IconButton
          id="likeBtn"
          style={{ marginLeft: 20 }}
          iconProps={{ iconName: likeQuery === true ? "LikeSolid" : "Like" }}
          onClick={() => {
            setLikeQuery(true);
            setShowCallout(true);
          }}
        />
        <IconButton
          style={{ margin: "0 10px" }}
          iconProps={{ iconName: likeQuery === false ? "DislikeSolid" : "Dislike" }}
          onClick={() => {
            setLikeQuery(false);
            setShowCallout(false);
            useQueryCopilot.getState().openFeedbackModal(generatedQuery, false, userInput);
          }}
        />
        <Separator vertical style={{ color: "#EDEBE9" }} />
        <CommandBarButton iconProps={{ iconName: "Copy" }} style={{ margin: "0 10px", backgroundColor: "#FFF8F0" }}>
          Copy code
        </CommandBarButton>
        <CommandBarButton iconProps={{ iconName: "Delete" }} style={{ backgroundColor: "#FFF8F0" }}>
          Delete code
        </CommandBarButton>
      </Stack>
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
