import { AppState, ContentRef, selectors } from "@nteract/core";
import * as React from "react";
import { connect } from "react-redux";
import { NotebookUtil } from "../NotebookUtil";
import * as NteractUtil from "../NTeractUtil";

interface VirtualCommandBarComponentProps {
  kernelSpecName: string;
  kernelStatus: string;
  currentCellType: string;
  isNotebookUntrusted: boolean;
  onRender: () => void;
}

class VirtualCommandBarComponent extends React.Component<VirtualCommandBarComponentProps> {
  constructor(props: VirtualCommandBarComponentProps) {
    super(props);
    this.state = {};
  }

  shouldComponentUpdate(nextProps: VirtualCommandBarComponentProps): boolean {
    return (
      this.props.kernelStatus !== nextProps.kernelStatus ||
      this.props.kernelSpecName !== nextProps.kernelSpecName ||
      this.props.currentCellType !== nextProps.currentCellType ||
      this.props.isNotebookUntrusted !== nextProps.isNotebookUntrusted
    );
  }

  public render(): JSX.Element {
    this.props.onRender && this.props.onRender();
    return <></>;
  }
}

interface InitialProps {
  contentRef: ContentRef;
  onRender: () => void;
}

// Redux
const makeMapStateToProps = (
  initialState: AppState,
  initialProps: InitialProps,
): ((state: AppState) => VirtualCommandBarComponentProps) => {
  const { contentRef } = initialProps;
  const mapStateToProps = (state: AppState) => {
    const content = selectors.content(state, { contentRef });
    let kernelStatus, kernelSpecName, currentCellType;

    if (!content || content.type !== "notebook") {
      return {
        kernelStatus,
        kernelSpecName,
        currentCellType,
        isNotebookUntrusted: NotebookUtil.isNotebookUntrusted(state, contentRef),
      } as VirtualCommandBarComponentProps;
    }

    const kernelRef = content.model.kernelRef;
    let kernel;
    if (kernelRef) {
      kernel = selectors.kernel(state, { kernelRef });
    }

    if (kernel) {
      kernelStatus = kernel.status;
      kernelSpecName = kernel.kernelSpecName;
    }

    currentCellType = NteractUtil.getCurrentCellType(content);
    return {
      kernelStatus,
      kernelSpecName,
      currentCellType,
      isNotebookUntrusted: NotebookUtil.isNotebookUntrusted(state, contentRef),
      onRender: initialProps.onRender,
    };
  };

  return mapStateToProps;
};

export default connect(makeMapStateToProps)(VirtualCommandBarComponent);
