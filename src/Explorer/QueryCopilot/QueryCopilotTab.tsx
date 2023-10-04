/* eslint-disable no-console */
import {
  Callout,
  CommandBarButton,
  DefaultButton,
  DirectionalHint,
  IButtonStyles,
  IconButton,
  Image,
  Link,
  MessageBar,
  MessageBarType,
  Separator,
  Spinner,
  Stack,
  TeachingBubble,
  Text,
  TextField,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import {
  ContainerStatusType,
  PoolIdType,
  QueryCopilotSampleContainerSchema,
  ShortenedQueryCopilotSampleContainerSchema,
} from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { SaveQueryPane } from "Explorer/Panes/SaveQueryPane/SaveQueryPane";
import { WelcomeModal } from "Explorer/QueryCopilot/Modal/WelcomeModal";
import { CopyPopup } from "Explorer/QueryCopilot/Popup/CopyPopup";
import { DeletePopup } from "Explorer/QueryCopilot/Popup/DeletePopup";
import { OnExecuteQueryClick, SubmitFeedback } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { GenerateSQLQueryResponse, QueryCopilotProps } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { QueryCopilotResults } from "Explorer/QueryCopilot/Shared/QueryCopilotResults";
import { SamplePrompts, SamplePromptsProps } from "Explorer/QueryCopilot/Shared/SamplePrompts/SamplePrompts";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useRef, useState } from "react";
import SplitterLayout from "react-splitter-layout";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import HintIcon from "../../../images/Hint.svg";
import CopilotIcon from "../../../images/QueryCopilotNewLogo.svg";
import RecentIcon from "../../../images/Recent.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";
import { useTabs } from "../../hooks/useTabs";

interface SuggestedPrompt {
  id: number;
  text: string;
}

const promptStyles: IButtonStyles = {
  root: { border: 0, selectors: { ":hover": { outline: "1px dashed #605e5c" } } },
  label: { fontWeight: 400, textAlign: "left", paddingLeft: 8 },
};

