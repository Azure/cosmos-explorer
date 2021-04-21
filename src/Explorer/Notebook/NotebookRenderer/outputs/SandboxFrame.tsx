import Html2Canvas from "html2canvas";
import React from "react";
import ReactDOM from "react-dom";
import { copyStyles } from "../../../../Utils/StyleUtils";
import { GalleryCardComponent } from "../../../Controls/NotebookGallery/Cards/GalleryCardComponent";
import { SnapshotFragment } from "../../NotebookComponent/types";

interface SandboxFrameProps {
  style: React.CSSProperties;
  sandbox: string;
  onSnapshotStarted: () => void;
  onNewSnapshot: (snapshot: SnapshotFragment) => void;
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

    this.props.onSnapshotStarted();
    const target = this.topNodeRef.current;
    // target.scrollIntoView();
    Html2Canvas(target, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: true,
    })
      .then((canvas) => {
        //redraw canvas to fit Card Cover Image dimensions
        const originalImageData = canvas.toDataURL();
        const requiredHeight =
          parseInt(canvas.style.width.split("px")[0]) * GalleryCardComponent.cardHeightToWidthRatio;
        canvas.height = requiredHeight;
        const context = canvas.getContext("2d");
        const image = new Image();
        image.src = originalImageData;
        image.onload = () => {
          context.drawImage(image, 0, 0);
          this.props.onNewSnapshot({
            image,
            boundingClientRect: this.state.frame.getBoundingClientRect(),
            requestId: this.props.snapshotRequestId,
          });
        };
      })
      .catch((error) => {
        // TODO HANDLE ERROR
        console.error(error);
      });
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
