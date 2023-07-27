/* eslint-disable no-console */
import { FeedOptions } from "@azure/cosmos";
import {
  Callout,
  CommandBarButton,
  DefaultButton,
  DirectionalHint,
  IButtonStyles,
  IconButton,
  Image,
  Link,
  Separator,
  Spinner,
  Stack,
  TeachingBubble,
  Text,
  TextField,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { QueryCopilotSampleContainerId, QueryCopilotSampleContainerSchema } from "Common/Constants";
import { getErrorMessage, handleError } from "Common/ErrorHandlingUtils";
import { shouldEnableCrossPartitionKey } from "Common/HeadersUtility";
import { MinimalQueryIterator } from "Common/IteratorUtilities";
import { queryDocumentsPage } from "Common/dataAccess/queryDocumentsPage";
import { QueryResults } from "Contracts/ViewModels";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { SaveQueryPane } from "Explorer/Panes/SaveQueryPane/SaveQueryPane";
import { WelcomeModal } from "Explorer/QueryCopilot/Modal/WelcomeModal";
import { CopyPopup } from "Explorer/QueryCopilot/Popup/CopyPopup";
import { DeletePopup } from "Explorer/QueryCopilot/Popup/DeletePopup";
import { querySampleDocuments, submitFeedback } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { SamplePrompts, SamplePromptsProps } from "Explorer/QueryCopilot/SamplePrompts/SamplePrompts";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { userContext } from "UserContext";
import { queryPagesUntilContentPresent } from "Utils/QueryUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { QueryCopilotState } from "hooks/useQueryCopilotState";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useRef, useState } from "react";
import SplitterLayout from "react-splitter-layout";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import HintIcon from "../../../images/Hint.svg";
import CopilotIcon from "../../../images/QueryCopilotNewLogo.svg";
import RecentIcon from "../../../images/Recent.svg";
import XErrorMessage from "../../../images/X-errorMessage.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";
import { useTabs } from "../../hooks/useTabs";

interface SuggestedPrompt {
  id: number;
  text: string;
}

interface QueryCopilotTabProps {
  queryCopilotState: QueryCopilotState;
  explorer: Explorer;
}

interface GenerateSQLQueryResponse {
  apiVersion: string;
  sql: string;
  explanation: string;
  generateStart: string;
  generateEnd: string;
}

const promptStyles: IButtonStyles = {
  root: { border: 0, selectors: { ":hover": { outline: "1px dashed #605e5c" } } },
  label: { fontWeight: 400, textAlign: "left", paddingLeft: 8 },
};

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  queryCopilotState,
  explorer,
}: QueryCopilotTabProps): JSX.Element => {
  const [copilotTeachingBubbleVisible, { toggle: toggleCopilotTeachingBubbleVisible }] = useBoolean(false);
  const inputEdited = useRef(false);

  const sampleProps: SamplePromptsProps = {
    isSamplePromptsOpen: queryCopilotState.isSamplePromptsOpen,
    setIsSamplePromptsOpen: queryCopilotState.setIsSamplePromptsOpen,
    setTextBox: queryCopilotState.setUserPrompt,
  };

  const copyGeneratedCode = () => {
    if (!queryCopilotState.query) {
      return;
    }
    const queryElement = document.createElement("textarea");
    queryElement.value = queryCopilotState.query;
    document.body.appendChild(queryElement);
    queryElement.select();
    document.execCommand("copy");
    document.body.removeChild(queryElement);

    queryCopilotState.setshowCopyPopup(true);
    setTimeout(() => {
      queryCopilotState.setshowCopyPopup(false);
    }, 6000);
  };

  const cachedHistoriesString = localStorage.getItem(`${userContext.databaseAccount?.id}-queryCopilotHistories`);
  const cachedHistories = cachedHistoriesString?.split("|");
  const [histories, setHistories] = useState<string[]>(cachedHistories || []);
  const suggestedPrompts: SuggestedPrompt[] = [
    { id: 1, text: 'Show all products that have the word "ultra" in the name or description' },
    { id: 2, text: "What are all of the possible categories for the products, and their counts?" },
    { id: 3, text: 'Show me all products that have been reviewed by someone with a username that contains "bob"' },
  ];
  const [filteredHistories, setFilteredHistories] = useState<string[]>(histories);
  const [filteredSuggestedPrompts, setFilteredSuggestedPrompts] = useState<SuggestedPrompt[]>(suggestedPrompts);

  const handleUserPromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    inputEdited.current = true;
    const { value } = event.target;
    queryCopilotState.setUserPrompt(value);

    // Filter history prompts
    const filteredHistory = histories.filter((history) => history.toLowerCase().includes(value.toLowerCase()));
    setFilteredHistories(filteredHistory);

    // Filter suggested prompts
    const filteredSuggested = suggestedPrompts.filter((prompt) =>
      prompt.text.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestedPrompts(filteredSuggested);
  };

  const updateHistories = (): void => {
    const formattedUserPrompt = queryCopilotState.userPrompt.replace(/\s+/g, " ").trim();
    const existingHistories = histories.map((history) => history.replace(/\s+/g, " ").trim());

    const updatedHistories = existingHistories.filter(
      (history) => history.toLowerCase() !== formattedUserPrompt.toLowerCase()
    );
    const newHistories = [formattedUserPrompt, ...updatedHistories.slice(0, 2)];

    setHistories(newHistories);
    localStorage.setItem(`${userContext.databaseAccount.id}-queryCopilotHistories`, newHistories.join("|"));
  };

  const generateSQLQuery = async (): Promise<void> => {
    try {
      queryCopilotState.setIsGeneratingQuery(true);
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
      const payload = {
        containerSchema: QueryCopilotSampleContainerSchema,
        userPrompt: queryCopilotState.userPrompt,
      };
      queryCopilotState.setShowDeletePopup(false);
      const response = await fetch("https://copilotorchestrater.azurewebsites.net/generateSQLQuery", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
      if (response.ok) {
        if (generateSQLQueryResponse?.sql) {
          let query = `-- **Prompt:** ${queryCopilotState.userPrompt}\r\n`;
          if (generateSQLQueryResponse.explanation) {
            query += `-- **Explanation of query:** ${generateSQLQueryResponse.explanation}\r\n`;
          }
          query += generateSQLQueryResponse.sql;
          queryCopilotState.setQuery(query);
          queryCopilotState.setGeneratedQuery(generateSQLQueryResponse.sql);
          queryCopilotState.setShowErrorMessageBar(false);
        }
      } else {
        handleError(JSON.stringify(generateSQLQueryResponse), "copilotInternalServerError");
        useTabs.getState().setIsQueryErrorThrown(true);
        queryCopilotState.setShowErrorMessageBar(true);
      }
    } catch (error) {
      handleError(error, "executeNaturalLanguageQuery");
      useTabs.getState().setIsQueryErrorThrown(true);
      queryCopilotState.setShowErrorMessageBar(true);
      throw error;
    } finally {
      queryCopilotState.setIsGeneratingQuery(false);
      useTabs.getState().setIsTabExecuting(false);
      queryCopilotState.setShowFeedbackBar(true);
    }
  };

  const onExecuteQueryClick = async (): Promise<void> => {
    const queryToExecute = queryCopilotState.selectedQuery || queryCopilotState.query;
    const queryIterator = querySampleDocuments(queryToExecute, {
      enableCrossPartitionQuery: shouldEnableCrossPartitionKey(),
    } as FeedOptions);
    queryCopilotState.setQueryIterator(queryIterator);

    setTimeout(async () => {
      await queryDocumentsPerPage(0, queryIterator);
    }, 100);
  };

  const queryDocumentsPerPage = async (firstItemIndex: number, queryIterator: MinimalQueryIterator): Promise<void> => {
    try {
      queryCopilotState.setIsExecuting(true);
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
      const queryResults: QueryResults = await queryPagesUntilContentPresent(
        firstItemIndex,
        async (firstItemIndex: number) =>
          queryDocumentsPage(QueryCopilotSampleContainerId, queryIterator, firstItemIndex)
      );

      queryCopilotState.setQueryResults(queryResults);
      queryCopilotState.setErrorMessage("");
      queryCopilotState.setShowErrorMessageBar(false);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      queryCopilotState.setErrorMessage(errorMessage);
      handleError(errorMessage, "executeQueryCopilotTab");
      useTabs.getState().setIsQueryErrorThrown(true);
      queryCopilotState.setShowErrorMessageBar(true);
    } finally {
      queryCopilotState.setIsExecuting(false);
      useTabs.getState().setIsTabExecuting(false);
    }
  };

  const getCommandbarButtons = (): CommandButtonComponentProps[] => {
    const executeQueryBtnLabel = queryCopilotState.selectedQuery ? "Execute Selection" : "Execute Query";
    const executeQueryBtn = {
      iconSrc: ExecuteQueryIcon,
      iconAlt: executeQueryBtnLabel,
      onCommandClick: () => onExecuteQueryClick(),
      commandButtonLabel: executeQueryBtnLabel,
      ariaLabel: executeQueryBtnLabel,
      hasPopup: false,
      disabled: queryCopilotState.query?.trim() === "",
    };

    const saveQueryBtn = {
      iconSrc: SaveQueryIcon,
      iconAlt: "Save Query",
      onCommandClick: () =>
        useSidePanel
          .getState()
          .openSidePanel("Save Query", <SaveQueryPane explorer={explorer} queryToSave={queryCopilotState.query} />),
      commandButtonLabel: "Save Query",
      ariaLabel: "Save Query",
      hasPopup: false,
      disabled: queryCopilotState.query?.trim() === "",
    };

    // Sample Prompts temporary disabled due current design
    // const samplePromptsBtn = {
    //   iconSrc: SamplePromptsIcon,
    //   iconAlt: "Sample Prompts",
    //   onCommandClick: () => setIsSamplePromptsOpen(true),
    //   commandButtonLabel: "Sample Prompts",
    //   ariaLabel: "Sample Prompts",
    //   hasPopup: false,
    // };

    return [executeQueryBtn, saveQueryBtn];
  };
  const showTeachingBubble = (): void => {
    let shouldShowTeachingBubble = !queryCopilotState.inputEdited && queryCopilotState.userPrompt.trim() === "";
    if (shouldShowTeachingBubble) {
      setTimeout(() => {
        if (shouldShowTeachingBubble) {
          toggleCopilotTeachingBubbleVisible();
          queryCopilotState.inputEdited = true;
        }
      }, 30000);
    }
  };

  const resetButtonState = () => {
    queryCopilotState.setDislikeQuery(false);
    queryCopilotState.setLikeQuery(false);
    queryCopilotState.setShowCallout(false);
  };

  React.useEffect(() => {
    useCommandBar.getState().setContextButtons(getCommandbarButtons());
  }, [queryCopilotState.query, queryCopilotState.selectedQuery]);

  React.useEffect(() => {
    showTeachingBubble();
    useTabs.getState().setIsQueryErrorThrown(false);
  }, []);

  return (
    <Stack className="tab-pane" style={{ padding: 24, width: "100%" }}>
      <div style={{ overflowY: "auto", height: "100%" }}>
        <Stack horizontal verticalAlign="center">
          <Image src={CopilotIcon} />
          <Text style={{ marginLeft: 8, fontWeight: 600, fontSize: 16 }}>Copilot</Text>
        </Stack>
        <Stack horizontal verticalAlign="center" style={{ marginTop: 16, width: "100%", position: "relative" }}>
          <TextField
            id="naturalLanguageInput"
            value={queryCopilotState.userPrompt}
            onChange={handleUserPromptChange}
            onClick={() => {
              queryCopilotState.inputEdited = true;
              queryCopilotState.setShowSamplePrompts(true);
            }}
            style={{ lineHeight: 30 }}
            styles={{ root: { width: "95%" } }}
            disabled={queryCopilotState.isGeneratingQuery}
            autoComplete="off"
          />
          {copilotTeachingBubbleVisible && (
            <TeachingBubble
              calloutProps={{ directionalHint: DirectionalHint.bottomCenter }}
              target="#naturalLanguageInput"
              hasCloseButton={true}
              closeButtonAriaLabel="Close"
              onDismiss={toggleCopilotTeachingBubbleVisible}
              hasSmallHeadline={true}
              headline="Write a prompt"
            >
              Write a prompt here and Copilot will generate the query for you. You can also choose from our{" "}
              <Link
                onClick={() => {
                  queryCopilotState.setShowSamplePrompts(true);
                  toggleCopilotTeachingBubbleVisible();
                }}
                style={{ color: "white", fontWeight: 600 }}
              >
                sample prompts
              </Link>{" "}
              or write your own query
            </TeachingBubble>
          )}
          <IconButton
            iconProps={{ iconName: "Send" }}
            disabled={queryCopilotState.isGeneratingQuery || !queryCopilotState.userPrompt.trim()}
            style={{ marginLeft: 8 }}
            onClick={() => {
              updateHistories();
              generateSQLQuery();
              resetButtonState();
            }}
          />
          {queryCopilotState.isGeneratingQuery && <Spinner style={{ marginLeft: 8 }} />}
          {queryCopilotState.showSamplePrompts && (
            <Callout
              styles={{ root: { minWidth: 400 } }}
              target="#naturalLanguageInput"
              isBeakVisible={false}
              onDismiss={() => queryCopilotState.setShowSamplePrompts(false)}
              directionalHintFixed={true}
              directionalHint={DirectionalHint.bottomLeftEdge}
              alignTargetEdge={true}
              gapSpace={4}
            >
              <Stack>
                {filteredHistories?.length > 0 && (
                  <Stack>
                    <Text
                      style={{
                        width: "100%",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0078D4",
                        marginLeft: 16,
                        padding: "4px 0",
                      }}
                    >
                      Recent
                    </Text>
                    {filteredHistories.map((history, i) => (
                      <DefaultButton
                        key={i}
                        onClick={() => {
                          queryCopilotState.setUserPrompt(history);
                          queryCopilotState.setShowSamplePrompts(false);
                        }}
                        onRenderIcon={() => <Image src={RecentIcon} />}
                        styles={promptStyles}
                      >
                        {history}
                      </DefaultButton>
                    ))}
                  </Stack>
                )}
                {filteredSuggestedPrompts?.length > 0 && (
                  <Stack>
                    <Text
                      style={{
                        width: "100%",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0078D4",
                        marginLeft: 16,
                        padding: "4px 0",
                      }}
                    >
                      Suggested Prompts
                    </Text>
                    {filteredSuggestedPrompts.map((prompt) => (
                      <DefaultButton
                        key={prompt.id}
                        onClick={() => {
                          queryCopilotState.setUserPrompt(prompt.text);
                          queryCopilotState.setShowSamplePrompts(false);
                        }}
                        onRenderIcon={() => <Image src={HintIcon} />}
                        styles={promptStyles}
                      >
                        {prompt.text}
                      </DefaultButton>
                    ))}
                  </Stack>
                )}
                {(filteredHistories?.length > 0 || filteredSuggestedPrompts?.length > 0) && (
                  <Stack>
                    <Separator
                      styles={{
                        root: {
                          selectors: { "::before": { background: "#E1DFDD" } },
                          padding: 0,
                        },
                      }}
                    />
                    <Text
                      style={{
                        width: "100%",
                        fontSize: 14,
                        marginLeft: 16,
                        padding: "4px 0",
                      }}
                    >
                      Learn about{" "}
                      <Link target="_blank" href="">
                        writing effective prompts
                      </Link>
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Callout>
          )}
        </Stack>

        <Stack style={{ marginTop: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 12 }}>
            AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
            <Link href="" target="_blank">
              Read preview terms
            </Link>
            {queryCopilotState.showErrorMessageBar && (
              <Stack style={{ backgroundColor: "#FEF0F1", padding: "4px 8px" }} horizontal verticalAlign="center">
                <Image src={XErrorMessage} style={{ marginRight: "8px" }} />
                <Text style={{ fontSize: 12 }}>
                  We ran into an error and were not able to execute query. Please try again after sometime
                </Text>
              </Stack>
            )}
          </Text>
        </Stack>

        {queryCopilotState.showFeedbackBar && (
          <Stack style={{ backgroundColor: "#FFF8F0", padding: "2px 8px" }} horizontal verticalAlign="center">
            <Text style={{ fontWeight: 600, fontSize: 12 }}>Provide feedback on the query generated</Text>
            {queryCopilotState.showCallout && !queryCopilotState.hideFeedbackModalForLikedQueries && (
              <Callout
                style={{ padding: 8 }}
                target="#likeBtn"
                onDismiss={() => {
                  queryCopilotState.setShowCallout(false);
                  submitFeedback({
                    generatedQuery: queryCopilotState.generatedQuery,
                    likeQuery: queryCopilotState.likeQuery,
                    description: "",
                    userPrompt: queryCopilotState.userPrompt,
                  });
                }}
                directionalHint={DirectionalHint.topCenter}
              >
                <Text>
                  Thank you. Need to give{" "}
                  <Link
                    onClick={() => {
                      queryCopilotState.setShowCallout(false);
                      useQueryCopilot
                        .getState()
                        .openFeedbackModal(queryCopilotState.generatedQuery, true, queryCopilotState.userPrompt);
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
              iconProps={{ iconName: queryCopilotState.likeQuery === true ? "LikeSolid" : "Like" }}
              onClick={() => {
                queryCopilotState.setShowCallout(!queryCopilotState.likeQuery);
                queryCopilotState.setLikeQuery(!queryCopilotState.likeQuery);
                if (queryCopilotState.dislikeQuery) {
                  queryCopilotState.setDislikeQuery(!queryCopilotState.dislikeQuery);
                }
              }}
            />
            <IconButton
              style={{ margin: "0 10px" }}
              iconProps={{ iconName: queryCopilotState.dislikeQuery === true ? "DislikeSolid" : "Dislike" }}
              onClick={() => {
                if (!queryCopilotState.dislikeQuery) {
                  useQueryCopilot
                    .getState()
                    .openFeedbackModal(queryCopilotState.generatedQuery, false, queryCopilotState.userPrompt);
                  queryCopilotState.setLikeQuery(false);
                }
                queryCopilotState.setDislikeQuery(!queryCopilotState.dislikeQuery);
                queryCopilotState.setShowCallout(false);
              }}
            />
            <Separator vertical style={{ color: "#EDEBE9" }} />
            <CommandBarButton
              onClick={copyGeneratedCode}
              iconProps={{ iconName: "Copy" }}
              style={{ margin: "0 10px", backgroundColor: "#FFF8F0", transition: "background-color 0.3s ease" }}
            >
              Copy code
            </CommandBarButton>
            <CommandBarButton
              onClick={() => {
                queryCopilotState.setShowDeletePopup(true);
              }}
              iconProps={{ iconName: "Delete" }}
              style={{ margin: "0 10px", backgroundColor: "#FFF8F0", transition: "background-color 0.3s ease" }}
            >
              Delete code
            </CommandBarButton>
          </Stack>
        )}

        <Stack className="tabPaneContentContainer">
          <SplitterLayout vertical={true} primaryIndex={0} primaryMinSize={100} secondaryMinSize={200}>
            <EditorReact
              language={"sql"}
              content={queryCopilotState.query}
              isReadOnly={false}
              ariaLabel={"Editing Query"}
              lineNumbers={"on"}
              onContentChanged={(newQuery: string) => queryCopilotState.setQuery(newQuery)}
              onContentSelected={(selectedQuery: string) => queryCopilotState.setSelectedQuery(selectedQuery)}
            />
            <QueryResultSection
              isMongoDB={false}
              queryEditorContent={queryCopilotState.selectedQuery || queryCopilotState.query}
              error={queryCopilotState.errorMessage}
              queryResults={queryCopilotState.queryResults}
              isExecuting={queryCopilotState.isExecuting}
              executeQueryDocumentsPage={(firstItemIndex: number) =>
                queryDocumentsPerPage(firstItemIndex, queryCopilotState.queryIterator)
              }
            />
          </SplitterLayout>
        </Stack>
        <WelcomeModal visible={localStorage.getItem("hideWelcomeModal") !== "true"} />
        {queryCopilotState.isSamplePromptsOpen && <SamplePrompts sampleProps={sampleProps} />}
        {queryCopilotState.query !== "" && queryCopilotState.query.trim().length !== 0 && (
          <DeletePopup
            showDeletePopup={queryCopilotState.showDeletePopup}
            setShowDeletePopup={queryCopilotState.setShowDeletePopup}
            setQuery={queryCopilotState.setQuery}
            clearFeedback={resetButtonState}
            showFeedbackBar={queryCopilotState.setShowFeedbackBar}
          />
        )}
        <CopyPopup
          showCopyPopup={queryCopilotState.showCopyPopup}
          setShowCopyPopup={queryCopilotState.setshowCopyPopup}
        />
      </div>
    </Stack>
  );
};
