import AddCollectionPaneTemplate from "./AddCollectionPane.html";
import AddDatabasePaneTemplate from "./AddDatabasePane.html";
import BrowseQueriesPaneTemplate from "./BrowseQueriesPane.html";
import CassandraAddCollectionPaneTemplate from "./CassandraAddCollectionPane.html";
import DeleteCollectionConfirmationPaneTemplate from "./DeleteCollectionConfirmationPane.html";
import DeleteDatabaseConfirmationPaneTemplate from "./DeleteDatabaseConfirmationPane.html";
import GitHubReposPaneTemplate from "./GitHubReposPane.html";
import GraphNewVertexPaneTemplate from "./GraphNewVertexPane.html";
import GraphStylingPaneTemplate from "./GraphStylingPane.html";
import LoadQueryPaneTemplate from "./LoadQueryPane.html";
import SaveQueryPaneTemplate from "./SaveQueryPane.html";
import SetupNotebooksPaneTemplate from "./SetupNotebooksPane.html";
import StringInputPaneTemplate from "./StringInputPane.html";
import TableAddEntityPaneTemplate from "./Tables/TableAddEntityPane.html";
import TableColumnOptionsPaneTemplate from "./Tables/TableColumnOptionsPane.html";
import TableEditEntityPaneTemplate from "./Tables/TableEditEntityPane.html";
import TableQuerySelectPaneTemplate from "./Tables/TableQuerySelectPane.html";
import UploadFilePaneTemplate from "./UploadFilePane.html";

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

export class DeleteCollectionConfirmationPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: DeleteCollectionConfirmationPaneTemplate,
    };
  }
}

export class DeleteDatabaseConfirmationPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: DeleteDatabaseConfirmationPaneTemplate,
    };
  }
}

export class GraphNewVertexPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: GraphNewVertexPaneTemplate,
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

export class TableColumnOptionsPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableColumnOptionsPaneTemplate,
    };
  }
}

export class TableQuerySelectPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableQuerySelectPaneTemplate,
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

export class LoadQueryPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: LoadQueryPaneTemplate,
    };
  }
}

export class SaveQueryPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: SaveQueryPaneTemplate,
    };
  }
}

export class BrowseQueriesPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: BrowseQueriesPaneTemplate,
    };
  }
}

export class UploadFilePaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: UploadFilePaneTemplate,
    };
  }
}

export class StringInputPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: StringInputPaneTemplate,
    };
  }
}

export class SetupNotebooksPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: SetupNotebooksPaneTemplate,
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
