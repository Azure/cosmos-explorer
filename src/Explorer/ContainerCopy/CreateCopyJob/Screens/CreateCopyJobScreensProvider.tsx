import React from "react";
import CopyJobContextProvider from "../../Context/CopyJobContext";
import CreateCopyJobScreens from "./CreateCopyJobScreens";

const CreateCopyJobScreensProvider = () => {
  return (
    <CopyJobContextProvider>
      <CreateCopyJobScreens />
    </CopyJobContextProvider>
  );
};

export default CreateCopyJobScreensProvider;
