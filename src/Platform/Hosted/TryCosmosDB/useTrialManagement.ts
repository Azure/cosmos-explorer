import * as React from "react";
import { Keys, t } from "Localization";
import { extractMasterKeyFromDirectLoginConnectionString } from "../HostedUtils";
import {
  fetchTrialDetection,
  isTrialOwnerAuth,
  extendTrial,
  trialExtensionUrl,
  TrialOperationError,
  TrialOwnerAuth,
  TrialResource,
} from "./TryCosmosDB";

interface Options {
  enabled: boolean;
  connectionString?: string;
  accountName?: string;
  backendEndpoint: string;
  ownerAuth?: TrialOwnerAuth;
  onAuthRejected: () => void;
}

export function useTrialManagement(options: Options) {
  const { enabled, accountName, connectionString, backendEndpoint } = options;
  const [resource, setResource] = React.useState<TrialResource>();
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [refresh, setRefresh] = React.useState(0);
  const current = React.useRef(options);
  current.current = options;
  const generation = React.useRef(0);
  const operation = React.useRef(false);
  const handedOff = React.useRef(false);
  const away = React.useRef(false);
  const metadataBusy = React.useRef(false);
  const refreshAfterLoad = React.useRef(false);

  React.useEffect(() => {
    const sessionGeneration = ++generation.current;
    handedOff.current = false;
    away.current = false;
    refreshAfterLoad.current = false;
    setResource(undefined);
    setError("");
    setPending(false);
    metadataBusy.current = false;
    operation.current = false;
    return () => {
      generation.current = sessionGeneration + 1;
    };
  }, [enabled, connectionString, accountName, backendEndpoint]);

  React.useEffect(() => {
    const leave = () => {
      away.current = true;
    };
    const refreshOnReturn = () => {
      if (!handedOff.current || !away.current || document.visibilityState !== "visible" || operation.current) {
        return;
      }
      away.current = false;
      if (metadataBusy.current) {
        refreshAfterLoad.current = true;
      } else {
        refreshAfterLoad.current = false;
        metadataBusy.current = true;
        setRefresh((value) => value + 1);
      }
    };
    const visibility = () => (document.visibilityState === "visible" ? refreshOnReturn() : leave());
    window.addEventListener("blur", leave);
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  React.useEffect(() => {
    if (!enabled || !accountName || !connectionString) {
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    metadataBusy.current = true;
    setLoading(true);
    fetchTrialDetection(
      { accountName, masterKey: extractMasterKeyFromDirectLoginConnectionString(connectionString), backendEndpoint },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        if (result.isTryCosmosDB && result.trialResource.accountName !== accountName) {
          throw new Error(t(Keys.tryCosmosDB.metadataAccountMismatch));
        }
        setResource(result.isTryCosmosDB ? result.trialResource : undefined);
        setError("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setResource(undefined);
        setError(reason instanceof Error ? reason.message : t(Keys.tryCosmosDB.statusUnverified));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          metadataBusy.current = false;
          if (refreshAfterLoad.current && handedOff.current && document.visibilityState === "visible") {
            refreshAfterLoad.current = false;
            metadataBusy.current = true;
            setRefresh((value) => value + 1);
          }
        }
      });
    return () => controller.abort();
  }, [enabled, connectionString, accountName, backendEndpoint, refresh]);

  const session = options.ownerAuth;
  const direct = isTrialOwnerAuth(session) && session.backendEndpoint === backendEndpoint;
  let portalUrl: string | undefined;
  let destinationError = "";
  if (resource && !direct) {
    try {
      portalUrl = trialExtensionUrl(resource, backendEndpoint).href;
    } catch (reason: unknown) {
      destinationError = reason instanceof Error ? reason.message : t(Keys.tryCosmosDB.portalUnavailable);
    }
  }

  const handoff = () => {
    if (!resource || operation.current) {
      return;
    }
    handedOff.current = true;
    away.current = true;
    setError("");
  };

  const extend = async () => {
    if (
      !current.current.enabled ||
      !resource ||
      resource.accountName !== current.current.accountName ||
      operation.current
    ) {
      return;
    }
    const expected = generation.current;
    setError("");
    const session = current.current.ownerAuth;
    try {
      if (destinationError) {
        throw new Error(destinationError);
      }
      if (!isTrialOwnerAuth(session) || session.backendEndpoint !== backendEndpoint) {
        window.open(trialExtensionUrl(resource, backendEndpoint).href, "_blank", "noopener,noreferrer");
        handoff();
        return;
      }
      operation.current = true;
      setPending(true);
      const result = await extendTrial(resource, session);
      if (expected !== generation.current) {
        return;
      }
      setResource({ ...resource, timeLeftInSeconds: result.timeLeftInSeconds });
    } catch (reason: unknown) {
      if (expected !== generation.current) {
        return;
      }
      if (reason instanceof TrialOperationError && reason.signInRequired) {
        current.current.onAuthRejected();
      }
      if (reason instanceof TrialOperationError && reason.refreshRequired) {
        setResource(undefined);
        setRefresh((value) => value + 1);
      }
      setError(reason instanceof Error ? reason.message : t(Keys.tryCosmosDB.operationFailed));
    } finally {
      if (expected === generation.current) {
        operation.current = false;
        setPending(false);
      }
    }
  };

  return {
    resource,
    error: error || destinationError,
    loading,
    pending,
    portalUrl,
    handoff,
    extend,
    retry: () => {
      if (!operation.current) {
        setRefresh((value) => value + 1);
      }
    },
  };
}
