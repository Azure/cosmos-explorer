import { ApplicationInsights } from "@microsoft/applicationinsights-web";

// TODO: Remove this after 06/01/21.
// This points to an old app insights instance that is difficult to access
// For now we are sending data to two instances of app insights
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: "fa645d97-6237-4656-9559-0ee0cb55ee49",
    disableFetchTracking: false,
    disableCorrelationHeaders: true,
  },
});

const appInsights2 = new ApplicationInsights({
  config: {
    instrumentationKey: "023d2c39-8f86-468e-bb8f-bcaebd9025c7",
    disableFetchTracking: false,
    disableCorrelationHeaders: true,
  },
});

appInsights.loadAppInsights();
appInsights.trackPageView();
appInsights2.loadAppInsights();
appInsights2.trackPageView();

const trackEvent: typeof appInsights.trackEvent = (...args) => {
  appInsights.trackEvent(...args);
  appInsights2.trackEvent(...args);
};

const startTrackEvent: typeof appInsights.startTrackEvent = (...args) => {
  appInsights.startTrackEvent(...args);
  appInsights2.startTrackEvent(...args);
};

const stopTrackEvent: typeof appInsights.stopTrackEvent = (...args) => {
  appInsights.stopTrackEvent(...args);
  appInsights2.stopTrackEvent(...args);
};

const trackTrace: typeof appInsights.trackTrace = (...args) => {
  appInsights.trackTrace(...args);
  appInsights2.trackTrace(...args);
};

export { trackEvent, startTrackEvent, stopTrackEvent, trackTrace };
