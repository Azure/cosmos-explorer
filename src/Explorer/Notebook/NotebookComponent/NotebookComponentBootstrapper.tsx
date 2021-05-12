import { CellId, CellType, ImmutableNotebook } from "@nteract/commutable";
// Vendor modules
import {
  actions,
  AppState,
  ContentRef,
  DocumentRecordProps,
  KernelRef,
  NotebookContentRecord,
  selectors,
} from "@nteract/core";
import "@nteract/styles/editor-overrides.css";
import "@nteract/styles/global-variables.css";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/lib/codemirror.css";
import * as Immutable from "immutable";
import * as React from "react";
import { Provider } from "react-redux";
import "react-table/react-table.css";
import { AnyAction, Store } from "redux";
import { NotebookClientV2 } from "../NotebookClientV2";
import { NotebookUtil } from "../NotebookUtil";
import * as NteractUtil from "../NTeractUtil";
import * as CdbActions from "./actions";
import { NotebookComponent } from "./NotebookComponent";
import "./NotebookComponent.less";

export interface NotebookComponentBootstrapperOptions {
  notebookClient: NotebookClientV2;
  contentRef: ContentRef;
}

export class NotebookComponentBootstrapper {
  public contentRef: ContentRef;
  protected renderExtraComponent: () => JSX.Element;

  private notebookClient: NotebookClientV2;

  constructor(options: NotebookComponentBootstrapperOptions) {
    this.notebookClient = options.notebookClient;
    this.contentRef = options.contentRef;
  }

  protected static wrapModelIntoContent(name: string, path: string, content: any) {
    return {
      name,
      path,
      last_modified: new Date(),
      created: "",
      content,
      format: "json",
      mimetype: null as any,
      size: 0,
      writeable: false,
      type: "notebook",
    };
  }

  private renderDefaultNotebookComponent(props: any): JSX.Element {
    return (
      <>
        {this.renderExtraComponent && this.renderExtraComponent()}
        {React.createElement<{ contentRef: ContentRef }>(NotebookComponent, { contentRef: this.contentRef, ...props })}
      </>
    );
  }

  public getContent(): { name: string; content: string | ImmutableNotebook } {
    const record = this.getStore().getState().core.entities.contents.byRef.get(this.contentRef);
    let content: string | ImmutableNotebook;
    switch (record.model.type) {
      case "notebook":
        content = record.model.notebook;
        break;
      case "file":
        content = record.model.text;
        break;
      default:
        throw new Error(`Unsupported model type ${record.model.type}`);
    }

    return {
      name: NotebookUtil.getName(record.filepath),
      content,
    };
  }

  public setContent(name: string, content: any): void {
    this.getStore().dispatch(
      actions.fetchContentFulfilled({
        filepath: undefined,
        model: NotebookComponentBootstrapper.wrapModelIntoContent(name, undefined, content),
        kernelRef: undefined,
        contentRef: this.contentRef,
      })
    );
  }

  /**
   * We can overload the notebook renderer here
   * @param renderer
   * @props additional props
   */
  public renderComponent(
    renderer?: any, // TODO FIX THIS React.ComponentClass<{ contentRef: ContentRef; isReadOnly?: boolean }>,
    props?: any
  ): JSX.Element {
    return (
      <Provider store={this.getStore()}>
        {renderer
          ? React.createElement<{ contentRef: ContentRef }>(renderer, { contentRef: this.contentRef, ...props })
          : this.renderDefaultNotebookComponent(props)}
      </Provider>
    );
  }

  /* Notebook operations. See nteract/packages/connected-components/src/notebook-menu/index.tsx */
  public notebookSave(): void {
    this.getStore().dispatch(
      actions.save({
        contentRef: this.contentRef,
      })
    );
  }

  public notebookChangeKernel(kernelSpecName: string): void {
    this.getStore().dispatch(
      actions.changeKernelByName({
        contentRef: this.contentRef,
        kernelSpecName,
        oldKernelRef: this.getCurrentKernelRef(),
      })
    );
  }

  public notebookRunAndAdvance(): void {
    this.getStore().dispatch(
      CdbActions.executeFocusedCellAndFocusNext({
        contentRef: this.contentRef,
      })
    );
  }

  public notebookRunAll(): void {
    this.getStore().dispatch(
      actions.executeAllCells({
        contentRef: this.contentRef,
      })
    );
  }

