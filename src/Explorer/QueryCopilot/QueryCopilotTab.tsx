/* eslint-disable no-console */
import { FeedOptions } from "@azure/cosmos";
import {
  Callout,
  ComboBox,
  CommandBarButton,
  DirectionalHint,
  IComboBox,
  IComboBoxOption,
  IIconProps,
  IconButton,
  Image,
  Link,
  SelectableOptionMenuItemType,
  Separator,
  Spinner,
  Stack,
  Text,
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
import { DeletePopup } from "Explorer/QueryCopilot/Popup/DeletePopup";
import { submitFeedback } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import { SamplePrompts, SamplePromptsProps } from "Explorer/QueryCopilot/SamplePrompts/SamplePrompts";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { queryPagesUntilContentPresent } from "Utils/QueryUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useSidePanel } from "hooks/useSidePanel";
import React, { useState } from "react";
import SplitterLayout from "react-splitter-layout";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import HistoryImage from "../../../images/History.svg";
import CopilotIcon from "../../../images/QueryCopilotNewLogo.svg";
import SamplePromptsIcon from "../../../images/SamplePromptsIcon.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";
import Sparkle from "../../../images/sparkle.svg";

interface QueryCopilotTabProps {
  initialInput: string;
  explorer: Explorer;
}

interface IExtendedComboBoxOption extends IComboBoxOption {
  iconProps?: IIconProps;
}

interface GenerateSQLQueryResponse {
  apiVersion: string;
  sql: string;
  explanation: string;
  generateStart: string;
  generateEnd: string;
}

const copilotHistoryStorageName = "copilotInputHistory";

const suggestedPrompts: IExtendedComboBoxOption[] = [
  { key: "Header1", text: "Suggested Prompts", itemType: SelectableOptionMenuItemType.Header },
  { key: "prompt1", text: "Give me all customers whose name start with C" },
  { key: "prompt2", text: "Show me all customers" },
  { key: "prompt3", text: "Show me all customers who bought a bike in 2019" },
  { key: "prompt4", text: "Show items with a description that contains a number between 0 and 99" },
  { key: "prompt5", text: "Write a query to return all records in this table created in the last thirty days" },
  { key: "Header2", text: "History", itemType: SelectableOptionMenuItemType.Header },
];

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  initialInput,
  explorer,
}: QueryCopilotTabProps): JSX.Element => {
  const hideFeedbackModalForLikedQueries = useQueryCopilot((state) => state.hideFeedbackModalForLikedQueries);
  const [userInput, setUserInput] = useState<string>(initialInput);
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
  const [isSamplePromptsOpen, setIsSamplePromptsOpen] = useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestedPrompts);
  const comboBoxRef = React.useRef<IComboBox>(null);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [querySent, setQuerySent] = useState<boolean>(false);
  const [showDeletePopup, setShowDeletePopup] = useState<boolean>(false);
  const [showFeedbackBar, setShowFeedbackBar] = useState<boolean>(false);

  function updateLocalStorage(key: string, value: string[]) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function getLocalStorageItems(key: string) {
    if (window.localStorage.getItem(key)) return JSON.parse(window.localStorage.getItem(key));
    return [];
  }

  const sampleProps: SamplePromptsProps = {
    isSamplePromptsOpen: isSamplePromptsOpen,
    setIsSamplePromptsOpen: setIsSamplePromptsOpen,
    setTextBox: setUserInput,
  };

  const onsuggestedPromptOption = (suggestion: IExtendedComboBoxOption): JSX.Element => {
    if (suggestion.itemType === SelectableOptionMenuItemType.Header) {
      return <span>{suggestion.text}</span>;
    }

    if (suggestion.iconProps && suggestion.iconProps.iconName === "Clock") {
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image src={HistoryImage} style={{ marginRight: 8 }} />
          <span>{suggestion.text}</span>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Image src={Sparkle} style={{ marginRight: 8 }} />
        <span>{suggestion.text}</span>
      </div>
    );
  };

  const handleInputChange = (event: React.FormEvent<IComboBox>, newTextValue?: IComboBoxOption) => {
    const inputValue = (event.target as HTMLInputElement).value;
    const newInput = (newTextValue ? newTextValue.text : inputValue) || "";

    setUserInput(newInput);

    if (newInput !== "" && newInput.trim().length !== 0) {
      const updatedHistory = [newInput, ...getLocalStorageItems(copilotHistoryStorageName)];
      const distinctHistory = Array.from(new Set(updatedHistory)).slice(0, 4);
      updateLocalStorage(copilotHistoryStorageName, distinctHistory);
      setInputHistory(distinctHistory);
    }
  };

  const handleOnKeyUp = (event: React.FormEvent<IComboBox>) => {
    const newInputValue = (event.target as HTMLInputElement).value;
    const filteredOptions = suggestedPrompts.filter((option) =>
      option.text.toLowerCase().includes(newInputValue.toLowerCase())
    );
    const historyOptions = inputHistory.filter((input) => input.toLowerCase().includes(newInputValue.toLowerCase()));

    setFilteredSuggestions(filteredOptions);
    newInputValue === ""
      ? setInputHistory(getLocalStorageItems(copilotHistoryStorageName))
      : setInputHistory(historyOptions);
  };

  const handleSendClick = () => {
    if (comboBoxRef.current) {
      comboBoxRef.current.focus(true);
    }
    setUserInput("");
    setQuerySent(true);
  };

  function copyToClipboard() {
    navigator.clipboard.writeText(query);
  }

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
        let query = `-- ${userInput}\r\n`;
        if (generateSQLQueryResponse.explanation) {
          query += "-- **Explanation of query**\r\n";
          query += `-- ${generateSQLQueryResponse.explanation}\r\n`;
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
      setUserInput("");
      setShowFeedbackBar(true);
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

  const comboBoxStyleRef = React.useRef(null);
  React.useEffect(() => {
    const handleResize = () => {
      const comboBoxElement = comboBoxStyleRef.current;
      if (comboBoxElement) {
        const viewportWidth = window.innerWidth;
        const desiredWidth = viewportWidth * 1; // Adjust the percentage as needed
        comboBoxElement.style.setProperty("--dropdown-width", `${desiredWidth}px`);
      }
    };

    handleResize(); // Set initial width
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  React.useEffect(() => {
    setInputHistory(getLocalStorageItems(copilotHistoryStorageName));
  }, []);

  React.useEffect(() => {
    if (querySent) {
      setUserInput("");
      setQuerySent(false);
    }
  }, [querySent]);

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
        <ComboBox
          styles={{ root: { width: "80vw" } }}
          calloutProps={{
            styles: { root: { maxHeight: "50vh", maxWidth: "var(--dropdown-width)", overflowY: "auto" } },
          }}
          dropdownWidth={1335}
          disabled={isGeneratingQuery}
          onChange={handleInputChange}
          options={[
            ...filteredSuggestions,
            ...inputHistory.map((text, index, iconProps) => ({
              key: `history${index}`,
              text,
              iconProps: { iconName: "Clock" },
            })),
          ]}
          onRenderOption={onsuggestedPromptOption}
          allowFreeform
          autoComplete="off"
          componentRef={comboBoxRef}
          text={userInput}
          onClick={handleSendClick}
          onKeyUp={handleOnKeyUp}
        />
        <IconButton
          iconProps={{ iconName: "Send" }}
          disabled={isGeneratingQuery}
          style={{ marginLeft: "8px" }}
          onClick={() => generateSQLQuery()}
        />
        {isGeneratingQuery && <Spinner style={{ marginLeft: "8px" }} />}
      </Stack>
      <Text style={{ marginTop: 8, marginBottom: 24, fontSize: 12 }}>
        AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
        <Link href="" target="_blank">
          Read preview terms
        </Link>
      </Text>
      {showFeedbackBar ? (
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
          <CommandBarButton
            onClick={copyToClipboard}
            iconProps={{ iconName: "Copy" }}
            style={{ margin: "0 10px", backgroundColor: "#FFF8F0", transition: "background-color 0.3s ease" }}
          >
            Copy code
          </CommandBarButton>
          <CommandBarButton
            onClick={() => setShowDeletePopup(true)}
            iconProps={{ iconName: "Delete" }}
            style={{ margin: "0 10px", backgroundColor: "#FFF8F0", transition: "background-color 0.3s ease" }}
          >
            Delete code
          </CommandBarButton>
        </Stack>
      ) : (
        <></>
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
      {isSamplePromptsOpen ? <SamplePrompts sampleProps={sampleProps} /> : <></>}
      {query !== "" && query.trim().length !== 0 ? (
        <DeletePopup showDeletePopup={showDeletePopup} setShowDeletePopup={setShowDeletePopup} setQuery={setQuery} />
      ) : (
        <></>
      )}
    </Stack>
  );
};
