// THIS ADDS A NEW NOTEBOOK TO YOUR NOTEBOOKS
context("New Notebook smoke test", () => {
  const timeout = 15000; // in ms
  const explorerUrl =
    "https://localhost:1234/explorer.html?feature.notebookserverurl=https%3A%2F%2Flocalhost%3A10001%2F12345%2Fnotebook&feature.notebookServerToken=token&feature.enablenotebooks=true";

  /**
   * Wait for UI to be ready
   */
  const waitForReady = () => {
    cy.get(".splashScreenContainer", { timeout }).should("be.visible");
  };

  beforeEach(() => {
    cy.visit(explorerUrl);
    waitForReady();
  });

  it("Create a new notebook and run some code", () => {
    // Create new notebook
    cy.contains("New Notebook").click();

    // Check tab name
    cy.get("li.tabList .tabNavText").should($span => {
      const text = $span.text();
      expect(text).to.match(/^Untitled.*\.ipynb$/);
    });

    // Wait for python3 | idle status
    cy.get('[data-test="notebookStatusBar"] [data-test="kernelStatus"]', { timeout }).should($p => {
      const text = $p.text();
      expect(text).to.match(/^python3.*idle$/);
    });

    // Click on a cell
    cy.get(".cell-container")
      .as("cellContainer")
      .click();

    // Type in some code
    cy.get("@cellContainer").type("2+4");

    // Execute
    cy.get('[data-test="Run"]')
      .first()
      .click();

    // Verify results
    cy.get("@cellContainer").within(() => {
      cy.get("pre code span").should("contain", "6");
    });

    // Restart kernel
    cy.get('[data-test="Run"] button')
      .eq(-1)
      .click();
    cy.get("li")
      .contains("Restart Kernel")
      .click();

    // Wait for python3 | restarting status
    cy.get('[data-test="notebookStatusBar"] [data-test="kernelStatus"]', { timeout }).should($p => {
      const text = $p.text();
      expect(text).to.match(/^python3.*restarting$/);
    });

    // Wait for python3 | idle status
    cy.get('[data-test="notebookStatusBar"] [data-test="kernelStatus"]', { timeout }).should($p => {
      const text = $p.text();
      expect(text).to.match(/^python3.*idle$/);
    });

    // Click on a cell
    cy.get(".cell-container")
      .as("cellContainer")
      .find(".input")
      .as("codeInput")
      .click();

    // Type in some code
    cy.get("@codeInput").type("{backspace}{backspace}{backspace}4+5");

    // Execute
    cy.get('[data-test="Run"]')
      .first()
      .click();

    // Verify results
    cy.get("@cellContainer").within(() => {
      cy.get("pre code span").should("contain", "9");
    });
  });
});
