export function getAuthorizationTokenUsingResourceTokens(
  resourceTokens: { [resourceId: string]: string },
  path: string,
  resourceId: string,
): string {
  console.log(`getting token for path: "${path}" and resourceId: "${resourceId}"`);

  if (resourceTokens && Object.keys(resourceTokens).length > 0) {
    // For database account access(through getDatabaseAccount API), path and resourceId are "",
    // so in this case we return the first token to be used for creating the auth header as the
    // service will accept any token in this case
    if (!path && !resourceId) {
      return resourceTokens[Object.keys(resourceTokens)[0]];
    }

    // If we have exact resource token for the path use it
    if (resourceId && resourceTokens[resourceId]) {
      return resourceTokens[resourceId];
    }

    // minimum valid path /dbs
    if (!path || path.length < 4) {
      console.log(
        `Unable to get authotization token for Path:"${path}" and resourcerId:"${resourceId}". Invalid path.`,
      );
      return null;
    }

    path = trimSlashFromLeftAndRight(path);
    const pathSegments = (path && path.split("/")) || [];

    // Item path
    if (pathSegments.length === 6) {
      // Look for a container token matching the item path
      const containerPath = pathSegments.slice(0, 4).map(decodeURIComponent).join("/");
      if (resourceTokens[containerPath]) {
        return resourceTokens[containerPath];
      }
    }

    // This is legacy behavior that lets someone use a resource token pointing ONLY at an ID
    // It was used when _rid was exposed by the SDK, but now that we are using user provided ids it is not needed
    // However removing it now would be a breaking change
    // if it's an incomplete path like /dbs/db1/colls/, start from the parent resource
    let index = pathSegments.length % 2 === 0 ? pathSegments.length - 1 : pathSegments.length - 2;
    for (; index > 0; index -= 2) {
      const id = decodeURI(pathSegments[index]);
      if (resourceTokens[id]) {
        return resourceTokens[id];
      }
    }
  }

  console.log(`Unable to get authotization token for Path:"${path}" and resourcerId:"${resourceId}"`);
  return null;
}

const trimLeftSlashes = new RegExp("^[/]+");
const trimRightSlashes = new RegExp("[/]+$");
function trimSlashFromLeftAndRight(inputString: string): string {
  if (typeof inputString !== "string") {
    throw new Error("invalid input: input is not string");
  }

  return inputString.replace(trimLeftSlashes, "").replace(trimRightSlashes, "");
}
