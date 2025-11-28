import Explorer from "Explorer/Explorer";
import React from "react";
import CopyJobContextProvider from "../../Context/CopyJobContext";
import CreateCopyJobScreens from "./CreateCopyJobScreens";

const CreateCopyJobScreensProvider = ({ explorer }: { explorer: Explorer }) => {
  return (
    <CopyJobContextProvider explorer={explorer}>
      <CreateCopyJobScreens />
    </CopyJobContextProvider>
  );
};

export default CreateCopyJobScreensProvider;
