import {
  DefaultButton,
  Icon,
  IconButton,
  Image,
  IPivotItemProps,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import React, { useState } from "react";
import Youtube from "react-youtube";
import Pivot1SelectedIcon from "../../../images/Pivot1_selected.svg";
import Pivot2Icon from "../../../images/Pivot2.svg";
import Pivot2SelectedIcon from "../../../images/Pivot2_selected.svg";
import Pivot3Icon from "../../../images/Pivot3.svg";
import Pivot3SelectedIcon from "../../../images/Pivot3_selected.svg";
import Pivot4Icon from "../../../images/Pivot4.svg";
import Pivot4SelectedIcon from "../../../images/Pivot4_selected.svg";
import Pivot5Icon from "../../../images/Pivot5.svg";
import Pivot5SelectedIcon from "../../../images/Pivot5_selected.svg";
import CompleteIcon from "../../../images/QuickstartComplete.svg";
import { ReactTabKind, useTabs } from "../../hooks/useTabs";

enum GuideSteps {
  Login,
  NewTable,
  DistributeTable,
  LoadData,
  Query,
}

export const QuickstartGuide: React.FC = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const newTableCommand = `CREATE TABLE github_users
(
user_id bigint,
url text,
login text,
  .....`;
  const distributeTableCommand = `SELECT create_distributed_table('github_users', 'user_id');
SELECT create_distributed_table('github_events', 'user_id');`;
  const loadDataCommand = `-- download users and store in table

COPY github_users FROM PROGRAM 'curl https://examples.citusdata.com/
users.csv' WITH (FORMAT CSV)`;
  const queryCommand = `-- Find all events for a single user.
-- (A common transactional/operational query)

SELECT created_at, event_type, repo->>'name' AS repo_name
FROM github_events
WHERE user_id = 3861633;`;

  const onCopyBtnClicked = (selector: string): void => {
    const textfield: HTMLInputElement = document.querySelector(selector);
    textfield.select();
    document.execCommand("copy");
  };

  const getPivotHeaderIcon = (step: number): string => {
    if (step === 0) {
      return Pivot1SelectedIcon;
    }

    switch (step) {
      case 0:
        return Pivot1SelectedIcon;
      case 1:
        return step === currentStep ? Pivot2SelectedIcon : Pivot2Icon;
      case 2:
        return step === currentStep ? Pivot3SelectedIcon : Pivot3Icon;
      case 3:
        return step === currentStep ? Pivot4SelectedIcon : Pivot4Icon;
      case 4:
        return step === currentStep ? Pivot5SelectedIcon : Pivot5Icon;
      default:
        return "";
    }
  };

  const customPivotHeaderRenderer = (
    link: IPivotItemProps,
    defaultRenderer: (link?: IPivotItemProps) => JSX.Element | null,
    step: number
  ): JSX.Element | null => {
    if (!link || !defaultRenderer) {
      return null;
    }

    return (
      <Stack horizontal verticalAlign="center">
        {currentStep > step ? (
          <Icon iconName="CompletedSolid" style={{ color: "#57A300", marginRight: 8 }} />
        ) : (
          <Image style={{ marginRight: 8 }} src={getPivotHeaderIcon(step)} />
        )}
        {defaultRenderer({ ...link, itemIcon: undefined })}
      </Stack>
    );
  };

  return (
    <Stack style={{ paddingTop: 8, height: "100%", width: "100%" }}>
      <Stack style={{ flexGrow: 1, padding: "0 20px", overflow: "auto" }}>
        <Text variant="xxLarge">Quick start guide</Text>
        <Text variant="medium">Gettings started in Cosmos DB</Text>
        {currentStep < 5 && (
          <Pivot style={{ marginTop: 10, width: "100%" }} selectedKey={GuideSteps[currentStep]}>
            <PivotItem
              headerText="Login"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 0)}
              itemKey={GuideSteps[0]}
              onClick={() => setCurrentStep(0)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  This tutorial walks you through the most essential Cosmos DB PostgreSQL statements that will be used
                  in the PostgreSQL shell (on the right). You can also choose to go through this quick start by
                  connecting to PGAdmin or other tooling of your choice. <br />
                  <br /> Before you can interact with your data using PGShell, you will need to login - please follow
                  instructions on the right to enter your password
                </Text>
                <Youtube videoId="Jvgh64rvdXU" style={{ margin: "20px 0" }} opts={{ width: "60%" }} />
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="New table"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 1)}
              itemKey={GuideSteps[1]}
              onClick={() => setCurrentStep(1)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  After logging in, let’s create some new tables for storing data. We will start with two sample tables
                  - one for storing github users and one for storing github events
                </Text>
                <DefaultButton style={{ marginTop: 16, width: 110 }}>New table</DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="newTableCommand"
                    multiline
                    rows={6}
                    readOnly
                    defaultValue={newTableCommand}
                    styles={{ root: { width: "90%" } }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#newTableCommand")}
                  />
                </Stack>
                <Youtube videoId="Jvgh64rvdXU" style={{ margin: "20px 0" }} opts={{ width: "60%" }} />
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Distribute table"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 2)}
              itemKey={GuideSteps[2]}
              onClick={() => setCurrentStep(2)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  Congratulations, you have now created your first 2 tables.
                  <br />
                  <br />
                  Your table needs to be sharded on the worker nodes. You need to distribute table before you load any
                  data or run any queries
                </Text>
                <DefaultButton style={{ marginTop: 16, width: 150 }}>Distribute table</DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="distributeTableCommand"
                    multiline
                    rows={2}
                    readOnly
                    defaultValue={distributeTableCommand}
                    styles={{ root: { width: "90%" } }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#distributeTableCommand")}
                  />
                </Stack>
                <Youtube videoId="Jvgh64rvdXU" style={{ margin: "20px 0" }} opts={{ width: "60%" }} />
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Load data"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 3)}
              itemKey={GuideSteps[3]}
              onClick={() => setCurrentStep(3)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  We&apos;re ready to fill the tables with sample data.
                  <br />
                  <br />
                  For this quick start, we&apos;ll use a dataset previously captured from the GitHub API. Run the
                  command below to load the data
                </Text>
                <DefaultButton style={{ marginTop: 16, width: 110 }}>Load data</DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="loadDataCommand"
                    multiline
                    rows={4}
                    readOnly
                    defaultValue={loadDataCommand}
                    styles={{ root: { width: "90%" } }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#loadDataCommand")}
                  />
                </Stack>
                <Youtube videoId="Jvgh64rvdXU" style={{ margin: "20px 0" }} opts={{ width: "60%" }} />
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Query"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 4)}
              itemKey={GuideSteps[4]}
              onClick={() => setCurrentStep(4)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  github_users is a distributed table, meaning its data is divided between multiple shards. Hyperscale
                  (Citus) automatically runs the count on all shards in parallel, and combines the results. Let’s try a
                  query.
                </Text>
                <DefaultButton style={{ marginTop: 16, width: 110 }}>Try query</DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="queryCommand"
                    multiline
                    rows={6}
                    readOnly
                    defaultValue={queryCommand}
                    styles={{ root: { width: "90%" } }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#queryCommand")}
                  />
                </Stack>
                <Youtube videoId="Jvgh64rvdXU" style={{ margin: "20px 0" }} opts={{ width: "60%" }} />
              </Stack>
            </PivotItem>
          </Pivot>
        )}
        {currentStep === 5 && (
          <Stack style={{ margin: "auto" }} horizontalAlign="center">
            <Image src={CompleteIcon} />
            <Text variant="mediumPlus" style={{ fontWeight: 600, marginTop: 7 }}>
              You are all set!
            </Text>
            <Text variant="mediumPlus" style={{ marginTop: 8 }}>
              You have completed the quick start guide.{" "}
            </Text>
          </Stack>
        )}
      </Stack>
      <Stack horizontal style={{ padding: "16px 20px", boxShadow: "inset 0px 1px 0px rgba(204, 204, 204, 0.8)" }}>
        <DefaultButton disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
          Previous
        </DefaultButton>
        {currentStep < 5 && (
          <PrimaryButton onClick={() => setCurrentStep(currentStep + 1)} style={{ marginLeft: 8 }}>
            Next
          </PrimaryButton>
        )}
        {currentStep === 5 && (
          <PrimaryButton
            onClick={() => useTabs.getState().closeReactTab(ReactTabKind.Quickstart)}
            style={{ marginLeft: 8 }}
          >
            Close
          </PrimaryButton>
        )}
      </Stack>
    </Stack>
  );
};
