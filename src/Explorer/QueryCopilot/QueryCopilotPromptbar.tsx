/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { HttpStatusCodes } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { createUri } from "Common/UrlUtility";
import { WelcomeModal } from "Explorer/QueryCopilot/Modal/WelcomeModal";
import { CopyPopup } from "Explorer/QueryCopilot/Popup/CopyPopup";
import { DeletePopup } from "Explorer/QueryCopilot/Popup/DeletePopup";
import {
  SuggestedPrompt,
  getSampleDatabaseSuggestedPrompts,
  getSuggestedPrompts,
} from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { SubmitFeedback, allocatePhoenixContainer } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { GenerateSQLQueryResponse, QueryCopilotProps } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { SamplePrompts, SamplePromptsProps } from "Explorer/QueryCopilot/Shared/SamplePrompts/SamplePrompts";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { userContext } from "UserContext";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React, { useRef, useState } from "react";
import HintIcon from "../../../images/Hint.svg";
import CopilotIcon from "../../../images/QueryCopilotNewLogo.svg";
import RecentIcon from "../../../images/Recent.svg";
import errorIcon from "../../../images/close-black.svg";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { useTabs } from "../../hooks/useTabs";
import { useCopilotStore } from "../QueryCopilot/QueryCopilotContext";
import { useSelectedNode } from "../useSelectedNode";

type QueryCopilotPromptProps = QueryCopilotProps & {
  databaseId: string;
  containerId: string;
  toggleCopilot: (toggle: boolean) => void;
};

