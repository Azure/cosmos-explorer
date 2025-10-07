import {
  DefaultButton,
  IconButton,
  Link,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import { customPivotHeaderRenderer } from "Explorer/Quickstart/Shared/QuickstartRenderUtilities";
import {
  findAndSortCommand,
  findAndSortCommandForDisplay,
  findByPagesCommand,
  findByPagesCommandForDisplay,
  findOrwellCommand,
  findOrwellCommandForDisplay,
  loadDataCommand,
  newDbAndCollectionCommand,
  newDbAndCollectionCommandForDisplay,
} from "Explorer/Quickstart/VCoreMongoQuickstartCommands";
import { useTerminal } from "hooks/useTerminal";
import React, { useState } from "react";
import { ReactTabKind, useTabs } from "../../hooks/useTabs";

enum GuideSteps {
  Login,
  NewTable,
  DistributeTable,
  LoadData,
  Query,
}

export const VcoreMongoQuickstartGuide: React.FC = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const onCopyBtnClicked = (selector: string): void => {
    const textfield: HTMLInputElement = document.querySelector(selector);
    textfield.select();
    document.execCommand("copy");
  };

  return (
    <Stack style={{ paddingTop: 8, height: "100%", width: "100%" }}>
      <Stack style={{ flexGrow: 1, padding: "0 20px", overflow: "auto" }}>
        <Text variant="xxLarge">Quick start guide</Text>
        <Text variant="small">Getting started in Azure DocumentDB (with MongoDB compatibility)</Text>
        {currentStep < 5 && (
          <Pivot
            style={{ marginTop: 10, width: "100%" }}
            selectedKey={GuideSteps[currentStep]}
            onLinkClick={(item?: PivotItem) => setCurrentStep(Object.values(GuideSteps).indexOf(item.props.itemKey))}
          >
            <PivotItem
              headerText="Connect"
              onRenderItemLink={(props, defaultRenderer) =>
                customPivotHeaderRenderer(props, defaultRenderer, currentStep, 0)
              }
              itemKey={GuideSteps[0]}
              onClick={() => {
                setCurrentStep(0);
              }}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  This tutorial guides you to create and query distributed tables using a sample dataset.
                  <br />
                  <br />
                  To start, input the admin password you used during the cluster creation process into the Document DB
                  terminal.
                  <br />
                  <br />
                  <br />
                  Note: If you navigate out of the Quick start blade &#40;MongoDB Shell&#41;, the session will be closed
                  and all ongoing commands might be interrupted.
                </Text>
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="New collection"
              onRenderItemLink={(props, defaultRenderer) =>
                customPivotHeaderRenderer(props, defaultRenderer, currentStep, 1)
              }
              itemKey={GuideSteps[1]}
              onClick={() => setCurrentStep(1)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  In MongoDB, data is stored in collections, which are analogous to tables in relational databases.
                  Collections contain documents, each of which consists of field and value pairs. The fields in
                  documents are similar to the columns in a relational database table. One key advantage of MongoDB is
                  that these documents within a collection can have different fields.
                  <br />
                  <br />
                  You&apos;re now going to create a new database and a collection within that database using the Mongo
                  shell. In MongoDB, creating a database or a collection is implicit. This means that databases and
                  collections are created when you first reference them in a command, so no explicit creation command is
                  necessary.
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 270 }}
                  onClick={() => useTerminal.getState().sendMessage(newDbAndCollectionCommand)}
                >
                  Create new database and collection
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="newDbAndCollectionCommand"
                    multiline
                    rows={5}
                    readOnly
                    defaultValue={newDbAndCollectionCommandForDisplay}
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
                    onClick={() => onCopyBtnClicked("#newDbAndCollectionCommand")}
                  />
                </Stack>
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Load data"
              onRenderItemLink={(props, defaultRenderer) =>
                customPivotHeaderRenderer(props, defaultRenderer, currentStep, 2)
              }
              itemKey={GuideSteps[2]}
              onClick={() => setCurrentStep(2)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  Now that you&apos;ve created your database and collection, it&apos;s time to populate your collection
                  with data. In MongoDB, data is stored as documents, which are structured as field and value pairs.
                  <br />
                  <br />
                  We&apos;ll add 10 documents representing books, each with a title, author, and number of pages, to
                  your sampleCollection in the quickstartDB database.
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 200 }}
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
                    defaultValue={loadDataCommand}
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
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Queries"
              onRenderItemLink={(props, defaultRenderer) =>
                customPivotHeaderRenderer(props, defaultRenderer, currentStep, 3)
              }
              itemKey={GuideSteps[3]}
              onClick={() => setCurrentStep(3)}
            >
              <Stack style={{ marginTop: 20 }}>
                <Text>
                  Once you&apos;ve inserted data into your sampleCollection, you can retrieve it using queries. MongoDB
                  queries can be as simple or as complex as you need them to be, allowing you to filter, sort, and limit
                  results.
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 110 }}
                  onClick={() => useTerminal.getState().sendMessage(findOrwellCommand)}
                >
                  Try query
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="findOrwellCommand"
                    multiline
                    rows={2}
                    readOnly
                    defaultValue={findOrwellCommandForDisplay}
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
                    onClick={() => onCopyBtnClicked("#findOrwellCommand")}
                  />
                </Stack>
                <DefaultButton
                  style={{ marginTop: 32, width: 110 }}
                  onClick={() => useTerminal.getState().sendMessage(findByPagesCommand)}
                >
                  Try query
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="findByPagesCommand"
                    multiline
                    rows={2}
                    readOnly
                    defaultValue={findByPagesCommandForDisplay}
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
                    onClick={() => onCopyBtnClicked("#findByPagesCommand")}
                  />
                </Stack>
                <DefaultButton
                  style={{ marginTop: 32, width: 110 }}
                  onClick={() => useTerminal.getState().sendMessage(findAndSortCommand)}
                >
                  Try query
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="findAndSortCommand"
                    multiline
                    rows={2}
                    readOnly
                    defaultValue={findAndSortCommandForDisplay}
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
                    onClick={() => onCopyBtnClicked("#findAndSortCommand")}
                  />
                </Stack>
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Next steps"
              onRenderItemLink={(props, defaultRenderer) =>
                customPivotHeaderRenderer(props, defaultRenderer, currentStep, 4)
              }
              itemKey={GuideSteps[4]}
              onClick={() => setCurrentStep(4)}
            >
              <Stack>
                <Text>
                  <b>Migrate existing data</b>
                  <br />
                  <br />
                  Modernize your data seamlessly from an existing MongoDB cluster, whether it&apos;s on-premises or
                  hosted in the cloud, to Azure DocumentDB.&nbsp;
                  <Link
                    target="_blank"
                    href="https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/migration-options"
                  >
                    Learn more
                  </Link>
                </Text>
              </Stack>
            </PivotItem>
          </Pivot>
        )}
      </Stack>
      <Stack horizontal style={{ padding: "16px 20px", boxShadow: "inset 0px 1px 0px rgba(204, 204, 204, 0.8)" }}>
        <DefaultButton disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
          Previous
        </DefaultButton>
        {currentStep < 4 && (
          <PrimaryButton onClick={() => setCurrentStep(currentStep + 1)} style={{ marginLeft: 8 }}>
            Next
          </PrimaryButton>
        )}
        {currentStep === 4 && (
          <PrimaryButton
            onClick={() => useTabs.getState().closeReactTab(ReactTabKind.Quickstart)}
            style={{ marginLeft: 8 }}
          >
            Done
          </PrimaryButton>
        )}
      </Stack>
    </Stack>
  );
};
