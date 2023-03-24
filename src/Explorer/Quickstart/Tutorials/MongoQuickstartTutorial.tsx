import { DirectionalHint, Link, Stack, TeachingBubble, Text } from "@fluentui/react";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import React from "react";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceCancel, traceSuccess } from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";

export const MongoQuickstartTutorial: React.FC = (): JSX.Element => {
  const { step, isSampleDBExpanded, isDocumentsTabOpened, sampleCollection, setStep } = useTeachingBubble();

  const onDimissTeachingBubble = (): void => {
    setStep(0);
    traceCancel(Action.CancelUITour, { step });
  };

  if (userContext.apiType !== "Mongo") {
    return <></>;
  }

  let totalSteps = 9;
  if (userContext.isTryCosmosDBSubscription) {
    totalSteps = 10;
  }

  switch (step) {
    case 1:
      return isSampleDBExpanded ? (
        <TeachingBubble
          headline="View sample data"
          target={"#sampleItems"}
          hasCloseButton
          primaryButtonProps={{
            text: "Open Items",
            onClick: () => {
              sampleCollection.openTab();
              setStep(2);
            },
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 1 of " + totalSteps}
        >
          Start viewing and working with your data by opening Documents under Data
        </TeachingBubble>
      ) : (
        <></>
      );
    case 2:
      return isDocumentsTabOpened ? (
        <TeachingBubble
          headline="View Documents"
          target={".documentsGridHeaderContainer"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(3),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(1),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 2 of " + totalSteps}
        >
          View documents here using the documents window. You can also use your favorite MongoDB tools and drivers to do
          so.
        </TeachingBubble>
      ) : (
        <></>
      );
    case 3:
      return (
        <TeachingBubble
          headline="Add new document"
          target={"#mongoNewDocumentBtn"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(4),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(2),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 3 of " + totalSteps}
        >
          Add new document by copy / pasting JSON or uploading a JSON. You can also use your favorite MongoDB tools and
          drivers to do so.
        </TeachingBubble>
      );
    case 4:
      return (
        <TeachingBubble
          headline="Run a query"
          target={".querydropdown"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(5),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(3),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 4 of " + totalSteps}
        >
          Query your data using the filter function. Azure Cosmos DB for MongoDB provides comprehensive support for
          MongoDB query language constructs. You can also use your favorite MongoDB tools and drivers to do so.
        </TeachingBubble>
      );
    case 5:
      return (
        <TeachingBubble
          headline="Scale throughput"
          target={"#sampleScaleSettings"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(6),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(4),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 5 of " + totalSteps}
        >
          Change throughput provisioned to your collection according to your needs
        </TeachingBubble>
      );
    case 6:
      return (
        <TeachingBubble
          headline="Indexing Policy"
          target={"#sampleSettings"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(7),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(5),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 6 of " + totalSteps}
        >
          Use the indexing policy editor to create and edit your indexes.
        </TeachingBubble>
      );
    case 7:
      return (
        <TeachingBubble
          headline="Create notebook"
          target={"#newNotebookBtn"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(8),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(6),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 7 of " + totalSteps}
        >
          Visualize your data, store queries in an interactive document
        </TeachingBubble>
      );
    case 8:
      return (
        <TeachingBubble
          headline="Launch full screen"
          target={"#openFullScreenBtn"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => (userContext.isTryCosmosDBSubscription ? setStep(9) : setStep(10)),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(7),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 8 of " + totalSteps}
        >
          This will open a new tab in your browser to use Cosmos DB Explorer. Using the provided URLs you can share
          read-write or read-only access with other people.
        </TeachingBubble>
      );
    case 9:
      return (
        <TeachingBubble
          headline="Boost your experience"
          target={"#freeTierTeachingBubble"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(10),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(8),
          }}
          calloutProps={{ directionalHint: DirectionalHint.leftCenter }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 9 of " + totalSteps}
        >
          Unlock everything Azure Cosmos DB has to offer When you&apos;re ready, upgrade to production.
        </TeachingBubble>
      );
    case 10:
      return (
        <TeachingBubble
          headline="Congratulations!"
          target={"#newNotebookBtn"}
          hasCloseButton
          primaryButtonProps={{
            text: "Launch connect",
            onClick: () => {
              traceSuccess(Action.CompleteUITour);
              useTabs.getState().openAndActivateReactTab(ReactTabKind.Connect);
            },
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => (userContext.isTryCosmosDBSubscription ? setStep(9) : setStep(8)),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step " + totalSteps + " of " + totalSteps}
        >
          <Stack>
            <Text style={{ color: "white" }}>
              You have finished the tour in data explorer. For next steps, you may want to launch connect and start
              connecting with your current app.
            </Text>
            <Link style={{ color: "white", fontWeight: 600 }} target="_blank" href="https://aka.ms/cosmosdbsurvey">
              Share your feedback
            </Link>
          </Stack>
        </TeachingBubble>
      );
    default:
      return <></>;
  }
};
