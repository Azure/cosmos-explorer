/**
 * Accordion top class
 */

import * as React from "react";
import AnimateHeight from "react-animate-height";
import TriangleDownIcon from "../../../../images/Triangle-down.svg";
import TriangleRightIcon from "../../../../images/Triangle-right.svg";
import * as Constants from "../../../Common/Constants";

export interface AccordionComponentProps {
  children: React.ReactNode;
}

export class AccordionComponent extends React.Component<AccordionComponentProps> {
  public render(): JSX.Element {
    return <div className="accordion">{this.props.children}</div>;
  }
}

/**
 * AccordionItem is the section inside the accordion
 */

export interface AccordionItemComponentProps {
  title: string;
  isExpanded?: boolean;
  containerStyles?: React.CSSProperties;
  styles?: React.CSSProperties;
}

interface AccordionItemComponentState {
  isExpanded?: boolean;
}

export class AccordionItemComponent extends React.Component<AccordionItemComponentProps, AccordionItemComponentState> {
  private static readonly durationMS = 500;
  private isExpanded?: boolean;

  constructor(props: AccordionItemComponentProps) {
    super(props);
    this.isExpanded = props.isExpanded;
    this.state = {
      isExpanded: true,
    };
  }

  componentDidUpdate() {
    if (this.props.isExpanded !== this.isExpanded) {
      this.isExpanded = this.props.isExpanded;
      this.setState({
        isExpanded: this.props.isExpanded,
      });
    }
  }

  public render(): JSX.Element {
    const { containerStyles, styles } = this.props;
    return (
      <div className="accordionItemContainer" style={{ ...containerStyles }}>
        <div className="accordionItemHeader" onClick={this.onHeaderClick} onKeyPress={this.onHeaderKeyPress}>
          {this.renderCollapseExpandIcon()}
          {this.props.title}
        </div>
        <div className="accordionItemContent">
          <AnimateHeight
            style={{ ...styles }}
            duration={AccordionItemComponent.durationMS}
            height={this.state.isExpanded ? "auto" : 0}
          >
            {this.props.children}
          </AnimateHeight>
        </div>
      </div>
    );
  }

  private renderCollapseExpandIcon(): JSX.Element {
    return (
      <img
        className="expandCollapseIcon"
        src={this.state.isExpanded ? TriangleDownIcon : TriangleRightIcon}
        alt={this.state.isExpanded ? `${this.props.title} hide` : `${this.props.title} expand`}
        tabIndex={0}
        role="button"
      />
    );
  }

  private onHeaderClick = (): void => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  private onHeaderKeyPress = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      this.setState({ isExpanded: !this.state.isExpanded });
      event.stopPropagation();
    }
  };
}
