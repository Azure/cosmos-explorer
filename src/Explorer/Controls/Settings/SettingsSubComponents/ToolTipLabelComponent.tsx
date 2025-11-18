import { DirectionalHint, IIconStyles, Icon, Stack, Text, TooltipHost } from "@fluentui/react";
import * as React from "react";
import { toolTipLabelStackTokens } from "../SettingsRenderUtils";

export interface ToolTipLabelComponentProps {
  label: string;
  toolTipElement: JSX.Element;
}

const iconButtonStyles: Partial<IIconStyles> = { root: { marginBottom: -3 } };

export class ToolTipLabelComponent extends React.Component<ToolTipLabelComponentProps> {
  public render(): JSX.Element {
    return (
      <>
        <Stack horizontal verticalAlign="center" tokens={toolTipLabelStackTokens}>
          {this.props.label && (
            <Text style={{ fontWeight: 600, color: "var(--colorNeutralForeground1)" }}>{this.props.label}</Text>
          )}
          {this.props.toolTipElement && (
            <TooltipHost
              content={this.props.toolTipElement}
              directionalHint={DirectionalHint.rightCenter}
              calloutProps={{ gapSpace: 0 }}
              styles={{ root: { display: "inline-block", float: "right" } }}
            >
              <Icon iconName="Info" ariaLabel="Info" styles={iconButtonStyles} />
            </TooltipHost>
          )}
        </Stack>
      </>
    );
  }
}
