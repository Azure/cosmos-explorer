// 1. Click last database in the resource tree
// 2. Select the context menu within the database
// 4. Select "Delete Database" option in the dropdown
// 5. On Selection, Delete Database pane opens on the right side
// 6. Enter the same database id that is to be deleted and click ok
// 7. Now, the resource tree refreshes, the deleted database should not appear in the resource tree

let crypt = require("crypto");

context("Emulator - deleteDatabase", () => {
  beforeEach(() => {
    const dbId = `TestDatabase${crypt.randomBytes(8).toString("hex")}`;
    const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
    let db_rid = "";
    const date = new Date().toUTCString();
    let authToken = "";
    cy.visit("http://localhost:1234/explorer.html");

    // Creating auth token for collection creation
    cy.request({
      method: "GET",
      url: "https://localhost:8081/_explorer/authorization/post/dbs/",
      headers: {
        "x-ms-date": date,
        authorization: "-"
      }
    })
      .then(response => {
        authToken = response.body.Token; // Getting auth token for collection creation
        return new Cypress.Promise((resolve, reject) => {
          return resolve();
        });
      })
      .then(() => {
        cy.request({
          method: "POST",
          url: "https://localhost:8081/dbs",
          headers: {
            "x-ms-date": date,
            authorization: authToken,
            "x-ms-version": "2018-12-31"
          },
          body: {
            id: dbId
          }
        }).then(response => {
          cy.log("Response", response);
          db_rid = response.body._rid;
          return new Cypress.Promise((resolve, reject) => {
            cy.log("Rid", db_rid);
            return resolve();
          });
        });
      });
  });

  it("Delete a database", () => {
    cy.get('span[data-test="refreshTree"]').click();

    cy.get(".databaseId")
      .last()
      .then($id => {
        const dbId = $id.text();

        cy.get('span[data-test="databaseEllipsisMenu"]').should("exist");

        cy.get('span[data-test="databaseEllipsisMenu"]')
          .invoke("show")
          .last()
          .click();

        cy.get('div[data-test="databaseContextMenu"]')
          .contains("Delete Database")
          .click({ force: true });

        cy.get('input[data-test="confirmDatabaseId"]').type(dbId.trim());

        cy.get('input[data-test="deleteDatabase"]').click();

        cy.get('div[data-test="databaseList"]').should("not.contain", dbId);
      });
  });
});
