import AddCollectionPaneTemplate from "./AddCollectionPane.html";
import AddDatabasePaneTemplate from "./AddDatabasePane.html";
import CassandraAddCollectionPaneTemplate from "./CassandraAddCollectionPane.html";
import GitHubReposPaneTemplate from "./GitHubReposPane.html";
import GraphNewVertexPaneTemplate from "./GraphNewVertexPane.html";
import GraphStylingPaneTemplate from "./GraphStylingPane.html";
import SetupNotebooksPaneTemplate from "./SetupNotebooksPane.html";
import StringInputPaneTemplate from "./StringInputPane.html";
import TableAddEntityPaneTemplate from "./Tables/TableAddEntityPane.html";
import TableEditEntityPaneTemplate from "./Tables/TableEditEntityPane.html";
import TableQuerySelectPaneTemplate from "./Tables/TableQuerySelectPane.html";

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
