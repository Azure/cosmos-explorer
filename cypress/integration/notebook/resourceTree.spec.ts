context("Resource tree notebook file manipulation", () => {
  const timeout = 15000; // in ms
  const explorerUrl =
    "https://localhost:1234/explorer.html?feature.notebookserverurl=https%3A%2F%2Flocalhost%3A10001%2F12345%2Fnotebook&feature.notebookServerToken=token&feature.enablenotebooks=true";

  /**
   * Wait for UI to be ready
   */
  const waitForReady = () => {
    cy.get(".splashScreenContainer", { timeout }).should("be.visible");
  };

  const clickContextMenuAndSelectOption = (nodeLabel, option) => {
    cy.get(`.treeNodeHeader[data-test="${nodeLabel}"]`)
      .find("button.treeMenuEllipsis")
      .click();
    cy.get('[data-test="treeComponentMenuItemContainer"]')
      .contains(option)
      .click();
  };

  const createFolder = folder => {
    clickContextMenuAndSelectOption("My Notebooks/", "New Directory");

    cy.get("#stringInputPane").within(() => {
      cy.get('input[name="collectionIdConfirmation"]').type(folder);
      cy.get("form").submit();
    });
  };

  const deleteItem = nodeName => {
    clickContextMenuAndSelectOption(`${nodeName}`, "Delete");
    cy.get(".ms-Dialog-main")
      .contains("Delete")
      .click();
  };

  beforeEach(() => {
    cy.visit(explorerUrl);
    waitForReady();
  });

  it("Create and remove a directory", () => {
    const folder = "e2etest_folder1";
    createFolder(folder);
    cy.get(`.treeNodeHeader[data-test="${folder}/"]`).should("exist");
    deleteItem(`${folder}/`);
    cy.get(`.treeNodeHeader[data-test="${folder}/"]`).should("not.exist");
  });

  it("Create and rename a directory", () => {
    const folder = "e2etest_folder2";
    const renamedFolder = "e2etest_folder2_renamed";
    createFolder(folder);

    // Rename
    clickContextMenuAndSelectOption(`${folder}/`, "Rename");
    cy.get("#stringInputPane").within(() => {
      cy.get('input[name="collectionIdConfirmation"]')
        .clear()
        .type(renamedFolder);
      cy.get("form").submit();
    });
    cy.get(`.treeNodeHeader[data-test="${renamedFolder}/"]`).should("exist");
    cy.get(`.treeNodeHeader[data-test="${folder}/"]`).should("not.exist");

    deleteItem(`${renamedFolder}/`);
    cy.get(`.treeNodeHeader[data-test="${renamedFolder}/"]`).should("not.exist");
  });

  it("Create a notebook inside a directory", () => {
    const folder = "e2etest_folder3";
    const newNotebookName = "Untitled.ipynb";
    createFolder(folder);
    clickContextMenuAndSelectOption(`${folder}/`, "New Notebook");

    // Verify tab is open
    cy.get(".tabList")
      .contains(newNotebookName)
      .should("exist");

    // Close tab
    cy.get(`.tabList[title="notebooks/${folder}/${newNotebookName}"]`)
      .find(".cancelButton")
      .click();
    // When running from command line, closing the tab is too fast
    cy.get("body").then($body => {
      if ($body.find(".ms-Dialog-main").length) {
        // For some reason, this does not work
        // cy.get(".ms-Dialog-main").contains("Close").click();
        cy.get(".ms-Dialog-main .ms-Button--primary").click();
      }
    });

    // Expand folder node
    cy.get(`.treeNodeHeader[data-test="${folder}/"]`).click();
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${newNotebookName}"]`).should("exist");

    // Delete notebook
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${newNotebookName}"]`)
      .find("button.treeMenuEllipsis")
      .click();
    cy.get('[data-test="treeComponentMenuItemContainer"]')
      .contains("Delete")
      .click();

    // Confirm
    cy.get(".ms-Dialog-main")
      .contains("Delete")
      .click();
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${newNotebookName}"]`).should("not.exist");

    deleteItem(`${folder}/`);
  });

  it("Create and rename a notebook inside a directory", () => {
    const folder = "e2etest_folder4";
    const newNotebookName = "Untitled.ipynb";
    const renamedNotebookName = "mynotebook.ipynb";
    createFolder(folder);
    clickContextMenuAndSelectOption(`${folder}/`, "New Notebook");

    // Close tab
    cy.get(`.tabList[title="notebooks/${folder}/${newNotebookName}"]`)
      .find(".cancelButton")
      .click();
    cy.get("body").then($body => {
      if ($body.find(".ms-Dialog-main").length) {
        // For some reason, this does not work
        // cy.get(".ms-Dialog-main").contains("Close").click();
        cy.get(".ms-Dialog-main .ms-Button--primary").click();
      }
    });

    // Expand folder node
    cy.get(`.treeNodeHeader[data-test="${folder}/"]`).click();
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${newNotebookName}"]`).should("exist");

    // Rename notebook
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${newNotebookName}"]`)
      .find("button.treeMenuEllipsis")
      .click();
    cy.get('[data-test="treeComponentMenuItemContainer"]')
      .contains("Rename")
      .click();

    cy.get("#stringInputPane").within(() => {
      cy.get('input[name="collectionIdConfirmation"]')
        .clear()
        .type(renamedNotebookName);
      cy.get("form").submit();
    });
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${newNotebookName}"]`).should("not.exist");
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${renamedNotebookName}"]`).should("exist");

    // Delete notebook
    cy.get(`.nodeChildren[data-test="${folder}/"] .treeNodeHeader[data-test="${renamedNotebookName}"]`)
      .find("button.treeMenuEllipsis")
      .click();
    cy.get('[data-test="treeComponentMenuItemContainer"]')
      .contains("Delete")
      .click();

    // Confirm
    cy.get(".ms-Dialog-main")
      .contains("Delete")
      .click();
    // Give it time to settle
    cy.wait(1000);
    deleteItem(`${folder}/`);
  });
});
