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
import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { customPivotHeaderRenderer } from "Explorer/Quickstart/Shared/QuickstartRenderUtilities";
import {
  loadDataCommand,
  newDbAndCollectionCommand,
  newDbAndCollectionCommandForDisplay,
  queriesCommand,
  queriesCommandForDisplay,
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
        <Text variant="small">Getting started in Cosmos DB Mongo DB (vCore)</Text>
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
                  A hosted mongosh (mongo shell) is provided for this quick start. You are automatically logged in to
                  mongosh, allowing you to interact with your database directly.
                  <br />
                  <br />
                  When not in the quick start guide, connecting to Azure Cosmos DB for MongoDB vCore is straightforward
                  using your connection string.
                  <br />
                  <br />
                  <Link
                    aria-label="View connection string"
                    href=""
                    onClick={() => sendMessage({ type: MessageTypes.OpenVCoreMongoConnectionStringsBlade })}
                  >
                    View connection string
                  </Link>
                  <br />
                  <br />
                  This string contains placeholders for &lt;user&gt; and &lt;password&gt;. Replace them with your chosen
                  username and password to establish a secure connection to your cluster. Depending on your environment,
                  you may need to adjust firewall rules or configure private endpoints in the &lsquo;Networking&rsquo;
                  tab of your database settings, or modify your own network&apos;s firewall settings, to successfully
                  connect.
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
                  Let&apos;s populate your sampleCollection with data. We&apos;ll add 10 documents representing books,
                  each with a title, author, and number of pages, to your sampleCollection in the quickstartDB database.
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 200 }}
                  onClick={() => useTerminal.getState().sendMessage(loadDataCommand)}
                >
                  Create distributed table
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
                  Once you’ve inserted data into your sampleCollection, you can retrieve it using queries. MongoDB
                  queries can be as simple or as complex as you need them to be, allowing you to filter, sort, and limit
                  results.
                </Text>
                <DefaultButton
                  style={{ marginTop: 16, width: 110 }}
                  onClick={() => useTerminal.getState().sendMessage(queriesCommand)}
                >
                  Load data
                </DefaultButton>
                <Stack horizontal style={{ marginTop: 16 }}>
                  <TextField
                    id="queriesCommand"
                    multiline
                    rows={5}
                    readOnly
                    defaultValue={queriesCommandForDisplay}
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
                    onClick={() => onCopyBtnClicked("#queriesCommand")}
                  />
                </Stack>
              </Stack>
            </PivotItem>
            <PivotItem
              headerText="Integrations"
              onRenderItemLink={(props, defaultRenderer) =>
                customPivotHeaderRenderer(props, defaultRenderer, currentStep, 4)
              }
              itemKey={GuideSteps[4]}
              onClick={() => setCurrentStep(4)}
            >
              <Stack>
                <Text>
                  Cosmos DB for MongoDB vCore seamlessly integrates with Azure services. These integrations enable
                  Cosmos DB for MongoDB and its partner products to directly interoperate, ensuring a smooth and unified
                  experience, that just works.
                </Text>
                <Stack horizontal>
                  <Stack style={{ marginTop: 20, marginRight: 20 }}>
                    <Text>
                      <b>First party integrations</b>
                      <br />
                      <br />
                      <b>Azure Monitor</b>
                      <br />
                      Azure monitor provides comprehensive monitoring and diagnostics for Cosmos DB for Mongo DB. Learn
                      more
                      <br />
                      <br />
                      <b>Azure Networking</b>
                      <br />
                      Azure Networking seamlessly integrates with Azure Cosmos DB for Mongo DB for fast and secure data
                      access. Learn more
                      <br />
                      <br />
                      <b>PowerShell/CLI/ARM</b>
                      <br />
                      PowerShell/CLI/ARM seamlessly integrates with Azure Cosmos DB for Mongo DB for efficient
                      management and automation. Learn more
                    </Text>
                  </Stack>
                  <Stack style={{ marginTop: 20, marginLeft: 20 }}>
                    <Text>
                      <b>Application platforms integrations</b>
                      <br />
                      <br />
                      <b>Vercel</b>
                      <br />
                      Vercel is a cloud platform for hosting static front ends and serverless functions, with instant
                      deployments, automated scaling, and Next.js integration. Learn more
                    </Text>
                  </Stack>
                </Stack>
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
