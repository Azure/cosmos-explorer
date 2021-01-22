import { Icon, Label, Stack } from "office-ui-fabric-react";
import * as React from "react";
import { accordionIconStyles, accordionStackTokens } from "../Settings/SettingsRenderUtils";

export interface CollapsibleSectionProps {
  title: string;
}

export interface CollapsibleSectionState {
  isExpanded: boolean;
}

export class CollapsibleSectionComponent extends React.Component<CollapsibleSectionProps, CollapsibleSectionState> {
  constructor(props: CollapsibleSectionProps) {
    super(props);
    this.state = {
      isExpanded: true,
    };
  }

  private toggleCollapsed = (): void => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  public render(): JSX.Element {
    return (
      <>
        <Stack className="collapsibleSection" horizontal tokens={accordionStackTokens} onClick={this.toggleCollapsed}>
          <Icon iconName={this.state.isExpanded ? "ChevronDown" : "ChevronRight"} styles={accordionIconStyles} />
          <Label>{this.props.title}</Label>
        </Stack>
        {this.state.isExpanded && this.props.children}
      </>
    );
  }
}
