// 1. Click on "New Container" on the command bar.
// 2. Pane with the title "Add Container" should appear on the right side of the screen
// 3. It includes an input box for the database Id.
// 4. It includes a checkbox called "Create now".
// 5. When the checkbox is marked, enter new database id.
// 3. Create a database WITH "Provision throughput" checked.
// 4. Enter minimum throughput value of 400.
// 5. Enter container id to the container id text box.
// 6. Enter partition key to the partition key text box.
// 7. Click "OK" to create a new container.
// 8. Verify the new container is created along with the database id and should appead in the Data Explorer list in the left side of the screen.

let crypt = require("crypto");

context("Emulator - createDatabase", () => {
  beforeEach(() => {
    cy.visit("http://localhost:1234/explorer.html");
  });

  const dbId = `TestDatabase${crypt.randomBytes(8).toString("hex")}`;
  const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
  const collectionIdTitle = `Add Collection`;
  const partitionKey = `PartitionKey${crypt.randomBytes(8).toString("hex")}`;

  it("Create a new collection", () => {
    cy.contains("New Container").click();

    // cy.contains(collectionIdTitle);

    cy.get(".createNewDatabaseOrUseExisting")
      .should("have.length", 2)
      .and(input => {
        expect(input.get(0).textContent, "first item").contains("Create new");
        expect(input.get(1).textContent, "second item").contains("Use existing");
      });

    cy.get('input[data-test="addCollection-createNewDatabase"]').check();

    cy.get('input[data-test="addCollection-newDatabaseId"]').type(dbId);

    cy.get('input[data-test="addCollection-collectionId"]').type(collectionId);

    cy.get('input[data-test="databaseThroughputValue"]').should("have.value", "400");

    cy.get('input[data-test="addCollection-partitionKeyValue"]').type(partitionKey);

    cy.get('input[data-test="addCollection-createCollection"]').click();

    cy.get('div[data-test="resourceTreeId"]').should("exist");

    cy.get('div[data-test="resourceTree-collectionsTree"]').should("contain", dbId);

    cy.get('div[data-test="databaseList"]').should("contain", collectionId);
  });
});
