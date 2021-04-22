import React from "react";
import ReactDOM from "react-dom";
import { copyStyles } from "../../../../Utils/StyleUtils";
import { SnapshotFragment } from "../../NotebookComponent/types";
import { NotebookUtil } from "../../NotebookUtil";

interface SandboxFrameProps {
  style: React.CSSProperties;
  sandbox: string;
  onNewSnapshot: (snapshot: SnapshotFragment) => void;
  onError: (error: Error) => void;
  snapshotRequestId: string;
}

interface SandboxFrameState {
  frame: HTMLIFrameElement;
  frameBody: HTMLElement;
  frameHeight: number;
}

export class SandboxFrame extends React.PureComponent<SandboxFrameProps, SandboxFrameState> {
  private resizeObserver: ResizeObserver;
  private mutationObserver: MutationObserver;
  private topNodeRef = React.createRef<HTMLDivElement>();

  constructor(props: SandboxFrameProps) {
    super(props);

    this.state = {
      frame: undefined,
      frameBody: undefined,
      frameHeight: 0,
    };
  }

  componentDidUpdate(prevProps: SandboxFrameProps): void {
    if (!this.props.snapshotRequestId || prevProps.snapshotRequestId === this.props.snapshotRequestId) {
      return;
    }

    NotebookUtil.takeScreenshot(
      this.topNodeRef.current,
      undefined,
      undefined,
      (imageSrc, image) => this.props.onNewSnapshot({
        image,
        boundingClientRect: this.state.frame.getBoundingClientRect(),
        requestId: this.props.snapshotRequestId,
      }),
      this.props.onError
    );
  }

  render(): JSX.Element {
    return (
      <iframe
        ref={(ele) => this.setState({ frame: ele })}
        srcDoc={`<!DOCTYPE html>`}
        onLoad={(event) => this.onFrameLoad(event)}
        style={this.props.style}
        sandbox={this.props.sandbox}
        height={this.state.frameHeight}
      >
        {this.state.frameBody && ReactDOM.createPortal(this.renderChildren(), this.state.frameBody)}
      </iframe>
    );
  }

  /**
   * Wrap children under one node that can be snapshot
   */
  private renderChildren() {
    return <div ref={this.topNodeRef}>{this.props.children}</div>;
  }

  componentWillUnmount(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  onFrameLoad(event: React.SyntheticEvent<HTMLIFrameElement, Event>): void {
    const doc = (event.target as HTMLIFrameElement).contentDocument;
    copyStyles(document, doc);

    this.setState({ frameBody: doc.body });

    this.mutationObserver = new MutationObserver(() => {
      const bodyFirstElementChild = this.state.frameBody?.firstElementChild;
      if (!this.resizeObserver && bodyFirstElementChild) {
        this.resizeObserver = new ResizeObserver(() =>
          this.setState({
            frameHeight: this.state.frameBody?.firstElementChild.scrollHeight,
          })
        );
        this.resizeObserver.observe(bodyFirstElementChild);
      }
    });
    this.mutationObserver.observe(doc.body, { childList: true });
  }
}
