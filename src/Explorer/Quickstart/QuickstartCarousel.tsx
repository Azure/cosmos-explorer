import { DefaultButton, IconButton, Image, Modal, PrimaryButton, Stack, Text } from "@fluentui/react";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceSuccess } from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { useCarousel } from "hooks/useCarousel";
import React, { useState } from "react";
import Image1 from "../../../images/CarouselImage1.svg";
import Image2 from "../../../images/CarouselImage2.svg";

interface QuickstartCarouselProps {
  isOpen: boolean;
}

export const QuickstartCarousel: React.FC<QuickstartCarouselProps> = ({
  isOpen,
}: QuickstartCarouselProps): JSX.Element => {
  const [page, setPage] = useState<number>(1);
  return (
    <Modal
      styles={{ main: { width: 640 } }}
      isOpen={true && page < 4}
      onDismissed={() => userContext.apiType === "SQL" && useCarousel.getState().setShowCoachMark(true)}
    >
      <Stack>
        <Stack horizontal horizontalAlign="space-between" style={{ padding: 16 }}>
          <Text variant="xLarge">{getHeaderText(page)}</Text>
          <IconButton iconProps={{ iconName: "Cancel" }} onClick={() => setPage(4)} ariaLabel="Close" />
        </Stack>
        {getContent(page)}
        <Text variant="medium" style={{ padding: "0 16px" }}>
          {getDescriptionText(page)}
        </Text>
        <Stack horizontal horizontalAlign="end">
          {page !== 1 && (
            <DefaultButton text="Previous" style={{ margin: "16px 8px 16px 0" }} onClick={() => setPage(page - 1)} />
          )}
          <PrimaryButton
            style={{ margin: "16px 16px 16px 0" }}
            text={page === 3 ? "Finish" : "Next"}
            onClick={() => {
              if (
                userContext.apiType === "Cassandra" ||
                userContext.apiType === "Tables" ||
                userContext.apiType === "Gremlin"
              ) {
                setPage(page + 2);
              } else {
                if (page === 3 && userContext.apiType === "SQL") {
                  useCarousel.getState().setShowCoachMark(true);
                }
                setPage(page + 1);
              }

              if (page === 3) {
                traceSuccess(Action.CompleteCarousel);
              }
            }}
          />
        </Stack>
      </Stack>
    </Modal>
  );
};

const getHeaderText = (page: number): string => {
  switch (page) {
    case 1:
      return "Welcome! What is Cosmos DB?";
    case 2:
      return "Get Started with Sample Data";
    case 3:
      return "Connect to your database";
    default:
      return "";
  }
};

const getContent = (page: number): JSX.Element => {
  switch (page) {
    case 1:
      return (
        <video controls width="640" height="360" controlsList="nofullscreen nodownload ">
          <source src="src/Explorer/Quickstart/Videos/Cosmos-db-turorial.mp4" type="video/mp4"></source>
          Your browser does not support the video tag.
        </video>
      );
    case 2:
      return <Image style={{ width: 640 }} src={Image1} />;
    case 3:
      return <Image style={{ width: 640 }} src={Image2} />;
    default:
      return <></>;
  }
};

const getDescriptionText = (page: number): string => {
  switch (page) {
    case 1:
      return "Azure Cosmos DB is a fully managed NoSQL database service for modern app development. ";
    case 2:
      return "Launch the quickstart for a tutorial to learn how to create a database, add sample data, connect to a sample app and more.";
    case 3:
      return "Already have an existing app? Connect your database to an app, or tooling of your choice from Data Explorer.";
    default:
      return "";
  }
};
