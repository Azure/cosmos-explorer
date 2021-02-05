import * as React from "react";
import { JunoClient } from "../../../Juno/JunoClient";
import { HttpStatusCodes, CodeOfConductEndpoints } from "../../../Common/Constants";
import { Stack, Text, Checkbox, PrimaryButton, Link } from "office-ui-fabric-react";
import { getErrorMessage, getErrorStack, handleError } from "../../../Common/ErrorHandlingUtils";
import { trace, traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";

export interface CodeOfConductComponentProps {
  junoClient: JunoClient;
  onAcceptCodeOfConduct: (result: boolean) => void;
}

interface CodeOfConductComponentState {
  readCodeOfConduct: boolean;
}

export class CodeOfConductComponent extends React.Component<CodeOfConductComponentProps, CodeOfConductComponentState> {
  private viewCodeOfConductTraced: boolean;
  private descriptionPara1: string;
  private descriptionPara2: string;
  private descriptionPara3: string;
  private link1: { label: string; url: string };

  constructor(props: CodeOfConductComponentProps) {
    super(props);

    this.state = {
      readCodeOfConduct: false,
    };

    this.descriptionPara1 = "Azure Cosmos DB Notebook Gallery - Code of Conduct";
    this.descriptionPara2 = "The notebook public gallery contains notebook samples shared by users of Azure Cosmos DB.";
    this.descriptionPara3 = "In order to view and publish your samples to the gallery, you must accept the ";
    this.link1 = { label: "code of conduct.", url: CodeOfConductEndpoints.codeOfConduct };
  }

  private async acceptCodeOfConduct(): Promise<void> {
    const startKey = traceStart(Action.NotebooksGalleryAcceptCodeOfConduct);

    try {
      const response = await this.props.junoClient.acceptCodeOfConduct();
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when accepting code of conduct`);
      }

      traceSuccess(Action.NotebooksGalleryAcceptCodeOfConduct, startKey);

      this.props.onAcceptCodeOfConduct(response.data);
    } catch (error) {
      traceFailure(
        Action.NotebooksGalleryAcceptCodeOfConduct,
        {
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey
      );

      handleError(error, "CodeOfConductComponent/acceptCodeOfConduct", "Failed to accept code of conduct");
    }
  }

  private onChangeCheckbox = (): void => {
    this.setState({ readCodeOfConduct: !this.state.readCodeOfConduct });
  };

  public render(): JSX.Element {
    if (!this.viewCodeOfConductTraced) {
      this.viewCodeOfConductTraced = true;
      trace(Action.NotebooksGalleryViewCodeOfConduct, ActionModifiers.Mark, {});
    }

    return (
      <Stack tokens={{ childrenGap: 20 }}>
        <Stack.Item>
          <Text style={{ fontWeight: 500, fontSize: "20px" }}>{this.descriptionPara1}</Text>
        </Stack.Item>

        <Stack.Item>
          <Text>{this.descriptionPara2}</Text>
        </Stack.Item>

        <Stack.Item>
          <Text>
            {this.descriptionPara3}
            <Link href={this.link1.url} target="_blank">
              {this.link1.label}
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
            label="I have read and accepted the code of conduct."
            onChange={this.onChangeCheckbox}
          />
        </Stack.Item>

        <Stack.Item>
          <PrimaryButton
            ariaLabel="Continue"
            title="Continue"
            onClick={async () => await this.acceptCodeOfConduct()}
            tabIndex={0}
            className="genericPaneSubmitBtn"
            text="Continue"
            disabled={!this.state.readCodeOfConduct}
          />
        </Stack.Item>
      </Stack>
    );
  }
}
