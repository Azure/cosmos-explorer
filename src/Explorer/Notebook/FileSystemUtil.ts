// Utilities for file system

export class FileSystemUtil {
  /**
   * file list returns path starting with ./blah
   * rename returns simply blah.
   * Both are the same. This method only handles these two cases and no other complicated paths that may contain ..
   * ./ inside the path.
   * TODO: this should go away when not using jupyter for file operations and use normalized paths.
   * @param path1
   * @param path2
   */
  public static isPathEqual(path1: string, path2: string): boolean {
    const normalize = (path: string): string => {
      const dotSlash = "./";
      if (path.indexOf(dotSlash) === 0) {
        path = path.substring(dotSlash.length);
      }
      return path;
    };

    return normalize(path1) === normalize(path2);
  }

  /**
   * Remove extension
   * @param path
   * @param extension Without the ".". e.g. "ipynb" (and not ".ipynb")
   */
  public static stripExtension(path: string, extension: string): string {
    const splitted = path.split(".");
    if (splitted[splitted.length - 1] === extension) {
      splitted.pop();
    }
    return splitted.join(".");
  }
}
