// 1. Click last database in the resource tree
// 2. Click the last collection within the database
// 3. Select the context menu within the collection
// 4. Select "Delete Container" option in the dropdown
// 5. On Selection, Delete Container pane opens on the right side
// 6. Enter the same collection id that is to be deleted and click ok
// 7. Now, the resource tree refreshes, the deleted collection should not appear under the database

let crypt = require("crypto");

context("Emulator - deleteCollection", () => {
  beforeEach(() => {
    cy.visit("http://localhost:1234/explorer.html");
  });

  it("Delete a collection", () => {
    cy.get(".databaseId")
      .last()
      .click();

    cy.get(".collectionList")
      .last()
      .then($id => {
        const collectionId = $id.text();

        cy.get('span[data-test="collectionEllipsisMenu"]').should("exist");

        cy.get('span[data-test="collectionEllipsisMenu"]')
          .invoke("show")
          .last()
          .click();

        cy.get('div[data-test="collectionContextMenu"]')
          .contains("Delete Container")
          .click({ force: true });

        cy.get('input[data-test="confirmCollectionId"]').type(collectionId.trim());

        cy.get('input[data-test="deleteCollection"]').click();

        cy.get('div[data-test="databaseList"]').should("not.contain", collectionId);

        cy.get('div[data-test="databaseMenu"]').should("not.contain", collectionId);
      });
  });
});
