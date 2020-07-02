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

const connectionString = require("../../../utilities/connectionString");

let crypt = require("crypto");

context("Cassandra API Test - createDatabase", () => {
  beforeEach(() => {
    connectionString.loginUsingConnectionString(connectionString.constants.cassandra);
  });

  it("Create a new table in Cassandra API", () => {
    const keyspaceId = `KeyspaceId${crypt.randomBytes(8).toString("hex")}`;
    const tableId = `TableId112`;

    cy.get("iframe").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body)
        .find('div[class="commandBarContainer"]')
        .should("be.visible")
        .find('button[data-test="New Table"]')
        .should("be.visible")
        .click();

      cy.wrap($body).find('div[class="contextual-pane-in"]').should("be.visible").find('span[id="containerTitle"]');

      cy.wrap($body).find('input[id="keyspace-id"]').should("be.visible").type(keyspaceId);

      cy.wrap($body).find('input[class="textfontclr"]').type(tableId);

      cy.wrap($body).find('input[data-test="databaseThroughputValue"]').should("have.value", "400");

      cy.wrap($body).find('data-test="addCollection-createCollection"').click();

      cy.wait(10000);

      cy.wrap($body)
        .find('div[data-test="resourceTreeId"]')
        .should("exist")
        .find('div[class="treeComponent dataResourceTree"]')
        .should("contain", tableId);
    });
  });
});
