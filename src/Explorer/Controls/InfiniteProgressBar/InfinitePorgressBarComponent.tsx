import * as React from "react";
import "./InfiniteProgressBarComponent.less";

export class InfiniteProgressBarComponent extends React.Component<{}, {}> {
  constructor(props: any) {
    super(props);
  }

  public render(): JSX.Element {
    return (
      <div className="progress">
        <div className="indeterminate"></div>
      </div>
    );
  }
}
