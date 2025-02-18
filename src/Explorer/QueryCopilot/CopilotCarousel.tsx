import {
  DefaultButton,
  ISeparatorStyles,
  IconButton,
  Image,
  Link,
  Modal,
  PrimaryButton,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@fluentui/react";
import { QueryCopilotSampleDatabaseId } from "Common/Constants";
import { handleError } from "Common/ErrorHandlingUtils";
import { StyleConstants } from "Common/StyleConstants";
import { createCollection } from "Common/dataAccess/createCollection";
import * as DataModels from "Contracts/DataModels";
import { ContainerSampleGenerator } from "Explorer/DataSamples/ContainerSampleGenerator";
import Explorer from "Explorer/Explorer";
import { AllPropertiesIndexed } from "Explorer/Panes/AddCollectionPanel/AddCollectionPanel";
import { PromptCard } from "Explorer/QueryCopilot/PromptCard";
import { useDatabases } from "Explorer/useDatabases";
import { useCarousel } from "hooks/useCarousel";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import React, { useState } from "react";
import YoutubePlaceholder from "../../../images/YoutubePlaceholder.svg";

interface QueryCopilotCarouselProps {
  isOpen: boolean;
  explorer: Explorer;
}

const separatorStyles: Partial<ISeparatorStyles> = {
  root: {
    selectors: {
      "::before": {
        background: StyleConstants.BaseMedium,
      },
    },
    padding: "16px 0",
    height: 1,
  },
};

export const QueryCopilotCarousel: React.FC<QueryCopilotCarouselProps> = ({
  isOpen,
  explorer,
}: QueryCopilotCarouselProps): JSX.Element => {
  const [page, setPage] = useState<number>(1);
  const [isCreatingDatabase, setIsCreatingDatabase] = useState<boolean>(false);
  const [spinnerText, setSpinnerText] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<number>(1);

  const getHeaderText = (): string => {
    switch (page) {
      case 1:
        return "What exactly is copilot?";
      case 2:
        return "Setting up your Sample database";
      case 3:
        return "Sample prompts to help you";
      default:
        return "";
    }
  };

  const getQueryCopilotInitialInput = (): string => {
    switch (selectedPrompt) {
      case 1:
        return "Write a query to return all records in this table";
      case 2:
        return "Write a query to return all records in this table created in the last thirty days";
      case 3:
        return 'Write a query to return all records in this table created in the last thirty days which also have the record owner as "Contoso"';
      default:
        return "";
    }
  };

  const createSampleDatabase = async (): Promise<void> => {
    const database = useDatabases.getState().findDatabaseWithId(QueryCopilotSampleDatabaseId);
    if (database) {
      return;
    }

    try {
      setIsCreatingDatabase(true);
      setSpinnerText("Setting up your database...");
      const params: DataModels.CreateCollectionParams = {
        createNewDatabase: true,
        collectionId: "SampleContainer",
        databaseId: QueryCopilotSampleDatabaseId,
        databaseLevelThroughput: true,
        autoPilotMaxThroughput: 1000,
        offerThroughput: undefined,
        indexingPolicy: AllPropertiesIndexed,
        partitionKey: {
          paths: ["/categoryId"],
          kind: "Hash",
          version: 2,
        },
      };
      await createCollection(params);
      await explorer.refreshAllDatabases();
      const database = useDatabases.getState().findDatabaseWithId(QueryCopilotSampleDatabaseId);
      await database.loadCollections();
      const collection = database.findCollectionWithId("SampleContainer");

      setSpinnerText("Adding sample data set...");
      const sampleGenerator = await ContainerSampleGenerator.createSampleGeneratorAsync(explorer, true);
      await sampleGenerator.populateContainerAsync(collection);
      await database.expandDatabase();
      collection.expandCollection();
      useDatabases.getState().updateDatabase(database);
    } catch (error) {
      //TODO: show error in UI
      handleError(error, "QueryCopilotCreateSampleDB");
      throw error;
    } finally {
      setIsCreatingDatabase(false);
      setSpinnerText("");
    }
  };

  const getContent = (): JSX.Element => {
    switch (page) {
      case 1:
        return (
          <Stack style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13 }}>
              A couple of lines about copilot and the background about it. The idea is to have some text to give context
              to the user.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>How do you use copilot</Text>
            <Text style={{ fontSize: 13, marginTop: 8 }}>
              To generate queries , just describe the query you want and copilot will generate the query for you.Watch
              this video to learn more about how to use copilot.
            </Text>
            <Image src={YoutubePlaceholder} style={{ margin: "16px auto" }} />
            <Text style={{ fontSize: 14, fontWeight: 600 }}>What is copilot good at</Text>
            <Text style={{ fontSize: 13, marginTop: 8 }}>
              A couple of lines about what copilot can do and its capablites with a link to{" "}
              <Link href="" target="_blank">
                documentation
              </Link>{" "}
              if possible.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>What are its limitations</Text>
            <Text style={{ fontSize: 13, marginTop: 8 }}>
              A couple of lines about what copilot cant do and its limitations.{" "}
              <Link href="" target="_blank">
                Link to documentation
              </Link>
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>Disclaimer</Text>
            <Text style={{ fontSize: 13, marginTop: 8 }}>
              AI-generated content can have mistakes. Make sure it&apos;s accurate and appropriate before using it.{" "}
              <Link href="" target="_blank">
                Read preview terms
              </Link>
            </Text>
          </Stack>
        );
      case 2:
        return (
          <Stack style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13 }}>
              Before you get started, we need to configure your sample database for you. Here is a summary of the
              database being created for your reference. Configuration values can be updated using the settings icon in
              the query builder.
            </Text>
            <Text style={{ fontSize: 13, fontWeight: 600, marginTop: 24 }}>Database Id</Text>
            <Text style={{ fontSize: 13 }}>CopilotSampleDB</Text>
            <Text style={{ fontSize: 13, fontWeight: 600, marginTop: 16 }}>Database throughput (autoscale)</Text>
            <Text style={{ fontSize: 13 }}>Autoscale</Text>
            <Text style={{ fontSize: 13, fontWeight: 600, marginTop: 16 }}>Database Max RU/s</Text>
            <Text>1000</Text>
            <Text style={{ fontSize: 10, marginTop: 8 }}>
              Your database throughput will automatically scale from{" "}
              <strong>100 RU/s (10% of max RU/s) - 1000 RU/s</strong> based on usage.
            </Text>
            <Text style={{ fontSize: 10, marginTop: 8 }}>
              Estimated monthly cost (USD): <strong>$8.76 - $87.60</strong> (1 region, 100 - 1000 RU/s, $0.00012/RU)
            </Text>
            <Text style={{ fontSize: 13, fontWeight: 600, marginTop: 16 }}>Container Id</Text>
            <Text style={{ fontSize: 13 }}>SampleContainer</Text>
            <Text style={{ fontSize: 13, fontWeight: 600, marginTop: 16 }}>Partition key</Text>
            <Text style={{ fontSize: 13 }}>categoryId</Text>
          </Stack>
        );
      case 3:
        return (
          <Stack>
            <Text>To help you get started, here are some sample prompts to get you started</Text>
            <Stack tokens={{ childrenGap: 12 }} style={{ marginTop: 16 }}>
              <PromptCard
                header="Write a query to return all records in this table"
                description="This is a basic query which returns all records in the table "
                onSelect={() => setSelectedPrompt(1)}
                isSelected={selectedPrompt === 1}
              />
              <PromptCard
                header="Write a query to return all records in this table created in the last thirty days"
                description="This builds on the previous query which returns all records in the table which were inserted in the last thirty days. You can also modify this query to return records based upon creation date"
                onSelect={() => setSelectedPrompt(2)}
                isSelected={selectedPrompt === 2}
              />
              <PromptCard
                header='Write a query to return all records in this table created in the last thirty days which also have the record owner as "Contoso"'
                description='This builds on the previous query which returns all records in the table which were inserted in the last thirty days but which has the record owner as "contoso"'
                onSelect={() => setSelectedPrompt(3)}
                isSelected={selectedPrompt === 3}
              />
            </Stack>
            <Text style={{ fontSize: 13, marginTop: 32 }}>
              Interested in learning more about how to write effective prompts. Please read this article for more
              information.
            </Text>
            <Text style={{ fontSize: 13, marginTop: 16 }}>
              You can also access these prompts by selecting the Samples prompts button in the query builder page.
            </Text>
            <Text style={{ fontSize: 13, marginTop: 16 }}>
              Don&apos;t like any of the prompts? Just click Get Started and write your own prompt.
            </Text>
          </Stack>
        );
      default:
        return <></>;
    }
  };

  return (
    <Modal styles={{ main: { width: 880 } }} isOpen={isOpen && page < 4}>
      <Stack style={{ padding: 16 }}>
        <Stack horizontal horizontalAlign="space-between">
          <Text variant="xLarge">{getHeaderText()}</Text>
          <IconButton
            iconProps={{ iconName: "Cancel" }}
            onClick={() => useCarousel.getState().setShowCopilotCarousel(false)}
          />
        </Stack>
        {getContent()}
        <Separator styles={separatorStyles} />
        <Stack horizontal horizontalAlign="start" verticalAlign="center">
          {page !== 1 && (
            <DefaultButton
              text="Previous"
              style={{ marginRight: 8 }}
              onClick={() => setPage(page - 1)}
              disabled={isCreatingDatabase}
            />
          )}
          <PrimaryButton
            text={page === 3 ? "Get started" : "Next"}
            onClick={async () => {
              if (page === 3) {
                useCarousel.getState().setShowCopilotCarousel(false);
                useTabs.getState().setQueryCopilotTabInitialInput(getQueryCopilotInitialInput());
                useTabs.getState().openAndActivateReactTab(ReactTabKind.QueryCopilot);
                return;
              }

              if (page === 2) {
                await createSampleDatabase();
              }

              setPage(page + 1);
            }}
            disabled={isCreatingDatabase}
          />
          {isCreatingDatabase && <Spinner style={{ marginLeft: 8 }} />}
          {isCreatingDatabase && <Text style={{ marginLeft: 8, color: "#0078D4" }}>{spinnerText}</Text>}
        </Stack>
      </Stack>
    </Modal>
  );
};
