import { configContext } from "../ConfigContext";

export function isInvalidParentFrameOrigin(event: MessageEvent): boolean {
  return !isValidOrigin(configContext.allowedParentFrameOrigins, event);
}

function isValidOrigin(allowedOrigins: string[], event: MessageEvent): boolean {
  const eventOrigin = (event && event.origin) || "";
  const windowOrigin = (window && window.origin) || "";
  if (eventOrigin === windowOrigin) {
    return true;
  }

  for (const origin of allowedOrigins) {
    const result = new RegExp(origin).test(eventOrigin);
    if (result) {
      return true;
    }
  }
  console.error(`Invalid parent frame origin decected: ${eventOrigin}`);
  return false;
}
