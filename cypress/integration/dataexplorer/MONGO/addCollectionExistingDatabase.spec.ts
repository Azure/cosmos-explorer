const connectionString = require("../../../utilities/connectionString");

let crypt = require("crypto");

context("Mongo API Test", () => {
  beforeEach(() => {
    connectionString.loginUsingConnectionString();
  });

  it.skip("Create a new collection in existing database in Mongo API", () => {
    const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
    const sharedKey = `SharedKey${crypt.randomBytes(8).toString("hex")}`;

    cy.get("iframe").then(($element) => {
      const $body = $element.contents().find("body");

      cy.wrap($body)
        .find('span[class="nodeLabel"]')
        .should("be.visible")
        .then(($span) => {
          const dbId1 = $span.text();
          cy.log("DBBB", dbId1);

          cy.wrap($body)
            .find('div[class="commandBarContainer"]')
            .should("be.visible")
            .find('button[data-test="New Collection"]')
            .should("be.visible")
            .click();

          cy.wrap($body).find('div[class="contextual-pane-in"]').should("be.visible").find('span[id="containerTitle"]');

          cy.wrap($body).find('input[data-test="addCollection-existingDatabase"]').check();

          cy.wrap($body).find('input[data-test="addCollection-existingDatabase"]').type(dbId1);

          cy.wrap($body).find('input[data-test="addCollection-collectionId"]').type(collectionId);

          cy.wrap($body).find('input[data-test="addCollection-partitionKeyValue"]').type(sharedKey);

          cy.wrap($body).find('input[data-test="addCollection-createCollection"]').click();

          cy.wait(10000);

          cy.wrap($body)
            .find('div[data-test="resourceTreeId"]')
            .should("exist")
            .find('div[class="treeComponent dataResourceTree"]')
            .click()
            .should("contain", collectionId);
        });
    });
  });
});
