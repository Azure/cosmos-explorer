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
import { querySampleDocuments } from "Common/dataAccess/queryDocuments";
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
import { submitFeedback } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { SamplePrompts, SamplePromptsProps } from "Explorer/QueryCopilot/SamplePrompts/SamplePrompts";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { userContext } from "UserContext";
import { queryPagesUntilContentPresent } from "Utils/QueryUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useRef, useState } from "react";
import SplitterLayout from "react-splitter-layout";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import HintIcon from "../../../images/Hint.svg";
import CopilotIcon from "../../../images/QueryCopilotNewLogo.svg";
import RecentIcon from "../../../images/Recent.svg";
import SamplePromptsIcon from "../../../images/SamplePromptsIcon.svg";
import XErrorMessage from "../../../images/X-errorMessage.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";
import { useTabs } from "../../hooks/useTabs";

interface SuggestedPrompt {
  id: number;
  text: string;
}

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

const promptStyles: IButtonStyles = {
  root: { border: 0, selectors: { ":hover": { outline: "1px dashed #605e5c" } } },
  label: { fontWeight: 400, textAlign: "left", paddingLeft: 8 },
};

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  initialInput,
  explorer,
}: QueryCopilotTabProps): JSX.Element => {
  const hideFeedbackModalForLikedQueries = useQueryCopilot((state) => state.hideFeedbackModalForLikedQueries);
  const [userPrompt, setUserPrompt] = useState<string>(initialInput || "");
  const [generatedQuery, setGeneratedQuery] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [isGeneratingQuery, setIsGeneratingQuery] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [likeQuery, setLikeQuery] = useState<boolean>();
  const [dislikeQuery, setDislikeQuery] = useState<boolean>();
  const [showCallout, setShowCallout] = useState<boolean>(false);
  const [showSamplePrompts, setShowSamplePrompts] = useState<boolean>(false);
  const [queryIterator, setQueryIterator] = useState<MinimalQueryIterator>();
  const [queryResults, setQueryResults] = useState<QueryResults>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copilotTeachingBubbleVisible, { toggle: toggleCopilotTeachingBubbleVisible }] = useBoolean(false);
  const inputEdited = useRef(false);
  const [isSamplePromptsOpen, setIsSamplePromptsOpen] = useState<boolean>(false);
  const [showDeletePopup, setShowDeletePopup] = useState<boolean>(false);
  const [showFeedbackBar, setShowFeedbackBar] = useState<boolean>(false);
  const [showCopyPopup, setshowCopyPopup] = useState<boolean>(false);
  const [showErrorMessageBar, setShowErrorMessageBar] = useState<boolean>(false);

  const sampleProps: SamplePromptsProps = {
    isSamplePromptsOpen: isSamplePromptsOpen,
    setIsSamplePromptsOpen: setIsSamplePromptsOpen,
    setTextBox: setUserPrompt,
  };

  const copyGeneratedCode = () => {
    if (!query) {
      return;
    }
    const queryElement = document.createElement("textarea");
    queryElement.value = query;
    document.body.appendChild(queryElement);
    queryElement.select();
    document.execCommand("copy");
    document.body.removeChild(queryElement);

    setshowCopyPopup(true);
    setTimeout(() => {
      setshowCopyPopup(false);
    }, 6000);
  };

  const cachedHistoriesString = localStorage.getItem(`${userContext.databaseAccount?.id}-queryCopilotHistories`);
  const cachedHistories = cachedHistoriesString?.split(",");
  const [histories, setHistories] = useState<string[]>(cachedHistories || []);
  const suggestedPrompts: SuggestedPrompt[] = [
    { id: 1, text: "Give me all customers whose names start with C" },
    { id: 2, text: "Show me all customers" },
    { id: 3, text: "Show me all customers who bought a bike in 2019" },
  ];
  const [filteredHistories, setFilteredHistories] = useState<string[]>(histories);
  const [filteredSuggestedPrompts, setFilteredSuggestedPrompts] = useState<SuggestedPrompt[]>(suggestedPrompts);

  const handleUserPromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    inputEdited.current = true;
    const { value } = event.target;
    setUserPrompt(value);

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
    const newHistories = histories.length < 3 ? [userPrompt, ...histories] : [userPrompt, histories[1], histories[2]];
    setHistories(newHistories);
    localStorage.setItem(`${userContext.databaseAccount.id}-queryCopilotHistories`, newHistories.join(","));
  };

  const generateSQLQuery = async (): Promise<void> => {
    try {
      setIsGeneratingQuery(true);
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
      const payload = {
        containerSchema: QueryCopilotSampleContainerSchema,
        userPrompt: userPrompt,
      };
      setShowDeletePopup(false);
      const response = await fetch("https://copilotorchestrater.azurewebsites.net/generateSQLQuery", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
      if (generateSQLQueryResponse?.sql) {
        let query = `-- **Prompt:** ${userPrompt}\r\n`;
        if (generateSQLQueryResponse.explanation) {
          query += `-- **Explanation of query:** ${generateSQLQueryResponse.explanation}\r\n`;
        }
        query += generateSQLQueryResponse.sql;
        setQuery(query);
        setGeneratedQuery(generateSQLQueryResponse.sql);
      }
    } catch (error) {
      handleError(error, "executeNaturalLanguageQuery");
      useTabs.getState().setIsQueryErrorThrown(true);
      setShowErrorMessageBar(true);
      throw error;
    } finally {
      setIsGeneratingQuery(false);
      useTabs.getState().setIsTabExecuting(false);
      setShowFeedbackBar(true);
    }
  };

  const onExecuteQueryClick = async (): Promise<void> => {
    const queryToExecute = selectedQuery || query;
    const queryIterator = querySampleDocuments(queryToExecute, {
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
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
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
      useTabs.getState().setIsQueryErrorThrown(true);
      setShowErrorMessageBar(true);
    } finally {
      setIsExecuting(false);
      useTabs.getState().setIsTabExecuting(false);
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

    const samplePromptsBtn = {
      iconSrc: SamplePromptsIcon,
      iconAlt: "Sample Prompts",
      onCommandClick: () => setIsSamplePromptsOpen(true),
      commandButtonLabel: "Sample Prompts",
      ariaLabel: "Sample Prompts",
      hasPopup: false,
    };

    return [executeQueryBtn, saveQueryBtn, samplePromptsBtn];
  };
  const showTeachingBubble = (): void => {
    if (!inputEdited.current) {
      setTimeout(() => {
        if (!inputEdited.current) {
          toggleCopilotTeachingBubbleVisible();
          inputEdited.current = true;
        }
      }, 30000);
    }
  };

  const resetButtonState = () => {
    setDislikeQuery(false);
    setLikeQuery(false);
    setShowCallout(false);
  };

  React.useEffect(() => {
    useCommandBar.getState().setContextButtons(getCommandbarButtons());
  }, [query, selectedQuery]);

  React.useEffect(() => {
    if (initialInput) {
      generateSQLQuery();
    }
    showTeachingBubble();
    useTabs.getState().setIsQueryErrorThrown(false);
  }, []);

  return (
    <Stack className="tab-pane" style={{ padding: 24, width: "100%", height: "100%" }}>
      <Stack horizontal verticalAlign="center">
        <Image src={CopilotIcon} />
        <Text style={{ marginLeft: 8, fontWeight: 600, fontSize: 16 }}>Copilot</Text>
      </Stack>
      <Stack horizontal verticalAlign="center" style={{ marginTop: 16, width: "100%", position: "relative" }}>
        <TextField
          id="naturalLanguageInput"
          value={userPrompt}
          onChange={handleUserPromptChange}
          onClick={() => {
            inputEdited.current = true;
            setShowSamplePrompts(true);
          }}
          style={{ lineHeight: 30 }}
          styles={{ root: { width: "95%" } }}
          disabled={isGeneratingQuery}
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
                setShowSamplePrompts(true);
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
          disabled={isGeneratingQuery || !userPrompt.trim()}
          style={{ marginLeft: 8 }}
          onClick={() => {
            updateHistories();
            generateSQLQuery();
            resetButtonState();
          }}
        />
        {isGeneratingQuery && <Spinner style={{ marginLeft: 8 }} />}
        {showSamplePrompts && (
          <Callout
            styles={{ root: { minWidth: 400 } }}
            target="#naturalLanguageInput"
            isBeakVisible={false}
            onDismiss={() => setShowSamplePrompts(false)}
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
                        setUserPrompt(history);
                        setShowSamplePrompts(false);
                      }}
                      onRenderIcon={() => <Image src={RecentIcon} />}
                      styles={promptStyles}
                    >
                      {history}
                    </DefaultButton>
                  ))}
                </Stack>
              )}
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
                    setUserPrompt(prompt.text);
                    setShowSamplePrompts(false);
                  }}
                  onRenderIcon={() => <Image src={HintIcon} />}
                  styles={promptStyles}
                >
                  {prompt.text}
                </DefaultButton>
              ))}
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
          </Callout>
        )}
      </Stack>

      <Text style={{ marginTop: 8, marginBottom: 24, fontSize: 12 }}>
        AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
        <Link href="" target="_blank">
          Read preview terms
        </Link>
        {showErrorMessageBar && (
          <Stack style={{ backgroundColor: "#FEF0F1", padding: "4px 8px" }} horizontal verticalAlign="center">
            <Image src={XErrorMessage} style={{ marginRight: "8px" }} />
            <Text style={{ fontSize: 12 }}>
              We ran into an error and were not able to execute query. Please try again after sometime
            </Text>
          </Stack>
        )}
      </Text>

      {showFeedbackBar && (
        <Stack style={{ backgroundColor: "#FFF8F0", padding: "2px 8px" }} horizontal verticalAlign="center">
          <Text style={{ fontWeight: 600, fontSize: 12 }}>Provide feedback on the query generated</Text>
          {showCallout && !hideFeedbackModalForLikedQueries && (
            <Callout
              style={{ padding: 8 }}
              target="#likeBtn"
              onDismiss={() => {
                setShowCallout(false);
                submitFeedback({ generatedQuery, likeQuery, description: "", userPrompt: userPrompt });
              }}
              directionalHint={DirectionalHint.topCenter}
            >
              <Text>
                Thank you. Need to give{" "}
                <Link
                  onClick={() => {
                    setShowCallout(false);
                    useQueryCopilot.getState().openFeedbackModal(generatedQuery, true, userPrompt);
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
              setShowCallout(!likeQuery);
              setLikeQuery(!likeQuery);
              if (dislikeQuery) {
                setDislikeQuery(!dislikeQuery);
              }
            }}
          />
          <IconButton
            style={{ margin: "0 10px" }}
            iconProps={{ iconName: dislikeQuery === true ? "DislikeSolid" : "Dislike" }}
            onClick={() => {
              if (!dislikeQuery) {
                useQueryCopilot.getState().openFeedbackModal(generatedQuery, false, userPrompt);
                setLikeQuery(false);
              }
              setDislikeQuery(!dislikeQuery);
              setShowCallout(false);
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
              setShowDeletePopup(true);
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
      <WelcomeModal visible={localStorage.getItem("hideWelcomeModal") !== "true"} />
      {isSamplePromptsOpen && <SamplePrompts sampleProps={sampleProps} />}
      {query !== "" && query.trim().length !== 0 && (
        <DeletePopup
          showDeletePopup={showDeletePopup}
          setShowDeletePopup={setShowDeletePopup}
          setQuery={setQuery}
          clearFeedback={resetButtonState}
          showFeedbackBar={setShowFeedbackBar}
        />
      )}
      <CopyPopup showCopyPopup={showCopyPopup} setShowCopyPopup={setshowCopyPopup} />
    </Stack>
  );
};
