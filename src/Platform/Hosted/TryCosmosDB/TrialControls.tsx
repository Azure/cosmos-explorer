import { CommandButton } from "@fluentui/react";
import { Keys, t } from "Localization";
import * as React from "react";
import { useTrialManagement } from "./useTrialManagement";

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return t(Keys.tryCosmosDB.expired);
  }
  if (seconds < 60) {
    return t(Keys.tryCosmosDB.lessThanMinute);
  }
  const minutes = Math.ceil(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return hours % 24
      ? t(Keys.tryCosmosDB.daysAndHours, { days, hours: hours % 24 })
      : t(Keys.tryCosmosDB.days, { count: days });
  }
  if (hours > 0) {
    return minutes % 60
      ? t(Keys.tryCosmosDB.hoursAndMinutes, { hours, minutes: minutes % 60 })
      : t(Keys.tryCosmosDB.hours, { count: hours });
  }
  return t(Keys.tryCosmosDB.minutes, { count: minutes });
}

export function TrialControls({ management }: { management: ReturnType<typeof useTrialManagement> }) {
  const [, setClockTick] = React.useState(0);
  const expiresAt = React.useMemo(
    () => (management.resource ? Date.now() + management.resource.timeLeftInSeconds * 1000 : 0),
    [management.resource],
  );
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  React.useEffect(() => {
    if (!management.resource) {
      return undefined;
    }
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 60000);
    return () => window.clearInterval(timer);
  }, [management.resource]);
  if (!management.resource && !management.error) {
    return null;
  }
  return (
    <div className="trialControls">
      {management.resource && (
        <>
          <span className="trialTimeRemaining">
            {t(Keys.tryCosmosDB.timeRemaining, { time: formatTimeRemaining(remainingSeconds) })}
          </span>
          <CommandButton
            text={t(Keys.tryCosmosDB.extend)}
            ariaLabel={t(Keys.tryCosmosDB.extendSandbox)}
            role="button"
            href={management.portalUrl}
            target={management.portalUrl ? "_blank" : undefined}
            rel={management.portalUrl ? "noopener noreferrer" : undefined}
            title={management.portalUrl ? t(Keys.tryCosmosDB.extendInPortal) : undefined}
            disabled={management.pending || remainingSeconds <= 0}
            onClick={() => {
              if (management.portalUrl) {
                management.handoff();
              } else {
                void management.extend();
              }
            }}
          />
        </>
      )}
      {management.error && (
        <CommandButton
          text={t(Keys.common.retry)}
          ariaLabel={t(Keys.tryCosmosDB.retryStatus)}
          disabled={management.loading || management.pending}
          title={management.error}
          onClick={management.retry}
        />
      )}
      <span className="screenReaderOnly" role="status">
        {management.pending ? t(Keys.tryCosmosDB.operationInProgress) : management.error}
      </span>
    </div>
  );
}
