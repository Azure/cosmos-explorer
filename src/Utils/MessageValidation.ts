import { configContext } from "../ConfigContext";

export function isInvalidParentFrameOrigin(event: MessageEvent): boolean {
  return !isValidOrigin(configContext.allowedParentFrameOrigins, event);
}

function isValidOrigin(allowedOrigins: ReadonlyArray<string>, event: MessageEvent): boolean {
  return true;
  // const eventOrigin = (event && event.origin) || "";
  // const windowOrigin = (window && window.origin) || "";
  // if (eventOrigin === windowOrigin) {
  //   return true;
  // }

  // for (const origin of allowedOrigins) {
  //   const result = new RegExp(origin).test(eventOrigin);
  //   if (result) {
  //     return true;
  //   }
  // }
  // console.error(`Invalid parent frame origin detected: ${eventOrigin}`);
  // return false;
}

export function shouldProcessMessage(event: MessageEvent): boolean {
  if (typeof event.data !== "object") {
    return false;
  }
  if (event.data["signature"] !== "pcIframe") {
    return false;
  }
  if (!("data" in event.data)) {
    return false;
  }
  if (typeof event.data["data"] !== "object") {
    return false;
  }

  return true;
}

export function isReadyMessage(event: MessageEvent): boolean {
  if (!event?.data?.kind && !event?.data?.data) {
    return false;
  }

  if (event.data.kind !== "ready" && event.data.data !== "ready") {
    return false;
  }

  return true;
}