export const QueryCopilotTab: React.FC<QueryCopilotProps> = ({ explorer }: QueryCopilotProps): JSX.Element => {
  const [copilotTeachingBubbleVisible, { toggle: toggleCopilotTeachingBubbleVisible }] = useBoolean(false);
  const inputEdited = useRef(false);
  const {
    hideFeedbackModalForLikedQueries,
    userPrompt,
    setUserPrompt,
    generatedQuery,
    setGeneratedQuery,
    query,
    setQuery,
    selectedQuery,
    setSelectedQuery,
    isGeneratingQuery,
    setIsGeneratingQuery,
    likeQuery,
    setLikeQuery,
    dislikeQuery,
    setDislikeQuery,
    showCallout,
    setShowCallout,
    showSamplePrompts,
    setShowSamplePrompts,
    isSamplePromptsOpen,
    setIsSamplePromptsOpen,
    showDeletePopup,
    setShowDeletePopup,
    showFeedbackBar,
    setShowFeedbackBar,
    showCopyPopup,
    setshowCopyPopup,
    showErrorMessageBar,
    showInvalidQueryMessageBar,
    setShowInvalidQueryMessageBar,
    setShowErrorMessageBar,
    setGeneratedQueryComments,
    setQueryResults,
    setErrorMessage,
  } = useQueryCopilot();

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
    setUserPrompt(value);

    // Filter history prompts
    const filteredHistory = histories.filter((history) => history.toLowerCase().includes(value.toLowerCase()));
    setFilteredHistories(filteredHistory);

    // Filter suggested prompts
    const filteredSuggested = suggestedPrompts.filter((prompt) =>
      prompt.text.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredSuggestedPrompts(filteredSuggested);
  };

  const updateHistories = (): void => {
    const formattedUserPrompt = userPrompt.replace(/\s+/g, " ").trim();
    const existingHistories = histories.map((history) => history.replace(/\s+/g, " ").trim());

    const updatedHistories = existingHistories.filter(
      (history) => history.toLowerCase() !== formattedUserPrompt.toLowerCase(),
    );
    const newHistories = [formattedUserPrompt, ...updatedHistories.slice(0, 2)];

    setHistories(newHistories);
    localStorage.setItem(`${userContext.databaseAccount.id}-queryCopilotHistories`, newHistories.join("|"));
  };

  const resetMessageStates = (): void => {
    setShowErrorMessageBar(false);
    setShowInvalidQueryMessageBar(false);
    setShowFeedbackBar(false);
  };

  const resetQueryResults = (): void => {
    setQueryResults(null);
    setErrorMessage("");
  };

  const generateSQLQuery = async (): Promise<void> => {
    try {
      resetMessageStates();
      setIsGeneratingQuery(true);
      setShowDeletePopup(false);
      useTabs.getState().setIsTabExecuting(true);
      useTabs.getState().setIsQueryErrorThrown(false);
      if (
        useQueryCopilot.getState().containerStatus.status !== ContainerStatusType.Active &&
        !userContext.features.disableCopilotPhoenixGateaway
      ) {
        await explorer.allocateContainer(PoolIdType.QueryCopilot);
      }
      const payload = {
        containerSchema: userContext.features.enableCopilotFullSchema
          ? QueryCopilotSampleContainerSchema
          : ShortenedQueryCopilotSampleContainerSchema,
        userPrompt: userPrompt,
      };
      useQueryCopilot.getState().refreshCorrelationId();
      const serverInfo = useQueryCopilot.getState().notebookServerInfo;
      const queryUri = userContext.features.disableCopilotPhoenixGateaway
        ? createUri("https://copilotorchestrater.azurewebsites.net/", "generateSQLQuery")
        : createUri(serverInfo.notebookServerEndpoint, "generateSQLQuery");
      const response = await fetch(queryUri, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ms-correlationid": useQueryCopilot.getState().correlationId,
        },
        body: JSON.stringify(payload),
      });

      const generateSQLQueryResponse: GenerateSQLQueryResponse = await response?.json();
      if (response.ok) {
        if (generateSQLQueryResponse?.sql !== "N/A") {
          let query = `-- **Prompt:** ${userPrompt}\r\n`;
          if (generateSQLQueryResponse.explanation) {
            query += `-- **Explanation of query:** ${generateSQLQueryResponse.explanation}\r\n`;
          }
          query += generateSQLQueryResponse.sql;
          setQuery(query);
          setGeneratedQuery(generateSQLQueryResponse.sql);
          setGeneratedQueryComments(generateSQLQueryResponse.explanation);
          setShowFeedbackBar(true);
          resetQueryResults();
        } else {
          setShowInvalidQueryMessageBar(true);
        }
      } else {
        handleError(JSON.stringify(generateSQLQueryResponse), "copilotInternalServerError");
        useTabs.getState().setIsQueryErrorThrown(true);
        setShowErrorMessageBar(true);
      }
    } catch (error) {
      handleError(error, "executeNaturalLanguageQuery");
      useTabs.getState().setIsQueryErrorThrown(true);
      setShowErrorMessageBar(true);
      throw error;
    } finally {
      setIsGeneratingQuery(false);
      useTabs.getState().setIsTabExecuting(false);
    }
  };

  const getCommandbarButtons = (): CommandButtonComponentProps[] => {
    const executeQueryBtnLabel = selectedQuery ? "Execute Selection" : "Execute Query";
    const executeQueryBtn = {
      iconSrc: ExecuteQueryIcon,
      iconAlt: executeQueryBtnLabel,
      onCommandClick: () => OnExecuteQueryClick(),
      commandButtonLabel: executeQueryBtnLabel,
      ariaLabel: executeQueryBtnLabel,
      hasPopup: false,
      disabled: query?.trim() === "",
    };

    const saveQueryBtn = {
      iconSrc: SaveQueryIcon,
      iconAlt: "Save Query",
      onCommandClick: () =>
        useSidePanel.getState().openSidePanel("Save Query", <SaveQueryPane explorer={explorer} queryToSave={query} />),
      commandButtonLabel: "Save Query",
      ariaLabel: "Save Query",
      hasPopup: false,
      disabled: true,
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
    if (!inputEdited.current) {
      setTimeout(() => {
        if (!inputEdited.current) {
          toggleCopilotTeachingBubbleVisible();
          inputEdited.current = true;
        }
      }, 30000);
    }
  };

  const clearFeedback = () => {
    resetButtonState();
    resetQueryResults();
  };

  const resetButtonState = () => {
    setDislikeQuery(false);
    setLikeQuery(false);
    setShowCallout(false);
  };

  const startGenerateQueryProcess = () => {
    updateHistories();
    generateSQLQuery();
    resetButtonState();
  };

  React.useEffect(() => {
    useCommandBar.getState().setContextButtons(getCommandbarButtons());
  }, [query, selectedQuery]);

  React.useEffect(() => {
    showTeachingBubble();
    useTabs.getState().setIsQueryErrorThrown(false);
  }, []);

  return (
    <Stack className="tab-pane" style={{ padding: 24, width: "100%" }}>
      <div style={isGeneratingQuery ? { height: "100%" } : { overflowY: "auto", height: "100%" }}>
        <Stack horizontal verticalAlign="center">
          <Image src={CopilotIcon} style={{ width: 24, height: 24 }} />
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                inputEdited.current = true;
                startGenerateQueryProcess();
              }
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
            onClick={() => startGenerateQueryProcess()}
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
                          inputEdited.current = true;
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
                          setUserPrompt(prompt.text);
                          setShowSamplePrompts(false);
                          inputEdited.current = true;
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
                      <Link target="_blank" href="https://aka.ms/cdb-copilot-writing">
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
            <Link href="https://aka.ms/cdb-copilot-preview-terms" target="_blank">
              Read preview terms
            </Link>
            {showErrorMessageBar && (
              <MessageBar messageBarType={MessageBarType.error}>
                We ran into an error and were not able to execute query.
              </MessageBar>
            )}
            {showInvalidQueryMessageBar && (
              <MessageBar
                messageBarType={MessageBarType.info}
                styles={{ root: { backgroundColor: "#F0F6FF" }, icon: { color: "#015CDA" } }}
              >
                We were unable to generate a query based upon the prompt provided. Please modify the prompt and try
                again. For examples of how to write a good prompt, please read
                <Link href="https://aka.ms/cdb-copilot-writing" target="_blank">
                  this article.
                </Link>{" "}
                Our content guidelines can be found
                <Link href="https://aka.ms/cdb-query-copilot" target="_blank">
                  here.
                </Link>
              </MessageBar>
            )}
          </Text>
        </Stack>

        {showFeedbackBar && (
          <Stack style={{ backgroundColor: "#FFF8F0", padding: "2px 8px" }} horizontal verticalAlign="center">
            <Text style={{ fontWeight: 600, fontSize: 12 }}>Provide feedback on the query generated</Text>
            {showCallout && !hideFeedbackModalForLikedQueries && (
              <Callout
                style={{ padding: 8 }}
                target="#likeBtn"
                onDismiss={() => {
                  setShowCallout(false);
                  SubmitFeedback({
                    params: {
                      generatedQuery: generatedQuery,
                      likeQuery: likeQuery,
                      description: "",
                      userPrompt: userPrompt,
                    },
                    explorer: explorer,
                  });
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
              wordWrap={"on"}
              ariaLabel={"Editing Query"}
              lineNumbers={"on"}
              onContentChanged={(newQuery: string) => setQuery(newQuery)}
              onContentSelected={(selectedQuery: string) => setSelectedQuery(selectedQuery)}
            />
            <QueryCopilotResults />
          </SplitterLayout>
        </Stack>
        <WelcomeModal visible={localStorage.getItem("hideWelcomeModal") !== "true"} />
        {isSamplePromptsOpen && <SamplePrompts sampleProps={sampleProps} />}
        {query !== "" && query.trim().length !== 0 && (
          <DeletePopup
            showDeletePopup={showDeletePopup}
            setShowDeletePopup={setShowDeletePopup}
            setQuery={setQuery}
            clearFeedback={clearFeedback}
            showFeedbackBar={setShowFeedbackBar}
          />
        )}
        <CopyPopup showCopyPopup={showCopyPopup} setShowCopyPopup={setshowCopyPopup} />
      </div>
    </Stack>
  );
};
