import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { FullTextAnalysisSpec } from "Contracts/DataModels";
import React from "react";
import { StopwordSettings } from "./StopwordSettings";

const spec: FullTextAnalysisSpec = {
  language: "en-US",
  stopWordListKind: "basic",
  tokenizer: "word",
  filters: ["lowercase", "stop"],
  addStopWords: ["cosmos"],
  removeStopWords: ["the"],
};

describe("stopword design guidance", () => {
  it("explains default scope without changing the selected policy", () => {
    const onChange = jest.fn();
    render(
      <StopwordSettings
        label="Default stopwords"
        description="Used by full-text paths that inherit the container settings."
        language="en-US"
        packageName="standard"
        spec={spec}
        disabled={false}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Used by full-text paths that inherit the container settings.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue("cosmos");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("explains why service-default word fields are disabled without selecting a preset", () => {
    const props = {
      label: "Default stopwords",
      language: "en-US",
      packageName: "standard",
      disabled: false,
      onChange: jest.fn(),
    };
    const { rerender } = render(
      <StopwordSettings {...props} spec={{ language: "en-US", tokenizer: "word", filters: ["lowercase", "stop"] }} />,
    );
    expect(screen.getByRole("combobox", { name: "Stopword list" })).toHaveAccessibleDescription(
      "Select a stopword list to customize the words below.",
    );
    expect(screen.getByRole("textbox", { name: "Additional stopwords" })).toBeDisabled();
    expect(props.onChange).not.toHaveBeenCalled();
    rerender(<StopwordSettings {...props} spec={spec} />);
    expect(screen.queryByText("Select a stopword list to customize the words below.")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Additional stopwords" })).toBeEnabled();
  });
});
