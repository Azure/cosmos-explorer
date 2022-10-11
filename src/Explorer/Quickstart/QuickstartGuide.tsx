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
import {
  distributeTableCommand,
  distributeTableCommandForDisplay,
  loadDataCommand,
  loadDataCommandForDisplay,
  newTableCommand,
  newTableCommandForDisplay,
  queryCommand,
  queryCommandForDisplay,
} from "Explorer/Quickstart/PostgreQuickstartCommands";
import { useTerminal } from "hooks/useTerminal";
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

  const onCopyBtnClicked = (selector: string): void => {
    const textfield: HTMLInputElement = document.querySelector(selector);
    textfield.select();
    document.execCommand("copy");
  };

  const getPivotHeaderIcon = (step: number): string => {
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
                  This tutorial guides you to create and query distributed tables using a sample dataset.
                  <br />
                  <br />
                  To begin, please enter the cluster&apos;s password in the PostgreSQL terminal.
                  <br />
                  <br />
                  Note: If you navigate out of the Quick Start tab (PostgreSQL Shell), the session will be closed and
                  all ongoing commands might be interrupted.
                </Text>
                <Youtube videoId="nT64dFSfiUo" style={{ margin: "20px 0" }} opts={{ width: "90%" }} />
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="New table"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 1)}
              itemKey={GuideSteps[1]}
              onClick={() => setCurrentStep(1)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>Let&apos;s create two tables github_users and github_events in “cosmosdb_tutorial” schema.</Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 150 }}
                  onClick={() => useTerminal.getState().sendMessage(newTableCommand)}
                >
                  Create new table
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="newTableCommand"
                    multiline
                    rows={5}
                    readOnly
                    defaultValue={newTableCommandForDisplay}
                    styles={{
                      root: { width: "90%" },
                      field: {
                        backgroundColor: "#EEEEEE",
                        fontFamily:
                          "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New",
                      },
                    }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#newTableCommand")}
                  />
                </Stack>
                <Youtube videoId="il_sA6U1WcY" style={{ margin: "20px 0" }} opts={{ width: "90%" }} />
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
                  Let’s distribute the two tables using the create_distributed_table() function.
                  <br />
                  <br />
                  We are choosing “user_id” as the distribution column for our sample dataset.
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 200 }}
                  onClick={() => useTerminal.getState().sendMessage(distributeTableCommand)}
                >
                  Create distributed table
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="distributeTableCommand"
                    multiline
                    rows={5}
                    readOnly
                    defaultValue={distributeTableCommandForDisplay}
                    styles={{
                      root: { width: "90%" },
                      field: {
                        backgroundColor: "#EEEEEE",
                        fontFamily:
                          "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New",
                      },
                    }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#distributeTableCommand")}
                  />
                </Stack>
                <Youtube videoId="kCCDRRrN1r0" style={{ margin: "20px 0" }} opts={{ width: "90%" }} />
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Load data"
              onRenderItemLink={(props, defaultRenderer) => customPivotHeaderRenderer(props, defaultRenderer, 3)}
              itemKey={GuideSteps[3]}
              onClick={() => setCurrentStep(3)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>Let&apos;s load the two tables with a sample dataset generated from the GitHub API.</Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 110 }}
                  onClick={() => useTerminal.getState().sendMessage(loadDataCommand)}
                >
                  Load data
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="loadDataCommand"
                    multiline
                    rows={5}
                    readOnly
                    defaultValue={loadDataCommandForDisplay}
                    styles={{
                      root: { width: "90%" },
                      field: {
                        backgroundColor: "#EEEEEE",
                        fontFamily:
                          "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New",
                      },
                    }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#loadDataCommand")}
                  />
                </Stack>
                <Youtube videoId="XSMEE2tujEk" style={{ margin: "20px 0" }} opts={{ width: "90%" }} />
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
                  Congratulations on creating and distributing your tables. Now, it&apos;s time to run your first query!
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 115 }}
                  onClick={() => useTerminal.getState().sendMessage(queryCommand)}
                >
                  Try queries
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="queryCommand"
                    multiline
                    rows={5}
                    readOnly
                    defaultValue={queryCommandForDisplay}
                    styles={{
                      root: { width: "90%" },
                      field: {
                        backgroundColor: "#EEEEEE",
                        fontFamily:
                          "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New",
                      },
                    }}
                  />
                  <IconButton
                    iconProps={{
                      iconName: "Copy",
                    }}
                    onClick={() => onCopyBtnClicked("#queryCommand")}
                  />
                </Stack>
                <Youtube videoId="k_EanjMtaPg" style={{ margin: "20px 0" }} opts={{ width: "90%" }} />
              </Stack>
            </PivotItem>
          </Pivot>
        )}
        {currentStep === 5 && (
          <Stack style={{ margin: "auto" }} horizontalAlign="center">
            <Image src={CompleteIcon} />
            <Text variant="mediumPlus" style={{ fontWeight: 900, marginTop: 7 }}>
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
