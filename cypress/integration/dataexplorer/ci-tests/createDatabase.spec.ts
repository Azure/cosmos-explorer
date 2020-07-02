// 1. Click on "New Database" on the command bar
// 2. a Pane with the title "Add Database" should appear on the right side of the screen
//     i. It includes an input box for the database Id.
//     ii. It includes a checkbox called "Provision throughput".
//     iii. Whe the checkbox is marked, a new input with a throughput control let's you customize RU at the database level
// 3. Create a database WITHOUT "Provision throughput" checked.
// 4. It should appear in the Data Explorer list.
// 5. Repeat steps 1-3 but create a database WITH "Provision throughput" with the default RU value.
// 6. It should appear in the Data Explorer list.
// 7. If expanded, it should have the list item called "Scale", that once clicked, it should show the "Scale" tab.
// 8. Inside that tab, a throughput control will let you change the RU value within the permited range.
// 9. If you change the value, it should enable the "Save" button.
// 10. Click "Save" and verify that the process completes without error.
// 11. Close the tab and reopen it and verify that the input contains the last saved value.%

const crypto = require("crypto");
const client = require("../../../utilities/cosmosClient");
const randomString = crypto.randomBytes(2).toString("hex");
const databaseId = `TestDB-${randomString}`;
const collectionId = `TestColl-${randomString}`;

context("Emulator - Create database -> container -> item", () => {
  beforeEach(async () => {
    const { resources } = await client.databases.readAll().fetchAll();
    for (const database of resources) {
      await client.database(database.id).delete();
    }
  });

  it("creates a new database", () => {
    cy.visit("https://0.0.0.0:1234/explorer.html?platform=Emulator");
    cy.contains("New Container").click();
    cy.get("[data-test=addCollection-newDatabaseId]").click();
    cy.get("[data-test=addCollection-newDatabaseId]").type(databaseId);
    cy.get("[data-test=addCollection-collectionId]").click();
    cy.get("[data-test=addCollection-collectionId]").type(collectionId);
    cy.get("[data-test=addCollection-partitionKeyValue]").click();
    cy.get("[data-test=addCollection-partitionKeyValue]").type("/pk");
    cy.get('input[name="createCollection"]').click();
    cy.get(".dataResourceTree").should("contain", databaseId);
    cy.get(".dataResourceTree").contains(databaseId).click();
    cy.get(".dataResourceTree").should("contain", collectionId);
    cy.get(".dataResourceTree").contains(collectionId).click();
    cy.get(".dataResourceTree").contains("Items").click();
    cy.get(".dataResourceTree").contains("Items").click();
    cy.wait(1000); // React rendering inside KO causes some weird async rendering that makes this test flaky without waiting
    cy.get(".commandBarContainer").contains("New Item").click();
    cy.wait(1000); // React rendering inside KO causes some weird async rendering that makes this test flaky without waiting
    cy.get(".commandBarContainer").contains("Save").click();
    cy.wait(1000); // React rendering inside KO causes some weird async rendering that makes this test flaky without waiting
    cy.get(".documentsGridHeaderContainer").should("contain", "replace_with_new_document_id");
  });
});
