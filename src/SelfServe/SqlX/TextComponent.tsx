import React from "react";
import { Text } from "office-ui-fabric-react";
import { InputType } from "../../Explorer/Controls/SmartUi/SmartUiComponent";

interface TextComponentProps {
    text: string;
    currentValues: Map<string, InputType>
}

export class TextComponent extends React.Component<TextComponentProps> {

    public render() {
        return <Text>{this.props.text}, instanceCount: {this.props.currentValues?.get("instanceCount")}</Text>
    }
}
