import { ContentRef } from "@nteract/core";
import * as React from "react";
import NotificationSystem, { System as ReactNotificationSystem } from "react-notification-system";
import { default as Contents } from "./contents";

export class NotebookComponent extends React.Component<{ contentRef: ContentRef }> {
  notificationSystem!: ReactNotificationSystem;

  shouldComponentUpdate(nextProps: { contentRef: ContentRef }): boolean {
    return nextProps.contentRef !== this.props.contentRef;
  }

  public render(): JSX.Element {
    return (
      <div className="notebookComponentContainer">
        <Contents contentRef={this.props.contentRef} />
        <NotificationSystem
          ref={(notificationSystem: ReactNotificationSystem) => {
            this.notificationSystem = notificationSystem;
          }}
        />
      </div>
    );
  }
}
