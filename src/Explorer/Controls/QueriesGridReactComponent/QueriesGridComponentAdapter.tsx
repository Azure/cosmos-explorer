/**
 * This adapter is responsible to render the QueriesGrid React component
 * If the component signals a change through the callback passed in the properties, it must render the React component when appropriate
 * and update any knockout observables passed from the parent.
 */
import * as ko from "knockout";
import * as React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import { QueriesGridComponent, QueriesGridComponentProps } from "./QueriesGridComponent";
import { ReactAdapter } from "../../../Bindings/ReactBindingHandler";
import Explorer from "../../Explorer";

export class QueriesGridComponentAdapter implements ReactAdapter {
  public parameters: ko.Observable<number>;

  constructor(private container: Explorer) {
    this.parameters = ko.observable<number>(Date.now());
  }

  public renderComponent(): JSX.Element {
    const props: QueriesGridComponentProps = {
      queriesClient: this.container.queriesClient,
      onQuerySelect: this.container.browseQueriesPane.loadSavedQuery,
      containerVisible: this.container.browseQueriesPane.visible(),
      saveQueryEnabled: this.container.canSaveQueries()
    };
    return <QueriesGridComponent {...props} />;
  }

  public forceRender(): void {
    window.requestAnimationFrame(() => this.parameters(Date.now()));
  }
}
