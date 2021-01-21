import { ApplicationInsights } from "@microsoft/applicationinsights-web";

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: "fa645d97-6237-4656-9559-0ee0cb55ee49",
    disableFetchTracking: false,
    disableCorrelationHeaders: true,
  },
});
appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview

export { appInsights };
