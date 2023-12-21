import { Icon, Label, Stack } from "@fluentui/react";
import * as React from "react";
import { NormalizedEventKey } from "../../../Common/Constants";
import { accordionStackTokens } from "../Settings/SettingsRenderUtils";

export interface CollapsibleSectionProps {
  title: string;
  isExpandedByDefault: boolean;
  onExpand?: () => void;
  children: JSX.Element;
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

  public componentDidUpdate(): void {
    if (this.state.isExpanded && this.props.onExpand) {
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
          className="collapsibleSection"
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
          <Label>{this.props.title}</Label>
        </Stack>
        {this.state.isExpanded && this.props.children}
      </>
    );
  }
}
