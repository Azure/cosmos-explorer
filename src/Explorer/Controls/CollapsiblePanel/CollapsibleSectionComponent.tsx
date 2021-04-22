import { Icon, Label, Stack } from "office-ui-fabric-react";
import * as React from "react";
import { accordionStackTokens } from "../Settings/SettingsRenderUtils";

export interface CollapsibleSectionProps {
  title: string;
  isExpandedByDefault: boolean;
  onExpand?: () => void;
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

  public render(): JSX.Element {
    return (
      <>
        <Stack
          className="collapsibleSection"
          horizontal
          verticalAlign="center"
          tokens={accordionStackTokens}
          onClick={this.toggleCollapsed}
        >
          <Icon iconName={this.state.isExpanded ? "ChevronDown" : "ChevronRight"} />
          <Label>{this.props.title}</Label>
        </Stack>
        {this.state.isExpanded && this.props.children}
      </>
    );
  }
}
