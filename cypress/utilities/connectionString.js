module.exports = {
  loginUsingConnectionString: function(api) {
    const prodUrl = "https://cosmos.azure.com/";
    const timeout = 15000;

    cy.visit(prodUrl);
    cy.get('iframe[id="explorerMenu"]').should("be.visible");

    cy.get("iframe").then($element => {
      const $body = $element.contents().find("body");

      cy.wrap($body)
        .find("#connectExplorer")
        .should("exist")
        .find("div[class='connectExplorer']")
        .should("exist")
        .find("p[class='welcomeText']")
        .should("exist");

      cy.wrap($body.find("div > p.switchConnectTypeText"))
        .should("exist")
        .last()
        .click({ force: true });

      const secret = Cypress.env(`CONNECTION_STRING_${api && api.toUpperCase()}`);
      console.log(secret && secret.length);
      console.log(secret);

      cy.wrap($body)
        .find("input[class='inputToken']")
        .should("exist")
        .type(secret, {
          force: true
        });

      cy.wrap($body.find("input[value='Connect']"), { timeout })
        .first()
        .click({ force: true });

      cy.wait(15000);

      cy.wrap($body)
        .find(".connectExplorer > p:nth-child(3)")
        .should("be.visible");
    });
  },
  constants: {
    sql: "sql",
    mongo: "mongo",
    table: "table",
    graph: "graph",
    cassandra: "cassandra"
  }
};
