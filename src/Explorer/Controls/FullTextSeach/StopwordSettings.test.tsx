import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { FullTextAnalysisSpec } from "Contracts/DataModels";
import React from "react";
import { StopwordSettings } from "./StopwordSettings";
import { fullTextLanguages } from "./FullTextPolicyUtils";

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

  describe("multiword editor language matrix", () => {
    it.each(fullTextLanguages)("$value edits either list losslessly at every tested size", ({ value: language }) => {
      const changed = jest.fn();
      const Harness = () => {
        const [current, setCurrent] = React.useState<FullTextAnalysisSpec>({
          ...spec,
          language,
          future: { retained: true },
        });
        return (
          <StopwordSettings
            label="Words"
            language={language}
            packageName="standard"
            spec={current}
            disabled={false}
            onChange={(next) => {
              changed(next);
              setCurrent(next);
            }}
          />
        );
      };
      render(<Harness />);
      const added = screen.getByRole("textbox", { name: "Additional stopwords" });
      const kept = screen.getByRole("textbox", { name: "Words to keep" });
      for (const count of [0, 1, 5, 20, 100, 1001]) {
        const words = Array.from(
          { length: count },
          (_, index) => ["catalog", "Catalog", "caf\u00e9", "catalog"][index % 4],
        );
        fireEvent.change(added, { target: { value: words.join("\r\n") } });
        expect(added).toHaveValue(words.join("\n"));
        expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ language, addStopWords: words }));
        fireEvent.change(kept, { target: { value: words.join("\n") } });
        expect(kept).toHaveValue(words.join("\n"));
        expect(changed).toHaveBeenLastCalledWith(
          expect.objectContaining({
            language,
            addStopWords: words,
            removeStopWords: words,
            future: { retained: true },
          }),
        );
      }
      fireEvent.click(screen.getByRole("checkbox", { name: "Enable stopword filtering" }));
      expect(added).toBeDisabled();
      expect(kept).toBeDisabled();
      expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ filters: ["lowercase"] }));
      fireEvent.click(screen.getByRole("checkbox", { name: "Enable stopword filtering" }));
      expect(added).toBeEnabled();
      expect(kept).toBeEnabled();
      expect(added).toHaveValue(
        Array.from({ length: 1001 }, (_, index) => ["catalog", "Catalog", "caf\u00e9", "catalog"][index % 4]).join(
          "\n",
        ),
      );
    });

    it.each(fullTextLanguages)("$value associates a late error with only the offending list", ({ value: language }) => {
      const words = Array.from({ length: 20 }, () => "valid");
      words[18] = "invalid phrase";
      const props = { label: "Words", language, packageName: "standard", disabled: false, onChange: jest.fn() };
      const { rerender } = render(<StopwordSettings {...props} spec={{ ...spec, language, addStopWords: words }} />);
      expect(screen.getByRole("textbox", { name: "Additional stopwords" })).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("textbox", { name: "Words to keep" })).not.toHaveAttribute("aria-invalid", "true");
      rerender(<StopwordSettings {...props} spec={{ ...spec, language, removeStopWords: words }} />);
      expect(screen.getByRole("textbox", { name: "Words to keep" })).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("textbox", { name: "Additional stopwords" })).not.toHaveAttribute("aria-invalid", "true");
      rerender(
        <StopwordSettings
          {...props}
          disabled
          spec={{ ...spec, language, addStopWords: words, removeStopWords: words }}
        />,
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue(words.join("\n"));
    });
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
          : "Also ignore these words. Enter one word per line. Words cannot contain whitespace, punctuation, or control characters.",
      );
      expect(removed).toHaveAccessibleDescription(
        removedInvalid
          ? /Stopwords cannot contain whitespace, punctuation, or control characters\./
          : "Keep these words even if they are in the stopword list. Enter one word per line. Words cannot contain whitespace, punctuation, or control characters.",
      );
      expect(screen.queryAllByRole("alert")).toHaveLength(Number(addedInvalid) + Number(removedInvalid));
    },
  );

  it.each([
    ["none", "No built-in stopwords. Only your additional stopwords are ignored."],
    ["basic", "Uses the built-in stopword list for this language."],
    ["extended", "Uses the legacy English stopword list."],
  ])("explains the %s preset without changing the policy", (stopWordListKind, description) => {
    const onChange = jest.fn();
    render(
      <StopwordSettings
        label="Default stopwords"
        language="en-US"
        packageName={stopWordListKind === "extended" ? "legacy" : "standard"}
        spec={{ ...spec, stopWordListKind }}
        disabled={false}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Stopword list" })).toHaveAccessibleDescription(description);
    expect(
      screen.getAllByText(
        "Enter one word per line. Words cannot contain whitespace, punctuation, or control characters.",
      ),
    ).toHaveLength(1);
    expect(onChange).not.toHaveBeenCalled();
  });

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

  it("keeps meanings but hides editing instructions for locked values", () => {
    const props = {
      label: "Default stopwords",
      language: "en-US",
      packageName: "standard",
      spec,
      onChange: jest.fn(),
    };
    const { rerender } = render(<StopwordSettings {...props} disabled />);
    const added = screen.getByRole("textbox", { name: "Additional stopwords" });
    expect(added).toHaveValue("cosmos");
    expect(added).toBeDisabled();
    expect(added).toHaveAccessibleDescription("Also ignore these words.");
    expect(screen.getByRole("textbox", { name: "Words to keep" })).toHaveAccessibleDescription(
      "Keep these words even if they are in the stopword list.",
    );
    expect(
      screen.queryByText(
        "Enter one word per line. Words cannot contain whitespace, punctuation, or control characters.",
      ),
    ).not.toBeInTheDocument();
    rerender(<StopwordSettings {...props} disabled={false} />);
    expect(added).toHaveAccessibleDescription(
      "Also ignore these words. Enter one word per line. Words cannot contain whitespace, punctuation, or control characters.",
    );
    expect(props.onChange).not.toHaveBeenCalled();
  });
});
