import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it.each<[string[], string[], boolean, boolean]>([
    [["invalid phrase"], ["the"], true, false],
    [["cosmos"], ["invalid phrase"], false, true],
    [["bad!"], ["bad?"], true, true],
    [["cosmos"], ["the"], false, false],
  ])(
    "associates validation with the exact word list: %j / %j",
    (addStopWords, removeStopWords, addedInvalid, removedInvalid) => {
      render(
        <StopwordSettings
          label="Default stopwords"
          language="en-US"
          packageName="standard"
          spec={{ ...spec, addStopWords, removeStopWords }}
          disabled={false}
          onChange={jest.fn()}
        />,
      );
      const added = screen.getByRole("textbox", { name: "Additional stopwords" });
      const removed = screen.getByRole("textbox", { name: "Words to keep" });
      expect(added.getAttribute("aria-invalid") === "true").toBe(addedInvalid);
      expect(removed.getAttribute("aria-invalid") === "true").toBe(removedInvalid);
      expect(added).toHaveAccessibleDescription(
        addedInvalid
          ? /Stopwords cannot contain whitespace, punctuation, or control characters\./
          : "Enter one word per line. Words cannot contain whitespace, punctuation, or control characters.",
      );
      expect(removed).toHaveAccessibleDescription(
        removedInvalid ? "Stopwords cannot contain whitespace, punctuation, or control characters." : "",
      );
      expect(screen.queryAllByRole("alert")).toHaveLength(Number(addedInvalid) + Number(removedInvalid));
    },
  );

  it("does not mark locked values invalid or change serialization", () => {
    const onChange = jest.fn();
    const props = { label: "Default stopwords", language: "en-US", packageName: "standard", onChange };
    const { rerender } = render(
      <StopwordSettings {...props} spec={{ ...spec, addStopWords: ["invalid phrase"] }} disabled />,
    );
    expect(screen.getByRole("textbox", { name: "Additional stopwords" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    rerender(<StopwordSettings {...props} spec={spec} disabled={false} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Additional stopwords" }), {
      target: { value: "Cosmos\ncosmos\ncosmos" },
    });
    expect(onChange).toHaveBeenCalledWith({ ...spec, addStopWords: ["Cosmos", "cosmos", "cosmos"] });
  });
});
