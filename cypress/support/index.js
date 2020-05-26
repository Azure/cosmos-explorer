let appInsightsLib = require("@microsoft/applicationinsights-web");

const appInsights = new appInsightsLib.ApplicationInsights({
  config: {
    instrumentationKey: "fe61c39f-7d32-4488-a191-b13621965315"
    /* ...Other Configuration Options... */
  }
});

appInsights.loadAppInsights();

Cypress.on("fail", (error, runnable) => {
    // App Insights will record the fail tests for Create Collection
    let message = JSON.stringify(runnable.title);
    appInsights.trackTrace({
      message: `${message}`,
      properties: {
        passed: false,
        error: error
      }
    });
    throw error; // throw error to have test still fail
});