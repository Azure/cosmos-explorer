module.exports = {
  loginUsingConnectionString: function() {
    const prodUrl = Cypress.env("TEST_ENDPOINT") || "https://localhost:1234/hostedExplorer.html";
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

      const secret = Cypress.env("CONNECTION_STRING");

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
    });
  }
};
