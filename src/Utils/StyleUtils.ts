// Adapted from https://gist.github.com/davidgilbertson/ed3c8bb8569bc64b094b87aa88bed5fa
export function copyStyles(sourceDoc: Document, targetDoc: Document): void {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    if (styleSheet.href) {
      // for <link> elements loading CSS from a URL
      const newLinkEl = sourceDoc.createElement("link");

      newLinkEl.rel = "stylesheet";
      newLinkEl.href = styleSheet.href;
      targetDoc.head.appendChild(newLinkEl);
    } else if (styleSheet.cssRules && styleSheet.cssRules.length > 0) {
      // for <style> elements
      const newStyleEl = sourceDoc.createElement("style");

      Array.from(styleSheet.cssRules).forEach((cssRule) => {
        // write the text of each rule into the body of the style element
        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
      });

      targetDoc.head.appendChild(newStyleEl);
    }
  });
}

/**
 * Conditionally returns a class name based on a boolean condition.
 * If the condition is true, returns the `trueValue` class; otherwise, returns `falseValue` (or an empty string if not provided).
 */
export function conditionalClass(condition: boolean, trueValue: string, falseValue?: string): string {
  return condition ? trueValue : falseValue || "";
}
