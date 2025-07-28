import { MessageBar, MessageBarType } from "@fluentui/react";
import * as React from "react";
import { handleError } from "../../../../../Common/ErrorHandlingUtils";
import {
  mongoIndexTransformationRefreshingMessage,
  renderMongoIndexTransformationRefreshMessage,
} from "../../SettingsRenderUtils";
import { isIndexTransforming } from "../../SettingsUtils";

export interface IndexingPolicyRefreshComponentProps {
  indexTransformationProgress: number;
  refreshIndexTransformationProgress: () => Promise<void>;
}

interface IndexingPolicyRefreshComponentState {
  isRefreshing: boolean;
}

export class IndexingPolicyRefreshComponent extends React.Component<
  IndexingPolicyRefreshComponentProps,
  IndexingPolicyRefreshComponentState
> {
  constructor(props: IndexingPolicyRefreshComponentProps) {
    super(props);
    this.state = {
      isRefreshing: false,
    };
  }

  private onClickRefreshIndexingTransformationLink = async () => await this.refreshIndexTransformationProgress();

  private renderIndexTransformationWarning = (): JSX.Element => {
    if (this.state.isRefreshing) {
      return mongoIndexTransformationRefreshingMessage;
    } else if (isIndexTransforming(this.props.indexTransformationProgress)) {
      return renderMongoIndexTransformationRefreshMessage(
        this.props.indexTransformationProgress,
        this.onClickRefreshIndexingTransformationLink,
      );
    }
    return undefined;
  };

  private refreshIndexTransformationProgress = async () => {
    this.setState({ isRefreshing: true });
    try {
      await this.props.refreshIndexTransformationProgress();
    } catch (error) {
      handleError(error, "RefreshIndexTransformationProgress", "Refreshing index transformation progress failed");
    } finally {
      this.setState({ isRefreshing: false });
    }
  };

  public render(): JSX.Element {
    return this.renderIndexTransformationWarning() ? (
      <MessageBar messageBarType={MessageBarType.warning}>{this.renderIndexTransformationWarning()}</MessageBar>
    ) : (
      <></>
    );
  }
}
