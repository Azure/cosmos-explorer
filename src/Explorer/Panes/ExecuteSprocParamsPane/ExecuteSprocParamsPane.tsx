import { IDropdownOption, IImageProps, Image, Stack, Text } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { FunctionComponent, useRef, useState } from "react";
import AddPropertyIcon from "../../../../images/Add-property.svg";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { Keys } from "Localization/Keys.generated";
import { t } from "Localization/t";
import { logConsoleError } from "../../../Utils/NotificationConsoleUtils";
import StoredProcedure from "../../Tree/StoredProcedure";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";
import { InputParameter } from "./InputParameter";

interface ExecuteSprocParamsPaneProps {
  storedProcedure: StoredProcedure;
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
  storedProcedure,
}: ExecuteSprocParamsPaneProps): JSX.Element => {
  const paramKeyValuesRef = useRef<UnwrappedExecuteSprocParam[]>([{ key: "string", text: "" }]);
  const partitionValueRef = useRef<string>();
  const partitionKeyRef = useRef<string>("string");
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [numberOfParams, setNumberOfParams] = useState<number>(1);
  const [isLoading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false);
  const [formError, setFormError] = useState<string>("");

  const validateUnwrappedParams = (): boolean => {
    const unwrappedParams: UnwrappedExecuteSprocParam[] = paramKeyValuesRef.current;
    for (let i = 0; i < unwrappedParams.length; i++) {
      const { key: paramType, text: paramValue } = unwrappedParams[i];
      if (paramType === "custom" && (paramValue === "" || paramValue === undefined)) {
        return false;
      }
    }
    return true;
  };

  const setInvalidParamError = (invalidParam: string): void => {
    setFormError(t(Keys.panes.executeStoredProcedure.invalidParamError, { invalidParam }));
    logConsoleError(t(Keys.panes.executeStoredProcedure.invalidParamConsoleError, { invalidParam }));
  };

  const submit = (): void => {
    const wrappedSprocParams: UnwrappedExecuteSprocParam[] = paramKeyValuesRef.current;
    const partitionValue: string = partitionValueRef.current;
    const partitionKey: string = partitionKeyRef.current;
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
    closeSidePanel();
  };

  const deleteParamAtIndex = (indexToRemove: number): void => {
    paramKeyValuesRef.current.splice(indexToRemove, 1);
    setNumberOfParams(numberOfParams - 1);
  };

  const addNewParamAtIndex = (indexToAdd: number): void => {
    paramKeyValuesRef.current.splice(indexToAdd, 0, { key: "string", text: "" });
    setNumberOfParams(numberOfParams + 1);
  };

  const addNewParamAtLastIndex = (): void => {
    paramKeyValuesRef.current.push({
      key: "string",
      text: "",
    });
    setNumberOfParams(numberOfParams + 1);
  };

  const props: RightPaneFormProps = {
    formError: formError,
    isExecuting: isLoading,
    submitButtonText: t(Keys.common.execute),
    onSubmit: () => submit(),
  };

  const getInputParameterComponent = (): JSX.Element[] => {
    const inputParameters: JSX.Element[] = [];
    for (let i = 0; i < numberOfParams; i++) {
      const paramKeyValue = paramKeyValuesRef.current[i];
      inputParameters.push(
        <InputParameter
          key={paramKeyValue.text + i}
          dropdownLabel={i === 0 ? t(Keys.panes.executeStoredProcedure.key) : ""}
          inputParameterTitle={i === 0 ? t(Keys.panes.executeStoredProcedure.enterInputParameters) : ""}
          inputLabel={i === 0 ? t(Keys.panes.executeStoredProcedure.param) : ""}
          isAddRemoveVisible={true}
          onDeleteParamKeyPress={() => deleteParamAtIndex(i)}
          onAddNewParamKeyPress={() => addNewParamAtIndex(i + 1)}
          onParamValueChange={(_event, newInput?: string) => (paramKeyValuesRef.current[i].text = newInput)}
          onParamKeyChange={(_event, selectedParam: IDropdownOption) =>
            (paramKeyValuesRef.current[i].key = selectedParam.key.toString())
          }
          paramValue={paramKeyValue.text}
          selectedKey={paramKeyValue.key}
        />,
      );
    }

    return inputParameters;
  };

  return (
    <RightPaneForm {...props}>
      <div className="panelMainContent">
        <InputParameter
          dropdownLabel={t(Keys.panes.executeStoredProcedure.key)}
          inputParameterTitle={t(Keys.panes.executeStoredProcedure.partitionKeyValue)}
          inputLabel={t(Keys.panes.executeStoredProcedure.value)}
          isAddRemoveVisible={false}
          onParamValueChange={(_event, newInput?: string) => (partitionValueRef.current = newInput)}
          onParamKeyChange={(_event: React.FormEvent<HTMLDivElement>, item: IDropdownOption) =>
            (partitionKeyRef.current = item.key.toString())
          }
          paramValue={partitionValueRef.current}
          selectedKey={partitionKeyRef.current}
        />
        {getInputParameterComponent()}
        <Stack horizontal onClick={() => addNewParamAtLastIndex()} tabIndex={0}>
          <Image {...imageProps} src={AddPropertyIcon} alt={t(Keys.panes.executeStoredProcedure.addParam)} />
          <Text className="addNewParamStyle">{t(Keys.panes.executeStoredProcedure.addNewParam)}</Text>
        </Stack>
      </div>
    </RightPaneForm>
  );
};
