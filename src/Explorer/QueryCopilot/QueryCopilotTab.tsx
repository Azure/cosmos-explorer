/* eslint-disable no-console */
import { IconButton, Image, Link, Stack, Text, TextField } from "@fluentui/react";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import React from "react";
import CopilotIcon from "../../../images/Copilot.svg";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";

interface QueryCopilotTabProps {
  initialInput: string;
}

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  initialInput,
}: QueryCopilotTabProps): JSX.Element => {
  const [userInput, setUserInput] = React.useState<string>(initialInput || "");
  const [query, setQuery] = React.useState<string>("");
  const [selectedQuery, setSelectedQuery] = React.useState<string>("");

  const generateQuery = (): string => {
    switch (userInput) {
      case "Write a query to return all recrods in this table":
        return "SELECT * FROM c";
      case "Write a query to return all records in this table created in the last thirty days":
        return "SELECT * FROM c WHERE c._ts > (DATEDIFF(s, '1970-01-01T00:00:00Z', GETUTCDATE()) - 2592000) * 1000";
      case `Write a query to return all records in this table created in the last thirty days which also have the record owner as "Contoso"`:
        return `SELECT * FROM c WHERE c.owner = "Contoso" AND c._ts > (DATEDIFF(s, '1970-01-01T00:00:00Z', GETUTCDATE()) - 2592000) * 1000`;
      default:
        return "";
    }
  };

  const onExecuteQueryClick = () => {
    //TODO: implement execute query
    return;
  };

  const onSaveQueryClick = () => {
    //TODO: implement save query
    return;
  };

  const getCommandbarButtons = (): CommandButtonComponentProps[] => {
    const executeQueryBtnLabel = selectedQuery ? "Execute Selection" : "Execute Query";
    const executeQueryBtn = {
      iconSrc: ExecuteQueryIcon,
      iconAlt: executeQueryBtnLabel,
      onCommandClick: onExecuteQueryClick,
      commandButtonLabel: executeQueryBtnLabel,
      ariaLabel: executeQueryBtnLabel,
      hasPopup: false,
    };

    const saveQueryBtn = {
      iconSrc: SaveQueryIcon,
      iconAlt: "Save Query",
      onCommandClick: onSaveQueryClick,
      commandButtonLabel: "Save Query",
      ariaLabel: "Save Query",
      hasPopup: false,
    };

    return [executeQueryBtn, saveQueryBtn];
  };

  React.useEffect(() => {
    useCommandBar.getState().setContextButtons(getCommandbarButtons());
  }, []);

  return (
    <Stack style={{ padding: 24, width: "100%", height: "100%" }}>
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

      <EditorReact
        language={"sql"}
        content={query}
        isReadOnly={false}
        ariaLabel={"Editing Query"}
        lineNumbers={"on"}
        onContentChanged={(newQuery: string) => setQuery(newQuery)}
        onContentSelected={(selectedQuery: string) => setSelectedQuery(selectedQuery)}
      />
    </Stack>
  );
};
