const connectionString = require("../../../utilities/connectionString");

let crypt = require("crypto");

context("Mongo API Test", () => {
  beforeEach(() => {
    connectionString.loginUsingConnectionString();
  });

  it.skip("Create a new collection in Mongo API - Provision database throughput", () => {
    const dbId = `TestDatabase${crypt.randomBytes(8).toString("hex")}`;
    const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
    const sharedKey = `SharedKey${crypt.randomBytes(8).toString("hex")}`;

    cy.get("iframe").then($element => {
      const $body = $element.contents().find("body");
      cy.wrap($body)
        .find('div[class="commandBarContainer"]')
        .should("be.visible")
        .find('button[data-test="New Collection"]')
        .should("be.visible")
        .click();

      cy.wrap($body)
        .find('div[class="contextual-pane-in"]')
        .should("be.visible")
        .find('span[id="containerTitle"]');

      cy.wrap($body)
        .find(".createNewDatabaseOrUseExisting")
        .should("have.length", 2)
        .and(input => {
          expect(input.get(0).textContent, "first item").contains("Create new");
          expect(input.get(1).textContent, "second item").contains("Use existing");
        });

      cy.wrap($body)
        .find('input[data-test="addCollection-createNewDatabase"]')
        .check();

      cy.wrap($body)
        .find('input[data-test="addCollectionPane-databaseSharedThroughput"]')
        .check();

      cy.wrap($body)
        .find('input[data-test="addCollection-newDatabaseId"]')
        .type(dbId);

      cy.wrap($body)
        .find('input[data-test="addCollectionPane-databaseSharedThroughput"]')
        .check();

      cy.wrap($body)
        .find('input[data-test="databaseThroughputValue"]')
        .should("have.value", "400");

      cy.wrap($body)
        .find('input[data-test="addCollection-collectionId"]')
        .type(collectionId);

      cy.wrap($body)
        .find('input[data-test="addCollection-partitionKeyValue"]')
        .type(sharedKey);

      cy.wrap($body)
        .find('input[data-test="addCollection-createCollection"]')
        .click();

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

  it("Create a new collection - without provision database throughput", () => {
    const dbId = `TestDatabase${crypt.randomBytes(8).toString("hex")}`;
    const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
    const collectionIdTitle = `Add Collection`;
    const sharedKey = `SharedKey${crypt.randomBytes(8).toString("hex")}`;

    cy.get("iframe").then($element => {
      const $body = $element.contents().find("body");
      cy.wrap($body)
        .find('div[class="commandBarContainer"]')
        .should("be.visible")
        .find('button[data-test="New Collection"]')
        .should("be.visible")
        .click();

      cy.wrap($body)
        .find('div[class="contextual-pane-in"]')
        .should("be.visible")
        .find('span[id="containerTitle"]');

      cy.wrap($body)
        .find('input[data-test="addCollection-createNewDatabase"]')
        .check();

      cy.wrap($body)
        .find('input[data-test="addCollection-newDatabaseId"]')
        .type(dbId);

      cy.wrap($body)
        .find('input[data-test="addCollectionPane-databaseSharedThroughput"]')
        .uncheck();

      cy.wrap($body)
        .find('input[data-test="addCollection-collectionId"]')
        .type(collectionId);

      cy.wrap($body)
        .find('input[id="tab2"]')
        .check({ force: true });

      cy.wrap($body)
        .find('input[data-test="addCollection-partitionKeyValue"]')
        .type(sharedKey);

      cy.wrap($body)
        .find('input[data-test="databaseThroughputValue"]')
        .should("have.value", "400");

      cy.wrap($body)
        .find('input[data-test="addCollection-createCollection"]')
        .click();

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

  it("Create a new collection - without provision database throughput Fixed Storage Capacity", () => {
    const dbId = `TestDatabase${crypt.randomBytes(8).toString("hex")}`;
    const collectionId = `TestCollection${crypt.randomBytes(8).toString("hex")}`;
    const sharedKey = `SharedKey${crypt.randomBytes(8).toString("hex")}`;

    cy.get("iframe").then($element => {
      const $body = $element.contents().find("body");
      cy.wrap($body)
        .find('div[class="commandBarContainer"]')
        .should("be.visible")
        .find('button[data-test="New Collection"]')
        .should("be.visible")
        .click();

      cy.wrap($body)
        .find('div[class="contextual-pane-in"]')
        .should("be.visible")
        .find('span[id="containerTitle"]');

      cy.wrap($body)
        .find('input[data-test="addCollection-createNewDatabase"]')
        .check();

      cy.wrap($body)
        .find('input[data-test="addCollection-newDatabaseId"]')
        .type(dbId);

      cy.wrap($body)
        .find('input[data-test="addCollectionPane-databaseSharedThroughput"]')
        .uncheck();

      cy.wrap($body)
        .find('input[data-test="addCollection-collectionId"]')
        .type(collectionId);

      cy.wrap($body)
        .find('input[id="tab1"]')
        .check({ force: true });

      cy.wrap($body)
        .find('input[data-test="databaseThroughputValue"]')
        .should("have.value", "400");

      cy.wrap($body)
        .find('input[data-test="addCollection-createCollection"]')
        .click();

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