const promptStyles: IButtonStyles = {
  root: { border: 0, selectors: { ":hover": { outline: "1px dashed #605e5c" } } },
  label: {
    fontWeight: 400,
    textAlign: "left",
    paddingLeft: 8,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  textContainer: { overflow: "hidden" },
};

export const QueryCopilotPromptbar: React.FC<QueryCopilotPromptProps> = ({
  explorer,
  toggleCopilot,
  databaseId,
  containerId,
}: QueryCopilotPromptProps): JSX.Element => {
  const [copilotTeachingBubbleVisible, setCopilotTeachingBubbleVisible] = useState<boolean>(false);
  const inputEdited = useRef(false);
  const {
    openFeedbackModal,
    hideFeedbackModalForLikedQueries,
    userPrompt,
    setUserPrompt,
    generatedQuery,
    setGeneratedQuery,
    query,
    setQuery,
    isGeneratingQuery,
    setIsGeneratingQuery,
    likeQuery,
    setLikeQuery,
    dislikeQuery,
    setDislikeQuery,
    showCallout,
    setShowCallout,
    isSamplePromptsOpen,
    setIsSamplePromptsOpen,
    showSamplePrompts,
    setShowSamplePrompts,
    showPromptTeachingBubble,
    setShowPromptTeachingBubble,
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
    errorMessage,
  } = useCopilotStore();

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

  const isSampleCopilotActive = useSelectedNode.getState().isQueryCopilotCollectionSelected();
  const cachedHistoriesString = localStorage.getItem(`${userContext.databaseAccount?.id}-queryCopilotHistories`);
  const cachedHistories = cachedHistoriesString?.split("|");
  const [histories, setHistories] = useState<string[]>(cachedHistories || []);
  const suggestedPrompts: SuggestedPrompt[] = isSampleCopilotActive
    ? getSampleDatabaseSuggestedPrompts()
    : getSuggestedPrompts();
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
      const mode: string = isSampleCopilotActive ? "Sample" : "User";

      await allocatePhoenixContainer({ explorer, databaseId, containerId, mode });

      const payload = {
        userPrompt: userPrompt,
      };
      useQueryCopilot.getState().refreshCorrelationId();
      const serverInfo = useQueryCopilot.getState().notebookServerInfo;
      const queryUri = userContext.features.disableCopilotPhoenixGateaway
        ? createUri("https://copilotorchestrater.azurewebsites.net/", "generateSQLQuery")
        : createUri(serverInfo.notebookServerEndpoint, "public/generateSQLQuery");
      const response = await fetch(queryUri, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ms-correlationid": useQueryCopilot.getState().correlationId,
          Authorization: `token ${useQueryCopilot.getState().notebookServerInfo.authToken}`,
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
          TelemetryProcessor.traceSuccess(Action.QueryGenerationFromCopilotPrompt, {
            databaseName: databaseId,
            collectionId: containerId,
            copilotLatency:
              Date.parse(generateSQLQueryResponse?.generateEnd) - Date.parse(generateSQLQueryResponse?.generateStart),
            responseCode: response.status,
          });
        } else {
          setShowInvalidQueryMessageBar(true);
          TelemetryProcessor.traceFailure(Action.QueryGenerationFromCopilotPrompt, {
            databaseName: databaseId,
            collectionId: containerId,
            responseCode: response.status,
          });
        }
      } else if (response?.status === HttpStatusCodes.TooManyRequests) {
        handleError(JSON.stringify(generateSQLQueryResponse), "copilotTooManyRequestError");
        useTabs.getState().setIsQueryErrorThrown(true);
        setShowErrorMessageBar(true);
        setErrorMessage("Ratelimit exceeded 5 per 1 minute. Please try again after sometime");
        TelemetryProcessor.traceFailure(Action.QueryGenerationFromCopilotPrompt, {
          databaseName: databaseId,
          collectionId: containerId,
          responseCode: response.status,
        });
      } else {
        handleError(JSON.stringify(generateSQLQueryResponse), "copilotInternalServerError");
        useTabs.getState().setIsQueryErrorThrown(true);
        setShowErrorMessageBar(true);
        TelemetryProcessor.traceFailure(Action.QueryGenerationFromCopilotPrompt, {
          databaseName: databaseId,
          collectionId: containerId,
          responseCode: response.status,
        });
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

  const showTeachingBubble = (): void => {
    if (showPromptTeachingBubble && !inputEdited.current) {
      setTimeout(() => {
        if (!inputEdited.current && !isWelcomModalVisible()) {
          setCopilotTeachingBubbleVisible(true);
          inputEdited.current = true;
        }
      }, 30000);
    } else {
      toggleCopilotTeachingBubbleVisible(false);
    }
  };

  const toggleCopilotTeachingBubbleVisible = (visible: boolean): void => {
    setCopilotTeachingBubbleVisible(visible);
    setShowPromptTeachingBubble(visible);
  };

  const isWelcomModalVisible = (): boolean => {
    return localStorage.getItem("hideWelcomeModal") !== "true";
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

  const getAriaLabel = () => {
    if (isGeneratingQuery === null) {
      return " ";
    } else if (isGeneratingQuery) {
      return "Content is loading";
    } else {
      return "Content is updated";
    }
  };

  React.useEffect(() => {
    showTeachingBubble();
    useTabs.getState().setIsQueryErrorThrown(false);
  }, []);

  return (
    <Stack
      className="copilot-prompt-pane"
      styles={{ root: { backgroundColor: "#FAFAFA", padding: "16px 24px 0px" } }}
      id="copilot-textfield-label"
    >
      <Stack horizontal>
        <Image src={CopilotIcon} style={{ width: 24, height: 24 }} alt="Copilot" role="none" />
        <Text style={{ marginLeft: 8, fontWeight: 600, fontSize: 16 }}>Copilot</Text>
        <IconButton
          iconProps={{ imageProps: { src: errorIcon } }}
          onClick={() => {
            toggleCopilot(false);
            clearFeedback();
            resetMessageStates();
          }}
          styles={{
            root: {
              marginLeft: "auto !important",
            },
          }}
          ariaLabel="Close"
          title="Close copilot"
        />
      </Stack>
      <Stack horizontal verticalAlign="center">
        <TextField
          id="naturalLanguageInput"
          value={userPrompt}
          onChange={handleUserPromptChange}
          onClick={() => {
            inputEdited.current = true;
            setShowSamplePrompts(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && userPrompt) {
              inputEdited.current = true;
              startGenerateQueryProcess();
            }
          }}
          style={{ lineHeight: 30 }}
          styles={{ root: { width: "95%" }, fieldGroup: { borderRadius: 6 } }}
          disabled={isGeneratingQuery}
          autoComplete="off"
          placeholder="Ask a question in natural language and we’ll generate the query for you."
          aria-labelledby="copilot-textfield-label"
        />
        {showPromptTeachingBubble && copilotTeachingBubbleVisible && (
          <TeachingBubble
            calloutProps={{ directionalHint: DirectionalHint.bottomCenter }}
            target="#naturalLanguageInput"
            hasCloseButton={true}
            closeButtonAriaLabel="Close"
            onDismiss={() => toggleCopilotTeachingBubbleVisible(false)}
            hasSmallHeadline={true}
            headline="Write a prompt"
          >
            Write a prompt here and Copilot will generate the query for you. You can also choose from our{" "}
            <Link
              onClick={() => {
                setShowSamplePrompts(true);
                toggleCopilotTeachingBubbleVisible(false);
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
          aria-label="Send"
        />
        <div role="alert" aria-label={getAriaLabel()}>
          {isGeneratingQuery && <Spinner style={{ marginLeft: 8 }} />}
        </div>
        {showSamplePrompts && (
          <Callout
            styles={{ root: { minWidth: 400, maxWidth: "70vw" } }}
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
                      onRenderIcon={() => <Image src={RecentIcon} styles={{ root: { overflow: "unset" } }} />}
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

      <Stack style={{ margin: "8px 0" }}>
        <Text style={{ fontSize: 12 }}>
          AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
          <Link href="https://aka.ms/cdb-copilot-preview-terms" target="_blank" style={{ color: "#0072c9" }}>
            Read preview terms
          </Link>
          {showErrorMessageBar && (
            <MessageBar messageBarType={MessageBarType.error}>
              {errorMessage ? errorMessage : "We ran into an error and were not able to execute query."}
            </MessageBar>
          )}
          {showInvalidQueryMessageBar && (
            <MessageBar
              messageBarType={MessageBarType.info}
              styles={{ root: { backgroundColor: "#F0F6FF" }, icon: { color: "#015CDA" } }}
            >
              We were unable to generate a query based upon the prompt provided. Please modify the prompt and try again.
              For examples of how to write a good prompt, please read
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
              role="status"
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
                  explorer,
                  databaseId,
                  containerId,
                  mode: isSampleCopilotActive ? "Sample" : "User",
                });
              }}
              directionalHint={DirectionalHint.topCenter}
            >
              <Text>
                Thank you. Need to give{" "}
                <Link
                  onClick={() => {
                    setShowCallout(false);
                    openFeedbackModal(generatedQuery, true, userPrompt);
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
            aria-label="Like"
            role="toggle"
            iconProps={{ iconName: likeQuery === true ? "LikeSolid" : "Like" }}
            onClick={() => {
              setShowCallout(!likeQuery);
              setLikeQuery(!likeQuery);
              if (likeQuery === true) {
                document.getElementById("likeStatus").innerHTML = "Unpressed";
              }
              if (likeQuery === false) {
                document.getElementById("likeStatus").innerHTML = "Liked";
              }
              if (dislikeQuery) {
                setDislikeQuery(!dislikeQuery);
              }
            }}
          />
          <IconButton
            style={{ margin: "0 10px" }}
            role="toggle"
            aria-label="Dislike"
            iconProps={{ iconName: dislikeQuery === true ? "DislikeSolid" : "Dislike" }}
            onClick={() => {
              let toggleStatusValue = "Unpressed";
              if (!dislikeQuery) {
                openFeedbackModal(generatedQuery, false, userPrompt);
                setLikeQuery(false);
                toggleStatusValue = "Disliked";
              }
              setDislikeQuery(!dislikeQuery);
              setShowCallout(false);
              document.getElementById("likeStatus").innerHTML = toggleStatusValue;
            }}
          />

          <span role="status" style={{ position: "absolute", left: "-9999px" }} id="likeStatus"></span>

          <Separator vertical style={{ color: "#EDEBE9" }} />
          <CommandBarButton
            className="copyQuery"
            onClick={copyGeneratedCode}
            iconProps={{ iconName: "Copy" }}
            style={{ margin: "0 10px", backgroundColor: "#FFF8F0", transition: "background-color 0.3s ease" }}
          >
            Copy query
          </CommandBarButton>
          <CommandBarButton
            className="deleteQuery"
            onClick={() => {
              setShowDeletePopup(true);
            }}
            iconProps={{ iconName: "Delete" }}
            style={{ margin: "0 10px", backgroundColor: "#FFF8F0", transition: "background-color 0.3s ease" }}
          >
            Delete query
          </CommandBarButton>
        </Stack>
      )}
      <WelcomeModal visible={isWelcomModalVisible()} />
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
    </Stack>
  );
};
