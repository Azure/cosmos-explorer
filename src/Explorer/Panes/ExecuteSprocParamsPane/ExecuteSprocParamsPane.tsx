import { useBoolean } from "@fluentui/react-hooks";
import { IDropdownOption, IImageProps, Image, Stack, Text } from "@fluentui/react";
import React, { FunctionComponent, useState } from "react";
import AddPropertyIcon from "../../../../images/Add-property.svg";
import StoredProcedure from "../../Tree/StoredProcedure";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";
import { InputParameter } from "./InputParameter";

interface ExecuteSprocParamsPaneProps {
  expandConsole: () => void;
  storedProcedure: StoredProcedure;
  closePanel: () => void;
}

const imageProps: IImageProps = {
  width: 20,
  height: 30,
};

interface UnwrappedExecuteSprocParam {
  key: string;
  text: string;
}

export const ExecuteSprocParamsPane: FunctionComponent<ExecuteSprocParamsPaneProps> = ({
  expandConsole,
  storedProcedure,
  closePanel,
}: ExecuteSprocParamsPaneProps): JSX.Element => {
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [paramKeyValues, setParamKeyValues] = useState<UnwrappedExecuteSprocParam[]>([{ key: "string", text: "" }]);
  const [partitionValue, setPartitionValue] = useState<string>(); // Defaulting to undefined here is important. It is not the same partition key as ""
  const [selectedKey, setSelectedKey] = React.useState<IDropdownOption>({ key: "string", text: "" });
  const [formError, setFormError] = useState<string>("");
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>("");

  const onPartitionKeyChange = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
    setSelectedKey(item);
  };

  const genericPaneProps: GenericRightPaneProps = {
    expandConsole,
    formError: formError,
    formErrorDetail: formErrorsDetails,
    id: "executesprocparamspane",
    isExecuting: isLoading,
    title: "Input parameters",
    submitButtonText: "Execute",
    onClose: () => closePanel(),
    onSubmit: () => submit(),
  };

  const validateUnwrappedParams = (): boolean => {
    const unwrappedParams: UnwrappedExecuteSprocParam[] = paramKeyValues;
    for (let i = 0; i < unwrappedParams.length; i++) {
      const { key: paramType, text: paramValue } = unwrappedParams[i];
      if (paramType === "custom" && (paramValue === "" || paramValue === undefined)) {
        return false;
      }
    }
    return true;
  };

  const setInvalidParamError = (invalidParam: string): void => {
    setFormError(`Invalid param specified: ${invalidParam}`);
    setFormErrorsDetails(`Invalid param specified: ${invalidParam} is not a valid literal value`);
  };

  const submit = (): void => {
    const wrappedSprocParams: UnwrappedExecuteSprocParam[] = paramKeyValues;
    const { key: partitionKey } = selectedKey;
    if (partitionKey === "custom" && (partitionValue === "" || partitionValue === undefined)) {
      setInvalidParamError(partitionValue);
      return;
    }
    if (!validateUnwrappedParams()) {
      setInvalidParamError("");
      return;
    }
    setLoadingTrue();
    const sprocParams =
      wrappedSprocParams &&
      wrappedSprocParams.map((sprocParam) => {
        if (sprocParam.key === "custom") {
          return JSON.parse(sprocParam.text);
        }
        return sprocParam.text;
      });
    storedProcedure.execute(sprocParams, partitionKey === "custom" ? JSON.parse(partitionValue) : partitionValue);
    setLoadingFalse();
    closePanel();
  };

  const deleteParamAtIndex = (indexToRemove: number): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue.splice(indexToRemove, 1);
    setParamKeyValues(cloneParamKeyValue);
  };

  const addNewParamAtIndex = (indexToAdd: number): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue.splice(indexToAdd, 0, { key: "string", text: "" });
    setParamKeyValues(cloneParamKeyValue);
  };

  const paramValueChange = (value: string, indexOfInput: number): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue[indexOfInput].text = value;
    setParamKeyValues(cloneParamKeyValue);
  };

  const paramKeyChange = (
    _event: React.FormEvent<HTMLDivElement>,
    selectedParam: IDropdownOption,
    indexOfParam: number
  ): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue[indexOfParam].key = selectedParam.key.toString();
    setParamKeyValues(cloneParamKeyValue);
  };

  const addNewParamAtLastIndex = (): void => {
    const cloneParamKeyValue = [...paramKeyValues];
    cloneParamKeyValue.splice(cloneParamKeyValue.length, 0, { key: "string", text: "" });
    setParamKeyValues(cloneParamKeyValue);
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="panelFormWrapper">
        <div className="panelMainContent">
          <InputParameter
            dropdownLabel="Key"
            inputParameterTitle="Partition key value"
            inputLabel="Value"
            isAddRemoveVisible={false}
            onParamValueChange={(_event, newInput?: string) => {
              setPartitionValue(newInput);
            }}
            onParamKeyChange={onPartitionKeyChange}
            paramValue={partitionValue}
            selectedKey={selectedKey.key}
          />
          {paramKeyValues.map((paramKeyValue, index) => (
            <InputParameter
              key={paramKeyValue && paramKeyValue.text + index}
              dropdownLabel={!index && "Key"}
              inputParameterTitle={!index && "Enter input parameters (if any)"}
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
              paramValue={paramKeyValue && paramKeyValue.text}
              selectedKey={paramKeyValue && paramKeyValue.key}
            />
          ))}
          <Stack horizontal onClick={addNewParamAtLastIndex}>
            <Image {...imageProps} src={AddPropertyIcon} alt="Add param" />
            <Text className="addNewParamStyle">Add New Param</Text>
          </Stack>
        </div>
      </div>
    </GenericRightPaneComponent>
  );
};
