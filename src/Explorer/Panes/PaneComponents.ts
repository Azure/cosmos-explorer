import AddCollectionPaneTemplate from "./AddCollectionPane.html";
import AddDatabasePaneTemplate from "./AddDatabasePane.html";
import CassandraAddCollectionPaneTemplate from "./CassandraAddCollectionPane.html";
import GitHubReposPaneTemplate from "./GitHubReposPane.html";
import TableAddEntityPaneTemplate from "./Tables/TableAddEntityPane.html";
import TableEditEntityPaneTemplate from "./Tables/TableEditEntityPane.html";

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

export class AddCollectionPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: AddCollectionPaneTemplate,
    };
  }
}

export class TableAddEntityPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableAddEntityPaneTemplate,
    };
  }
}

export class TableEditEntityPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableEditEntityPaneTemplate,
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

export class GitHubReposPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: GitHubReposPaneTemplate,
    };
  }
}
