import { DirectionalHint, Icon, IconButton, Label, Stack, TooltipHost } from "@fluentui/react";
import * as React from "react";
import { NormalizedEventKey } from "../../../Common/Constants";
import { accordionStackTokens } from "../Settings/SettingsRenderUtils";

export interface CollapsibleSectionProps {
  title: string;
  isExpandedByDefault: boolean;
  onExpand?: () => void;
  children: JSX.Element;
  tooltipContent?: string | JSX.Element | JSX.Element[];
  showDelete?: boolean;
  onDelete?: () => void;
  disabled?: boolean;
}

export interface CollapsibleSectionState {
  isExpanded: boolean;
}

export class CollapsibleSectionComponent extends React.Component<CollapsibleSectionProps, CollapsibleSectionState> {
  constructor(props: CollapsibleSectionProps) {
    super(props);
    this.state = {
      isExpanded: this.props.isExpandedByDefault,
    };
  }

  private toggleCollapsed = (): void => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  public componentDidUpdate(_prevProps: CollapsibleSectionProps, prevState: CollapsibleSectionState): void {
    if (!prevState.isExpanded && this.state.isExpanded && this.props.onExpand) {
      this.props.onExpand();
    }
  }

  private onKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      this.toggleCollapsed();
      event.stopPropagation();
    }
  };

  public render(): JSX.Element {
    return (
      <>
        <Stack
          className={"collapsibleSection"}
          horizontal
          verticalAlign="center"
          tokens={accordionStackTokens}
          onClick={this.toggleCollapsed}
          onKeyPress={this.onKeyPress}
          tabIndex={0}
          role="button"
          aria-expanded={this.state.isExpanded}
        >
          <Icon iconName={this.state.isExpanded ? "ChevronDown" : "ChevronRight"} />
          <Label styles={{ root: { color: "var(--colorNeutralForeground1)" } }}>{this.props.title}</Label>
          {this.props.tooltipContent && (
            <TooltipHost
              directionalHint={DirectionalHint.bottomLeftEdge}
              content={this.props.tooltipContent}
              styles={{
                root: {
                  marginLeft: "0 !important",
                },
              }}
            >
              <Icon iconName="Info" className="panelInfoIcon" tabIndex={0} />
            </TooltipHost>
          )}
          {this.props.showDelete && (
            <Stack.Item style={{ marginLeft: "auto" }}>
              <IconButton
                disabled={this.props.disabled}
                id={`delete-${this.props.title.split(" ").join("-")}`}
                iconProps={{ iconName: "Delete" }}
                style={{ height: 27, marginRight: "20px" }}
                styles={{
                  rootHovered: {
                    backgroundColor: "transparent",
                  },
                  rootPressed: {
                    backgroundColor: "transparent",
                  },
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  this.props.onDelete();
                }}
              />
            </Stack.Item>
          )}
        </Stack>
        {this.state.isExpanded && this.props.children}
      </>
    );
  }
}
