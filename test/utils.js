let client;
const appInsightsKey = process.env.PORTAL_RUNNER_APP_INSIGHTS_KEY;
if (!appInsightsKey) {
  console.warn(`PORTAL_RUNNER_APP_INSIGHTS_KEY env var not set. Runner telemetry will not be reported`);
} else {
  const appInsights = require("applicationinsights");
  appInsights.setup(process.env.PORTAL_RUNNER_APP_INSIGHTS_KEY).start();
  client = appInsights.defaultClient;
}

module.exports.trackEvent = (...args) => {
  if (client) {
    client.trackEvent(...args);
  }
};

module.exports.trackException = exception => {
  if (client) {
    client.trackException({ exception });
  }
};
