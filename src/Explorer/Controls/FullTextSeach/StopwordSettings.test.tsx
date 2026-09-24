import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { FullTextAnalysisSpec } from "Contracts/DataModels";
import { FullTextPoliciesComponent } from "./FullTextPoliciesComponent";
import React from "react";

jest.mock("Utils/CapabilityUtils", () => ({
  isFullTextSearchPreviewFeaturesEnabled: () => true,
}));

const spec: FullTextAnalysisSpec = {
  language: "en-US",
  stopWordListKind: "basic",
  tokenizer: "word",
  filters: ["lowercase", "stop"],
  addStopWords: ["cosmos"],
  removeStopWords: ["the"],
};

describe("stopword design guidance", () => {
  it("explains inheritance and replacement without changing the selected policy", () => {
    const onChange = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={{ package: "standard", defaultSpec: spec, fullTextPaths: [{ path: "/text" }] }}
        allowStopwordCustomization
        isEditing
        onFullTextPathChange={onChange}
      />,
    );
    expect(screen.getByText("Used by full-text paths that inherit the container settings.")).toBeVisible();
    const inherit = screen.getByRole("checkbox", { name: "Inherit the container's language and stopwords" });
    expect(inherit).toHaveAccessibleDescription("Uses the default language and stopwords above.");
    fireEvent.click(inherit);
    expect(inherit).toHaveAccessibleDescription(
      "Uses this path's language and stopwords instead of the defaults. Custom word lists are not combined.",
    );
    expect(onChange.mock.calls[onChange.mock.calls.length - 1][0]).toEqual({
      package: "standard",
      defaultSpec: spec,
      fullTextPaths: [{ path: "/text", language: "en-US" }],
    });
  });
});
