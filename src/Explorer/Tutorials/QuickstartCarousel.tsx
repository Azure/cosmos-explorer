import { DefaultButton, IconButton, Image, Modal, PrimaryButton, Stack, Text } from "@fluentui/react";
import React, { useState } from "react";
import Youtube from "react-youtube";
import Placeholder from "../../../images/Placeholder.svg";

interface QuickstartCarouselProps {
  isOpen: boolean;
}

export const QuickstartCarousel: React.FC<QuickstartCarouselProps> = ({
  isOpen,
}: QuickstartCarouselProps): JSX.Element => {
  const [page, setPage] = useState<number>(1);
  return (
    <Modal styles={{ main: { width: 640 } }} isOpen={isOpen && page < 4}>
      <Stack>
        <Stack horizontal horizontalAlign="space-between" style={{ padding: 16 }}>
          <Text variant="xLarge">{getHeaderText(page)}</Text>
          <IconButton iconProps={{ iconName: "Cancel" }} onClick={() => setPage(4)} />
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
            onClick={() => setPage(page + 1)}
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
      return <Youtube videoId="Jvgh64rvdXU" />;
    case 2:
      return <Image style={{ width: 640 }} src={Placeholder} />;
    case 3:
      return <Image style={{ width: 640 }} src={Placeholder} />;
    default:
      return <></>;
  }
};

const getDescriptionText = (page: number): string => {
  switch (page) {
    case 1:
      return "Azure Cosmos DB is a fully managed NoSQL database service for modern app development. ";
    case 2:
      return "Launch the quickstart for a tutotrial to learn how to create a database, add sample data, connect to a sample app and more.";
    case 3:
      return "Already have an existing app? Connect your database to an app, or tooling of your choice from Data Explorer.";
    default:
      return "";
  }
};
