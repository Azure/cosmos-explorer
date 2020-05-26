import { config } from "../Config";

export function isInvalidParentFrameOrigin(event: MessageEvent): boolean {
  return !isValidOrigin(config.allowedParentFrameOrigins, event);
}

function isValidOrigin(allowedOrigins: RegExp, event: MessageEvent): boolean {
  const eventOrigin = (event && event.origin) || "";
  const windowOrigin = (window && window.origin) || "";
  if (eventOrigin === windowOrigin) {
    return true;
  }

  const result = allowedOrigins && allowedOrigins.test(eventOrigin);
  return result;
}
