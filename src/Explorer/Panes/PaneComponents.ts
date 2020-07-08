import AddDatabasePaneTemplate from "./AddDatabasePane.html";
import AddCollectionPaneTemplate from "./AddCollectionPane.html";
import DeleteCollectionConfirmationPaneTemplate from "./DeleteCollectionConfirmationPane.html";
import DeleteDatabaseConfirmationPaneTemplate from "./DeleteDatabaseConfirmationPane.html";
import GraphNewVertexPaneTemplate from "./GraphNewVertexPane.html";
import GraphStylingPaneTemplate from "./GraphStylingPane.html";
import TableAddEntityPaneTemplate from "./Tables/TableAddEntityPane.html";
import TableEditEntityPaneTemplate from "./Tables/TableEditEntityPane.html";
import TableColumnOptionsPaneTemplate from "./Tables/TableColumnOptionsPane.html";
import TableQuerySelectPaneTemplate from "./Tables/TableQuerySelectPane.html";
import CassandraAddCollectionPaneTemplate from "./CassandraAddCollectionPane.html";
import SettingsPaneTemplate from "./SettingsPane.html";
import ExecuteSprocParamsPaneTemplate from "./ExecuteSprocParamsPane.html";
import RenewAdHocAccessPaneTemplate from "./RenewAdHocAccessPane.html";
import UploadItemsPaneTemplate from "./UploadItemsPane.html";
import LoadQueryPaneTemplate from "./LoadQueryPane.html";
import SaveQueryPaneTemplate from "./SaveQueryPane.html";
import BrowseQueriesPaneTemplate from "./BrowseQueriesPane.html";
import UploadFilePaneTemplate from "./UploadFilePane.html";
import StringInputPaneTemplate from "./StringInputPane.html";
import SetupNotebooksPaneTemplate from "./SetupNotebooksPane.html";
import LibraryManagePaneTemplate from "./LibraryManagePane.html";
import ClusterLibraryPaneTemplate from "./ClusterLibraryPane.html";
import GitHubReposPaneTemplate from "./GitHubReposPane.html";

export class PaneComponent {
  constructor(data: any) {
    return data.data;
  }
}

export class AddDatabasePaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: AddDatabasePaneTemplate
    };
  }
}

export class AddCollectionPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: AddCollectionPaneTemplate
    };
  }
}

export class DeleteCollectionConfirmationPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: DeleteCollectionConfirmationPaneTemplate
    };
  }
}

export class DeleteDatabaseConfirmationPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: DeleteDatabaseConfirmationPaneTemplate
    };
  }
}

export class GraphNewVertexPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: GraphNewVertexPaneTemplate
    };
  }
}

export class GraphStylingPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: GraphStylingPaneTemplate
    };
  }
}

export class TableAddEntityPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableAddEntityPaneTemplate
    };
  }
}

export class TableEditEntityPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableEditEntityPaneTemplate
    };
  }
}

export class TableColumnOptionsPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableColumnOptionsPaneTemplate
    };
  }
}

export class TableQuerySelectPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: TableQuerySelectPaneTemplate
    };
  }
}

export class CassandraAddCollectionPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: CassandraAddCollectionPaneTemplate
    };
  }
}

export class SettingsPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: SettingsPaneTemplate
    };
  }
}

export class ExecuteSprocParamsComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: ExecuteSprocParamsPaneTemplate
    };
  }
}

export class RenewAdHocAccessPane {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: RenewAdHocAccessPaneTemplate
    };
  }
}

export class UploadItemsPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: UploadItemsPaneTemplate
    };
  }
}

export class LoadQueryPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: LoadQueryPaneTemplate
    };
  }
}

export class SaveQueryPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: SaveQueryPaneTemplate
    };
  }
}

export class BrowseQueriesPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: BrowseQueriesPaneTemplate
    };
  }
}

export class UploadFilePaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: UploadFilePaneTemplate
    };
  }
}

export class StringInputPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: StringInputPaneTemplate
    };
  }
}

export class SetupNotebooksPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: SetupNotebooksPaneTemplate
    };
  }
}

export class LibraryManagePaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: LibraryManagePaneTemplate
    };
  }
}

export class ClusterLibraryPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: ClusterLibraryPaneTemplate
    };
  }
}

export class GitHubReposPaneComponent {
  constructor() {
    return {
      viewModel: PaneComponent,
      template: GitHubReposPaneTemplate
    };
  }
}
