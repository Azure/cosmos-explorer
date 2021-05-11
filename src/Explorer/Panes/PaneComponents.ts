import AddDatabasePaneTemplate from "./AddDatabasePane.html";
import CassandraAddCollectionPaneTemplate from "./CassandraAddCollectionPane.html";
import GraphStylingPaneTemplate from "./GraphStylingPane.html";

export class PaneComponent {
  constructor(data: any) {
    return data.data;
  }
}

export class AddDatabasePaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: AddDatabasePaneTemplate,
    };
  }
}

export class GraphStylingPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: GraphStylingPaneTemplate,
    };
  }
}

export class CassandraAddCollectionPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: CassandraAddCollectionPaneTemplate,
    };
  }
}
