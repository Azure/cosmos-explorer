import * as React from "react";
import { JunoClient, IGalleryItem } from "../../../Juno/JunoClient";
import { HttpStatusCodes, CodeOfConductEndpoints } from "../../../Common/Constants";
import * as Logger from "../../../Common/Logger";
import { NotificationConsoleUtils } from "../../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../../Menus/NotificationConsole/NotificationConsoleComponent";
import { Stack, Text, Checkbox, PrimaryButton } from "office-ui-fabric-react";

export interface CodeOfConductComponentProps {
  junoClient: JunoClient;
  onAcceptCodeOfConduct: (result: boolean) => void;
}

interface CodeOfConductComponentState {
  readCodeOfConduct: boolean;
}

export class CodeOfConductComponent extends React.Component<CodeOfConductComponentProps, CodeOfConductComponentState> {
  private descriptionPara1: string;
  private descriptionPara2: string;
  private descriptionPara3: string;
  private link1: any;
  private link2: any;

  constructor(props: CodeOfConductComponentProps) {
    super(props);

    this.state = {
      readCodeOfConduct: false
    };

    this.descriptionPara1 = "Azure CosmosDB Notebook Gallery - Code of Conduct and Privacy Statement";
    this.descriptionPara2 = "Azure Cosmos DB Notebook Public Gallery contains notebook samples shared by users of Cosmos DB.";
    this.descriptionPara3 = "In order to access Azure Cosmos DB Notebook Gallery resources, you must accept the ";
    this.link1 = (
      <a href={CodeOfConductEndpoints.codeOfConduct} target="_blank">
        code of conduct
      </a>
    );
    this.link2 = (
      <a href={CodeOfConductEndpoints.privacyStatement} target="_blank">
        privacy statement
      </a>
    );
  }

  private async acceptCodeOfConduct(): Promise<void> {
    try {
      const response = await this.props.junoClient.acceptCodeOfConduct();
      if (response.status !== HttpStatusCodes.OK && response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status} when accepting code of conduct`);
      }

      this.props.onAcceptCodeOfConduct(response.data);
    } catch (error) {
      const message = `Failed to accept code of conduct: ${error}`;
      Logger.logError(message, "CodeOfConductComponent/acceptCodeOfConduct");
      NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, message);
    }
  }

  public render(): JSX.Element {
    return (
      <div className="publishNotebookPanelContent">
        <Stack tokens={{ childrenGap: 20 }}>
          <Stack.Item>
            <Text style={{fontWeight: 500, fontSize: "20px"}}>{this.descriptionPara1}</Text>
          </Stack.Item>

          <Stack.Item>
            <Text>{this.descriptionPara2}</Text>
          </Stack.Item>

          <Stack.Item>
            <Text>
              {this.descriptionPara3}
              {this.link1} and {this.link2}
            </Text>
          </Stack.Item>

          <Stack.Item>
            <Checkbox
              styles={{
                label: {
                  margin: 0,
                  padding: "2 0 2 0"
                },
                text: {
                  fontSize: 12
                }
              }}
              label="I have read and accepted the code of conduct and privacy statement"
              onChange={() => this.setState({ readCodeOfConduct: !this.state.readCodeOfConduct })}
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
      </div>
    );
  }
}
