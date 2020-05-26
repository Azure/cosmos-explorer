import resourceTreeTemplate from "./ResourceTree.html";
import databaseTreeNoteTemplate from "./DatabaseTreeNode.html";
import collectionTreeNodeTemplate from "./CollectionTreeNode.html";
import storedProcedureTreeNodeTemplate from "./StoredProcedureTreeNode.html";
import userDefinedFunctionTreeNodeTemplate from "./UserDefinedFunctionTreeNode.html";
import triggerTreeNodeTemplate from "./TriggerTreeNode.html";
import collectionTreeNodeContextMenuTemplate from "./CollectionTreeNodeContextMenu.html";

export class TreeNodeComponent {
  constructor(data: any) {
    return data.data;
  }
}

export class ResourceTree {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: resourceTreeTemplate
    };
  }
}

export class DatabaseTreeNode {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: databaseTreeNoteTemplate
    };
  }
}

export class CollectionTreeNode {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: collectionTreeNodeTemplate
    };
  }
}

export class StoredProcedureTreeNode {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: storedProcedureTreeNodeTemplate
    };
  }
}

export class UserDefinedFunctionTreeNode {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: userDefinedFunctionTreeNodeTemplate
    };
  }
}

export class TriggerTreeNode {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: triggerTreeNodeTemplate
    };
  }
}

export class CollectionTreeNodeContextMenu {
  constructor() {
    return {
      viewModel: TreeNodeComponent,
      template: collectionTreeNodeContextMenuTemplate
    };
  }
}
