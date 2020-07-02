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

context("Mongo API Test", () => {
  beforeEach(() => {
    connectionString.loginUsingConnectionString();
  });

  it.skip("Create a new collection in Mongo API - Autopilot", () => {
    const dbId = `TestDatabase${crypt.randomBytes(8).toString("hex")}`;
    const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
    const sharedKey = `SharedKey${crypt.randomBytes(8).toString("hex")}`;

    cy.get("iframe").then(($element) => {
      const $body = $element.contents().find("body");
      cy.wrap($body)
        .find('div[class="commandBarContainer"]')
        .should("be.visible")
        .find('button[data-test="New Collection"]')
        .should("be.visible")
        .click();

      cy.wrap($body).find('div[class="contextual-pane-in"]').should("be.visible").find('span[id="containerTitle"]');

      cy.wrap($body).find('input[data-test="addCollection-createNewDatabase"]').check();

      cy.wrap($body).find('input[data-test="addCollection-newDatabaseId"]').type(dbId);

      cy.wrap($body).find('input[data-test="addCollectionPane-databaseSharedThroughput"]').check();

      cy.wrap($body)
        .find('div[class="throughputModeContainer"]')
        .should("be.visible")
        .and((input) => {
          expect(input.get(0).textContent, "first item").contains("Autopilot (preview)");
          expect(input.get(1).textContent, "second item").contains("Manual");
        });

      cy.wrap($body).find('input[id="newContainer-databaseThroughput-autoPilotRadio"]').check();

      cy.wrap($body)
        .find('select[name="autoPilotTiers"]')
        //     .eq(1).should('contain', '4,000 RU/s');
        //    // .select('4,000 RU/s').should('have.value', '1');

        .find('option[value="2"]')
        .then(($element) => $element.get(1).setAttribute("selected", "selected"));

      cy.wrap($body).find('input[data-test="addCollection-collectionId"]').type(collectionId);

      cy.wrap($body).find('input[data-test="addCollection-partitionKeyValue"]').type(sharedKey);

      cy.wrap($body).find('input[data-test="addCollection-createCollection"]').click();

      cy.wait(10000);

      cy.wrap($body)
        .find('div[data-test="resourceTreeId"]')
        .should("exist")
        .find('div[class="treeComponent dataResourceTree"]')
        .should("contain", dbId)
        .click()
        .should("contain", collectionId);
    });
  });
});
