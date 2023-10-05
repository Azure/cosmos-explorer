import { Checkbox, Link, PrimaryButton, Stack, Text } from "@fluentui/react";
import React, { FunctionComponent, useEffect, useState } from "react";
import { CodeOfConductEndpoints, HttpStatusCodes } from "../../../../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../../../../Common/ErrorHandlingUtils";
import { JunoClient } from "../../../../Juno/JunoClient";
import { Action } from "../../../../Shared/Telemetry/TelemetryConstants";
import { trace, traceFailure, traceStart, traceSuccess } from "../../../../Shared/Telemetry/TelemetryProcessor";

export interface CodeOfConductProps {
  junoClient: JunoClient;
  onAcceptCodeOfConduct: (result: boolean) => void;
}

export const CodeOfConduct: FunctionComponent<CodeOfConductProps> = ({
  junoClient,
  onAcceptCodeOfConduct,
}: CodeOfConductProps) => {
  const descriptionPara1 = "Azure Cosmos DB Notebook Gallery - Code of Conduct";
  const descriptionPara2 = "The notebook public gallery contains notebook samples shared by users of Azure Cosmos DB.";
  const descriptionPara3 = "In order to view and publish your samples to the gallery, you must accept the ";
  const link1: { label: string; url: string } = {
    label: "code of conduct.",
    url: CodeOfConductEndpoints.codeOfConduct,
  };

  const [readCodeOfConduct, setReadCodeOfConduct] = useState<boolean>(false);

  const acceptCodeOfConduct = async (): Promise<void> => {
    const startKey = traceStart(Action.NotebooksGalleryAcceptCodeOfConduct);

    try {
      const response = await junoClient.acceptCodeOfConduct();
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when accepting code of conduct`);
      }

      traceSuccess(Action.NotebooksGalleryAcceptCodeOfConduct, {}, startKey);

      onAcceptCodeOfConduct(response.data);
    } catch (error) {
      traceFailure(
        Action.NotebooksGalleryAcceptCodeOfConduct,
        {
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );

      handleError(error, "CodeOfConduct/acceptCodeOfConduct", "Failed to accept code of conduct");
    }
  };

  const onChangeCheckbox = (): void => {
    setReadCodeOfConduct(!readCodeOfConduct);
  };

  useEffect(() => {
    trace(Action.NotebooksGalleryViewCodeOfConduct);
  }, []);

  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Stack.Item>
        <Text style={{ fontWeight: 500, fontSize: "20px" }}>{descriptionPara1}</Text>
      </Stack.Item>

      <Stack.Item>
        <Text>{descriptionPara2}</Text>
      </Stack.Item>

      <Stack.Item>
        <Text>
          {descriptionPara3}
          <Link href={link1.url} target="_blank">
            {link1.label}
          </Link>
        </Text>
      </Stack.Item>

      <Stack.Item>
        <Checkbox
          styles={{
            label: {
              margin: 0,
              padding: "2 0 2 0",
            },
            text: {
              fontSize: 12,
            },
          }}
          label="I have read and accept the code of conduct."
          onChange={onChangeCheckbox}
        />
      </Stack.Item>

      <Stack.Item>
        <PrimaryButton
          ariaLabel="Continue"
          title="Continue"
          onClick={async () => await acceptCodeOfConduct()}
          tabIndex={0}
          className="genericPaneSubmitBtn"
          text="Continue"
          disabled={!readCodeOfConduct}
        />
      </Stack.Item>
    </Stack>
  );
};
