import CassandraAddCollectionPaneTemplate from "./CassandraAddCollectionPane.html";
export class PaneComponent {
  constructor(data: any) {
    return data.data;
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
