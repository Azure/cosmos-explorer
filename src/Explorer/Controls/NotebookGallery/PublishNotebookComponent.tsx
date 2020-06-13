import * as React from "react";
import {
  PrimaryButton,
  DefaultButton,
  Stack,
  IButtonProps,
  Text,
  TextField,
  ITextFieldProps
} from "office-ui-fabric-react";
import { ButtonsFooterStyle, ChildrenMargin } from "../GitHub/GitHubStyleConstants";
import { FileSystemUtil } from "../../Notebook/FileSystemUtil";

export interface PublishNotebookComponentProps {
  name: string;
  author: string;
  content: string;
  onPublishClick: (description: string, tags: string, thumbnailUrl: string) => void;
  onCancelClick: () => void;
}

interface PublishNotebookComponentState {
  description: string;
  tags: string;
  thumbnailUrl: string;
}

export class PublishNotebookComponent extends React.Component<
  PublishNotebookComponentProps,
  PublishNotebookComponentState
> {
  constructor(props: PublishNotebookComponentProps) {
    super(props);

    this.state = {
      description: undefined,
      tags: undefined,
      thumbnailUrl: undefined
    };
  }

  public render(): JSX.Element {
    const header = "Publish to gallery";
    const descriptionPara1 =
      "This notebook has your data. Please make sure you delete any sensitive data/output before publishing.";
    const descriptionPara2 = `Would you like to publish and share ${
      this.props.name ? FileSystemUtil.stripExtension(this.props.name, "ipynb") : "this notebook"
    } to the gallery?`;
    const descriptionProps: ITextFieldProps = {
      label: "Description",
      ariaLabel: "Description",
      multiline: true,
      rows: 3,
      required: true,
      value: this.state.description,
      onChange: this.onDescriptionChange
    };
    const tagsProps: ITextFieldProps = {
      label: "Tags",
      ariaLabel: "Tags",
      placeholder: "Optional tag 1, Optional tag 2",
      value: this.state.tags,
      onChange: this.onTagsChange
    };
    const thumbnailProps: ITextFieldProps = {
      label: "Cover image url",
      ariaLabel: "Cover image url",
      value: this.state.thumbnailUrl,
      onChange: this.onThumbnailUrlChange
    };
    const content = (
      <Stack tokens={{ childrenGap: 20 }}>
        <Text>{descriptionPara1}</Text>
        <Text>{descriptionPara2}</Text>
        <TextField {...descriptionProps} />
        <TextField {...tagsProps} />
        <TextField {...thumbnailProps} />
      </Stack>
    );
    const publishProps: IButtonProps = {
      text: "Publish",
      ariaLabel: "Publish",
      onClick: this.onPublishClick
    };
    const cancelProps: IButtonProps = {
      text: "Cancel",
      ariaLabel: "Cancel",
      onClick: this.props.onCancelClick
    };

    return (
      <>
        <div className={"firstdivbg headerline"}>{header}</div>
        <div className={"paneMainContent"}>{content}</div>
        <div className={"paneFooter"} style={ButtonsFooterStyle}>
          <PrimaryButton {...publishProps} />
          <DefaultButton style={{ marginLeft: ChildrenMargin }} {...cancelProps} />
        </div>
      </>
    );
  }

  private onDescriptionChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({
      description: newValue
    });
  };

  private onTagsChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
    this.setState({
      tags: newValue
    });
  };

  private onThumbnailUrlChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({
      thumbnailUrl: newValue
    });
  };

  private onPublishClick = (): void => {
    this.props.onPublishClick(this.state.description, this.state.tags, this.state.thumbnailUrl);
  };
}
