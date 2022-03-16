import { ImmutableOutput } from "@nteract/commutable";
import { actions, AppState, ContentRef, KernelRef, selectors } from "@nteract/core";
import Immutable from "immutable";
import React, { CSSProperties, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import "./DataUploader.less";

interface DataUploaderPureProps {
  contentRef: ContentRef;
  kernelRef: KernelRef;
  databaseId: string;
  collectionId: string;
}

const getColor = (props) => {
  if (props.isDragAccept) {
    return "#00e676";
  }
  if (props.isDragReject) {
    return "#ff1744";
  }
  if (props.isFocused) {
    return "#2196f3";
  }
  return "#eeeeee";
};

interface DataUploaderDispatchProps {
  runCell: (contentRef: ContentRef, cellId: string) => void;
  addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => void;
  updateCell: (text: string, id: string, contentRef: ContentRef) => void;
}

type DataUploaderProps = DataUploaderPureProps & StateProps & DataUploaderDispatchProps;

const DataUploader: React.FC<DataUploaderProps> = (props) => {
  // componentDidMount(): void {
  //   loadTransform(this.props);
  // }

  // private onAnalyzeButtonClick = (filter: string = DefaultFilter, sampleSize: string = this.state.sampleSize) => {
  //   const query = {
  //     command: "listSchema",
  //     database: this.props.databaseId,
  //     collection: this.props.collectionId,
  //     outputType: this.state.outputType,
  //     filter,
  //     sampleSize,
  //   };

  //   this.setState({
  //     isFiltering: true,
  //   });

  //   this.props.updateCell(JSON.stringify(query), this.props.firstCellId, this.props.contentRef);

  //   this.clickAnalyzeTelemetryStartKey = traceStart(Action.DataUploaderClickAnalyze, {
  //     database: this.props.databaseId,
  //     collection: this.props.collectionId,
  //     sampleSize,
  //   });

  //   this.props.runCell(this.props.contentRef, this.props.firstCellId);
  // };

  const { firstCellId: id, contentRef, kernelStatus } = props;
  // eslint-disable-next-line no-console
  console.log("firstCellId: id, contentRef, kernelStatus", id, contentRef, kernelStatus);

  const isKernelBusy = kernelStatus === "busy";
  const isKernelIdle = kernelStatus === "idle";

  const baseStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    borderWidth: 2,
    borderRadius: 2,
    borderColor: "#eeeeee",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
    color: "#bdbdbd",
    transition: "border .3s ease-in-out",
  };

  const activeStyle = {
    borderColor: "#2196f3",
  };

  const acceptStyle = {
    borderColor: "#00e676",
  };

  const rejectStyle = {
    borderColor: "#ff1744",
  };

  const onDrop = useCallback((acceptedFiles) => {
    //eslint-disable-next-line no-console
    console.log("acceptedFiles", acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: ".json",
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  if (!id) {
    return <></>;
  }

  return (
    <div {...getRootProps({ style })}>
      <input {...getInputProps()} />
      <div>Drag and drop your json file here</div>
    </div>
  );
};

interface StateProps {
  firstCellId: string;
  kernelStatus: string;
  outputs: Immutable.List<ImmutableOutput>;
}

interface InitialProps {
  kernelRef: string;
  contentRef: string;
}

// Redux
const makeMapStateToProps = (state: AppState, initialProps: InitialProps) => {
  const { kernelRef, contentRef } = initialProps;
  const mapStateToProps = (state: AppState) => {
    let kernelStatus;
    let firstCellId;
    let outputs;

    const kernel = selectors.kernel(state, { kernelRef });
    if (kernel) {
      kernelStatus = kernel.status;
    }

    const content = selectors.content(state, { contentRef });
    if (content?.type === "notebook") {
      const cellOrder = selectors.notebook.cellOrder(content.model);
      if (cellOrder.size > 0) {
        firstCellId = cellOrder.first() as string;

        const model = selectors.model(state, { contentRef });
        if (model && model.type === "notebook") {
          const cell = selectors.notebook.cellById(model, { id: firstCellId });
          if (cell) {
            outputs = cell.get("outputs", Immutable.List());
          }
        }
      }
    }

    return {
      firstCellId,
      kernelStatus,
      outputs,
    };
  };
  return mapStateToProps;
};

const makeMapDispatchToProps = () => {
  const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
      addTransform: (transform: React.ComponentType & { MIMETYPE: string }) => {
        return dispatch(
          actions.addTransform({
            mediaType: transform.MIMETYPE,
            component: transform,
          })
        );
      },
      runCell: (contentRef: ContentRef, cellId: string) => {
        return dispatch(
          actions.executeCell({
            contentRef,
            id: cellId,
          })
        );
      },
      updateCell: (text: string, id: string, contentRef: ContentRef) => {
        dispatch(actions.updateCellSource({ id, contentRef, value: text }));
      },
    };
  };
  return mapDispatchToProps;
};

export default connect(makeMapStateToProps, makeMapDispatchToProps)(DataUploader);
