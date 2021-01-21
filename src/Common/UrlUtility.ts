export default class UrlUtility {
  public static parseDocumentsPath(resourcePath: string): any {
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

    var id: string;
    var type: string;
    var pathParts = resourcePath.split("/");

    if (pathParts.length % 2 === 0) {
      id = pathParts[pathParts.length - 2];
      type = pathParts[pathParts.length - 3];
    } else {
      id = pathParts[pathParts.length - 3];
      type = pathParts[pathParts.length - 2];
    }

    var result = {
      type: type,
      objectBody: {
        id: id,
        self: resourcePath
      }
    };

    return result;
  }

  public static createUri(baseUri: string, relativeUri: string): string {
    if (!baseUri) {
      throw new Error("baseUri is null or empty");
    }

    var slashAtEndOfUriRegex = /\/$/,
      slashAtStartOfUriRegEx = /^\//;

    var normalizedBaseUri = baseUri.replace(slashAtEndOfUriRegex, "") + "/",
      normalizedRelativeUri = (relativeUri && relativeUri.replace(slashAtStartOfUriRegEx, "")) || "";

    return normalizedBaseUri + normalizedRelativeUri;
  }
}
