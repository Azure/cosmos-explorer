interface Result {
  type?: string;
  objectBody?: {
    id: string;
    self: string;
  };
}

export function parseDocumentsPath(resourcePath: string): Result {
  if (typeof resourcePath !== "string") {
    return {};
  }

  if (resourcePath.length === 0) {
    return {};
  }

  if (resourcePath[resourcePath.length - 1] !== "/") {
    resourcePath = resourcePath + "/";
  }

  if (resourcePath[0] !== "/") {
    resourcePath = "/" + resourcePath;
  }

  let id: string;
  let type: string;
  const pathParts = resourcePath.split("/");

  if (pathParts.length % 2 === 0) {
    id = pathParts[pathParts.length - 2];
    type = pathParts[pathParts.length - 3];
  } else {
    id = pathParts[pathParts.length - 3];
    type = pathParts[pathParts.length - 2];
  }

  const result = {
    type: type,
    objectBody: {
      id: id,
      self: resourcePath,
    },
  };

  return result;
}

export function createUri(baseUri: string, relativeUri: string): string {
  if (!baseUri) {
    throw new Error("baseUri is null or empty");
  }

  const slashAtEndOfUriRegex = /\/$/,
    slashAtStartOfUriRegEx = /^\//;

  const normalizedBaseUri = baseUri.replace(slashAtEndOfUriRegex, "") + "/",
    normalizedRelativeUri = (relativeUri && relativeUri.replace(slashAtStartOfUriRegEx, "")) || "";

  return normalizedBaseUri + normalizedRelativeUri;
}
