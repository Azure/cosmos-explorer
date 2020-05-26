import DocumentsTabTemplate from "./DocumentsTab.html";
import ConflictsTabTemplate from "./ConflictsTab.html";
import GraphTabTemplate from "./GraphTab.html";
import NotebookTabTemplate from "./NotebookTab.html";
import SparkMasterTabTemplate from "./SparkMasterTab.html";
import NotebookV2TabTemplate from "./NotebookV2Tab.html";
import TerminalTabTemplate from "./TerminalTab.html";
import MongoDocumentsTabTemplate from "./MongoDocumentsTab.html";
import MongoQueryTabTemplate from "./MongoQueryTab.html";
import MongoShellTabTemplate from "./MongoShellTab.html";
import QueryTabTemplate from "./QueryTab.html";
import QueryTablesTabTemplate from "./QueryTablesTab.html";
import SettingsTabTemplate from "./SettingsTab.html";
import DatabaseSettingsTabTemplate from "./DatabaseSettingsTab.html";
import StoredProcedureTabTemplate from "./StoredProcedureTab.html";
import TriggerTabTemplate from "./TriggerTab.html";
import UserDefinedFunctionTabTemplate from "./UserDefinedFunctionTab.html";
import GalleryTabTemplate from "./GalleryTab.html";
import NotebookViewerTabTemplate from "./NotebookViewerTab.html";

export class TabComponent {
  constructor(data: any) {
    return data.data;
  }
}

export class DocumentsTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: DocumentsTabTemplate
    };
  }
}

export class ConflictsTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: ConflictsTabTemplate
    };
  }
}

export class GraphTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: GraphTabTemplate
    };
  }
}

export class NotebookTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: NotebookTabTemplate
    };
  }
}

export class SparkMasterTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: SparkMasterTabTemplate
    };
  }
}

export class NotebookV2Tab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: NotebookV2TabTemplate
    };
  }
}

export class TerminalTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: TerminalTabTemplate
    };
  }
}

export class MongoDocumentsTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: MongoDocumentsTabTemplate
    };
  }
}

export class MongoQueryTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: MongoQueryTabTemplate
    };
  }
}

export class MongoShellTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: MongoShellTabTemplate
    };
  }
}

export class QueryTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: QueryTabTemplate
    };
  }
}

export class QueryTablesTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: QueryTablesTabTemplate
    };
  }
}

export class SettingsTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: SettingsTabTemplate
    };
  }
}

export class DatabaseSettingsTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: DatabaseSettingsTabTemplate
    };
  }
}

export class StoredProcedureTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: StoredProcedureTabTemplate
    };
  }
}

export class TriggerTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: TriggerTabTemplate
    };
  }
}

export class UserDefinedFunctionTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: UserDefinedFunctionTabTemplate
    };
  }
}

export class GalleryTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: GalleryTabTemplate
    };
  }
}

export class NotebookViewerTab {
  constructor() {
    return {
      viewModel: TabComponent,
      template: NotebookViewerTabTemplate
    };
  }
}