  public notebookInterruptKernel(): void {
    this.getStore().dispatch(
      actions.interruptKernel({
        kernelRef: this.getCurrentKernelRef(),
      })
    );
  }

  public notebookKillKernel(): void {
    this.getStore().dispatch(
      actions.killKernel({
        restarting: false,
        kernelRef: this.getCurrentKernelRef(),
      })
    );
  }

  public notebookRestartKernel(): void {
    this.getStore().dispatch(
      actions.restartKernel({
        kernelRef: this.getCurrentKernelRef(),
        contentRef: this.contentRef,
        outputHandling: "None",
      })
    );
  }

  public notebookClearAllOutputs(): void {
    this.getStore().dispatch(
      actions.clearAllOutputs({
        contentRef: this.contentRef,
      })
    );
  }

  public notebookInsertBelow(): void {
    this.getStore().dispatch(
      actions.createCellBelow({
        cellType: "code",
        contentRef: this.contentRef,
      })
    );
  }

  public notebookChangeCellType(type: CellType): void {
    const focusedCellId = this.getFocusedCellId();
    if (!focusedCellId) {
      console.error("No focused cell");
      return;
    }

    this.getStore().dispatch(
      actions.changeCellType({
        id: focusedCellId,
        contentRef: this.contentRef,
        to: type,
      })
    );
  }

  public notebokCopy(): void {
    const focusedCellId = this.getFocusedCellId();
    if (!focusedCellId) {
      console.error("No focused cell");
      return;
    }

    this.getStore().dispatch(
      actions.copyCell({
        id: focusedCellId,
        contentRef: this.contentRef,
      })
    );
  }

  public notebookCut(): void {
    const focusedCellId = this.getFocusedCellId();
    if (!focusedCellId) {
      console.error("No focused cell");
      return;
    }

    this.getStore().dispatch(
      actions.cutCell({
        id: focusedCellId,
        contentRef: this.contentRef,
      })
    );
  }

  public notebookPaste(): void {
    this.getStore().dispatch(
      actions.pasteCell({
        contentRef: this.contentRef,
      })
    );
  }

  public notebookShutdown(): void {
    const store = this.getStore();
    const kernelRef = this.getCurrentKernelRef();

    if (kernelRef) {
      store.dispatch(
        actions.killKernel({
          restarting: false,
          kernelRef,
        })
      );
    }

    store.dispatch(
      CdbActions.closeNotebook({
        contentRef: this.contentRef,
      })
    );
  }

  public isContentDirty(): boolean {
    const content = selectors.content(this.getStore().getState(), { contentRef: this.contentRef });
    if (!content) {
      console.log("No error");
      return false;
    }

    return selectors.notebook.isDirty(content.model as Immutable.RecordOf<DocumentRecordProps>);
  }

  /**
   * For display purposes, only return non-killed kernels
   */
  public getCurrentKernelName(): string {
    const currentKernel = selectors.kernel(this.getStore().getState(), { kernelRef: this.getCurrentKernelRef() });
    return (currentKernel && currentKernel.status !== "killed" && currentKernel.kernelSpecName) || undefined;
  }

  // Returns the kernel name to select in the kernels dropdown
  public getSelectedKernelName(): string {
    const currentKernelName = this.getCurrentKernelName();
    if (!currentKernelName) {
      // if there's no live kernel, try to get the kernel name from the notebook metadata
      const content = selectors.content(this.getStore().getState(), { contentRef: this.contentRef });
      const notebook = content && (content as NotebookContentRecord).model.notebook;
      if (!notebook) {
        return undefined;
      }

      const { kernelSpecName } = NotebookUtil.extractNewKernel("", notebook);
      return kernelSpecName || undefined;
    }

    return currentKernelName;
  }

  public getActiveCellTypeStr(): string {
    const content = selectors.content(this.getStore().getState(), { contentRef: this.contentRef });
    return NteractUtil.getCurrentCellType(content as NotebookContentRecord);
  }

  private getCurrentKernelRef(): KernelRef {
    return selectors.kernelRefByContentRef(this.getStore().getState(), { contentRef: this.contentRef });
  }

  private getFocusedCellId(): CellId {
    const content = selectors.content(this.getStore().getState(), { contentRef: this.contentRef });
    if (!content) {
      return undefined;
    }

    return selectors.notebook.cellFocused((content as NotebookContentRecord).model);
  }

  protected getStore(): Store<AppState, AnyAction> {
    return this.notebookClient.getStore();
  }
}
