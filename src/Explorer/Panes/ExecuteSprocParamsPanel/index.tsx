import { useBoolean } from "@uifabric/react-hooks";
import { IImageProps, Image, Stack, Text } from "office-ui-fabric-react/lib";
import React, { FunctionComponent } from "react";
import Add_property from "../../../../images/Add-property.svg";
import Explorer from "../../Explorer";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
import { InputParameter } from "./InputParameter";

interface ExecuteSprocParamsPaneProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
}

const imageProps: IImageProps = {
  width: 20,
  height: 30,
};

export const ExecuteSprocParamsPanel: FunctionComponent<ExecuteSprocParamsPaneProps> = ({
  explorer,
  closePanel,
  openNotificationConsole,
}: ExecuteSprocParamsPaneProps): JSX.Element => {
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);

  const genericPaneProps: GenericRightPaneProps = {
    container: explorer,
    formError: "",
    formErrorDetail: "formErrorDetail",
    id: "executesprocparamspane",
    isExecuting: isLoading,
    title: "Input parameters",
    submitButtonText: "Execute",
    onClose: () => closePanel(),
    onSubmit: () => submit(),
  };

  const submit = () => {
    setLoadingTrue();
    setTimeout(() => {
      setLoadingFalse();
    }, 2000);
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelContentContainer">
        <div className="panelMainContent">
          <InputParameter
            dropdownLabel="Key"
            InputParameterTitle="Partition key value"
            inputLabel="Value"
            isAddRemoveVisible={false}
          />
          <InputParameter
            dropdownLabel="Key"
            InputParameterTitle="Enter input parameters (if any)"
            inputLabel="Param"
            isAddRemoveVisible={true}
          />
          <InputParameter isAddRemoveVisible={true} />
          <InputParameter isAddRemoveVisible={true} />
          <Stack horizontal>
            <Image {...imageProps} src={Add_property} alt="Add param" />
            <Text className="add-new-param-style">Add New Param</Text>
          </Stack>
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
