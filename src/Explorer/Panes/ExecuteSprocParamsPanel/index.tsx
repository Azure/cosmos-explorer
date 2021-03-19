import { useBoolean } from "@uifabric/react-hooks";
import { IDropdownOption, IImageProps, Image, Stack, Text } from "office-ui-fabric-react/lib";
import React, { FunctionComponent, useCallback, useState } from "react";
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
  const [paramKeyValues, setParamKeyValues] = useState([{ key: "String", value: "" }]);
  const [peritionValue, setPeritionValue] = useState<string>("");

  const [selectedKey, setSelectedKey] = React.useState<IDropdownOption>({ key: "string", text: "String" });

  const onPeritionKeyChange = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
    setSelectedKey(item);
  };

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

  const submit = (): void => {
    setLoadingTrue();
    setTimeout(() => {
      setLoadingFalse();
    }, 2000);
  };

  const deleteParamAtIndex = (indexToRemove: number): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue.splice(indexToRemove, 1);
    setParamKeyValues(cloneParamKeyValue);
  }

  const addNewParamAtIndex = (indexToAdd: number): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue.splice(indexToAdd, 0, { key: "", value: "" });
    setParamKeyValues(cloneParamKeyValue);
  }

  const paramValueChange = useCallback((value: string, indexOfInput: number): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue[indexOfInput].value = value;
    setParamKeyValues(cloneParamKeyValue);
  }, []
  )

  const paramKeyChange = (_event: React.FormEvent<HTMLDivElement>, selectedParam: IDropdownOption, indexOfParam: number) => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue[indexOfParam].key = selectedParam.key.toString();
    setParamKeyValues(cloneParamKeyValue);
  }

  const addNewParamAtLastIndex = (): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue.splice(cloneParamKeyValue.length, 0, { key: "", value: "" });
    setParamKeyValues(cloneParamKeyValue);
  }

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelContentContainer">
        <div className="panelMainContent">
          <InputParameter
            dropdownLabel="Key"
            InputParameterTitle="Partition key value"
            inputLabel="Value"
            isAddRemoveVisible={false}
            onParamValueChange={(_event, newInput?: string) => {
              setPeritionValue(newInput);
            }}
            onParamKeyChange={onPeritionKeyChange}
            paramValue={peritionValue}
            selectedKey={selectedKey.key}
          />
          {paramKeyValues.map((paramKeyValue, index) => {
            return (
              <InputParameter
                key={paramKeyValue.value}
                dropdownLabel={!index && "Key"}
                InputParameterTitle={!index && "Enter input parameters (if any)"}
                inputLabel={!index && "Param"}
                isAddRemoveVisible={true}
                onDeleteParamKeyPress={() => deleteParamAtIndex(index)}
                onAddNewParamKeyPress={() => addNewParamAtIndex(index + 1)}
                onParamValueChange={(event, newInput?: string) => {
                  paramValueChange(newInput, index);
                }}
                onParamKeyChange={(event: React.FormEvent<HTMLDivElement>, selectedParam: IDropdownOption) => {
                  paramKeyChange(event, selectedParam, index);
                }}
                paramValue={paramKeyValue.value}
                selectedKey={paramKeyValue.key}
              />)
          })
          }
          <Stack horizontal onClick={addNewParamAtLastIndex}>
            <Image {...imageProps} src={Add_property} alt="Add param" />
            <Text className="add-new-param-style">Add New Param</Text>
          </Stack>
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
