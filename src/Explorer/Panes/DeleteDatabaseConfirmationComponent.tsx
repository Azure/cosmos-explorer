import * as React from "react";

interface DeleteDatabaseConfirmationPaneProps {
  isVisible: boolean;
}

interface DeleteDatabaseConfirmationPaneStates {
  isVisible: boolean;
}

export class DeleteDatabaseConfirmationPane extends React.Component<
  DeleteDatabaseConfirmationPaneProps,
  DeleteDatabaseConfirmationPaneStates
> {
  constructor(props: DeleteDatabaseConfirmationPaneProps) {
    super(props);

    this.state = {
      isVisible: props.isVisible,
    };
  }
  public render(): JSX.Element {
    return <div hidden={!this.state.isVisible}>Test</div>;
  }
}
