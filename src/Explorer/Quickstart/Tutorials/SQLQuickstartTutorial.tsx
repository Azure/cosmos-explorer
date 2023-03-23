import { DirectionalHint, Link, Stack, TeachingBubble, Text } from "@fluentui/react";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import React from "react";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceCancel, traceSuccess } from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";

export const SQLQuickstartTutorial: React.FC = (): JSX.Element => {
  const { step, isSampleDBExpanded, isDocumentsTabOpened, sampleCollection, setStep } = useTeachingBubble();

  const onDimissTeachingBubble = (): void => {
    setStep(0);
    traceCancel(Action.CancelUITour, { step });
  };

  if (userContext.apiType !== "SQL") {
    return <></>;
  }
  let totalSteps = 8;
  if (userContext.isTryCosmosDBSubscription) {
    totalSteps = 9;
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
          Start viewing and working with your data by opening Items under Data
        </TeachingBubble>
      ) : (
        <></>
      );
    case 2:
      return isDocumentsTabOpened ? (
        <TeachingBubble
          headline="View item"
          target={".queryButton"}
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
          View item here using the items window. Additionally you can also filter items to be reviewed with the filter
          function
        </TeachingBubble>
      ) : (
        <></>
      );
    case 3:
      return (
        <TeachingBubble
          headline="Add new item"
          target={"#uploadItemBtn"}
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
          Add new item by copy / pasting JSON; or uploading a JSON
        </TeachingBubble>
      );
    case 4:
      return (
        <TeachingBubble
          headline="Run a query"
          target={"#newQueryBtn"}
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
          Query your data using either the filter function or new query.
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
          Change throughput provisioned to your container according to your needs
        </TeachingBubble>
      );
    case 6:
      return (
        <TeachingBubble
          headline="Create notebook"
          target={"#newNotebookBtn"}
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
          Visualize your data, store queries in an interactive document
        </TeachingBubble>
      );
    case 7:
      return (
        <TeachingBubble
          headline="Launch full screen"
          target={"#openFullScreenBtn"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => (userContext.isTryCosmosDBSubscription ? setStep(8) : setStep(9)),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(6),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 7 of " + totalSteps}
        >
          This will open a new tab in your browser to use Cosmos DB Explorer. Using the provided URLs you can share
          read-write or read-only access with other people.
        </TeachingBubble>
      );
    case 8:
      return (
        <TeachingBubble
          headline="Boost your experience"
          target={"#freeTierTeachingBubble"}
          hasCloseButton
          primaryButtonProps={{
            text: "Next",
            onClick: () => setStep(9),
          }}
          secondaryButtonProps={{
            text: "Previous",
            onClick: () => setStep(7),
          }}
          calloutProps={{ directionalHint: DirectionalHint.leftCenter }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 8 of " + totalSteps}
        >
          Unlock everything Azure Cosmos DB has to offer When you&apos;re ready, upgrade to production.
        </TeachingBubble>
      );
    case 9:
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
            onClick: () => (userContext.isTryCosmosDBSubscription ? setStep(8) : setStep(7)),
          }}
          onDismiss={() => onDimissTeachingBubble()}
          footerContent={"Step 8 of " + totalSteps}
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
