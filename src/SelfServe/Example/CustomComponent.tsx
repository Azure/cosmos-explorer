import React from "react";
import { HoverCard, HoverCardType, Stack, Text } from "office-ui-fabric-react";
import { InputType } from "../../Explorer/Controls/SmartUi/SmartUiComponent";

interface TextComponentProps {
  text: string;
  currentValues: Map<string, InputType>;
}

export class TextComponent extends React.Component<TextComponentProps> {
  private onHover = (): JSX.Element => {
    return (
      <Stack tokens={{ childrenGap: 5, padding: 15 }}>
        <Text>Choice: {this.props.currentValues.get("choiceInput")?.toString()}</Text>
        <Text>Boolean: {this.props.currentValues.get("booleanInput")?.toString()}</Text>
        <Text>String: {this.props.currentValues.get("stringInput")?.toString()}</Text>
        <Text>Slider: {this.props.currentValues.get("numberSliderInput")?.toString()}</Text>
        <Text>Spinner: {this.props.currentValues.get("numberSpinnerInput")?.toString()}</Text>
      </Stack>
    );
  };

  public render(): JSX.Element {
    return (
      <HoverCard plainCardProps={{ onRenderPlainCard: this.onHover }} instantOpenOnClick type={HoverCardType.plain}>
        <Text styles={{ root: { fontWeight: 600 } }}>{this.props.text}</Text>
      </HoverCard>
    );
  }
}
