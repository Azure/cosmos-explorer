import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DatabaseAccount, FullTextPolicy, VectorEmbedding } from "Contracts/DataModels";
import {
  ContainerPolicyComponent,
  ContainerPolicyComponentProps,
} from "../Settings/SettingsSubComponents/ContainerPolicyComponent";
import React from "react";
import { ApiType, updateUserContext } from "UserContext";
import { isFullTextSearchPreviewFeaturesEnabled } from "Utils/CapabilityUtils";
import { FullTextPoliciesComponent, getFullTextLanguageOptions } from "./FullTextPoliciesComponent";

describe("FullTextPoliciesComponent", () => {
  const account: DatabaseAccount = {
    id: "test",
    name: "test",
    type: "Microsoft.DocumentDB/databaseAccounts",
    location: "westus",
    kind: "GlobalDocumentDB",
    tags: {},
    properties: {
      capabilities: [{ name: "EnableNoSQLFullTextSearchPreviewFeatures", description: "" }],
    },
  };
  const policy: FullTextPolicy = {
    defaultLanguage: "en-US",
    package: "standard",
    defaultSpec: {
      language: "en-US",
      stopWordListKind: "basic",
      addStopWords: ["cosmos"],
      removeStopWords: ["the"],
      tokenizer: "word",
      filters: ["lowercase", "stop"],
      futureField: { preserved: true },
    },
    fullTextPaths: [{ path: "/text" }, { path: "/other", language: "fr-FR", stopWordListKind: "none" }],
    futurePolicyField: "preserved",
  };

  beforeEach(() => {
    updateUserContext({ apiType: "SQL", databaseAccount: account });
  });

  describe("ContainerPolicyComponent full-text editing", () => {
    const baseline: FullTextPolicy = {
      package: "standard",
      defaultSpec: {
        language: "en-US",
        stopWordListKind: "basic",
        filters: ["lowercase", "stop"],
        addStopWords: ["cosmos"],
        future: { preserve: true },
      },
      fullTextPaths: [{ path: "/text" }],
    };
    const account: DatabaseAccount = {
      id: "test",
      name: "test",
      type: "Microsoft.DocumentDB/databaseAccounts",
      location: "westus",
      kind: "GlobalDocumentDB",
      properties: { capabilities: [{ name: "EnableNoSQLFullTextSearchPreviewFeatures", description: "" }] },
    };
    const props = (): ContainerPolicyComponentProps => ({
      vectorEmbeddingPolicy: { vectorEmbeddings: [] },
      vectorEmbeddingPolicyBaseline: { vectorEmbeddings: [] },
      onVectorEmbeddingPolicyChange: jest.fn(),
      onVectorEmbeddingPolicyDirtyChange: jest.fn(),
      onVectorEmbeddingPolicyValidationChange: jest.fn(),
      vectorIndexes: [],
      vectorIndexesBaseline: [],
      onVectorIndexesChange: jest.fn(),
      isVectorSearchEnabled: false,
      fullTextPolicy: baseline,
      fullTextPolicyBaseline: baseline,
      onFullTextPolicyChange: jest.fn(),
      onFullTextPolicyDirtyChange: jest.fn(),
      onFullTextPolicyValidationChange: jest.fn(),
      fullTextIndexesBaseline: [],
      isFullTextSearchEnabled: true,
      shouldDiscardContainerPolicies: false,
      resetShouldDiscardContainerPolicyChange: jest.fn(),
    });

    beforeEach(() => updateUserContext({ apiType: "SQL", databaseAccount: account }));

    it("opens the full-text tab when vector search is unavailable and propagates validation and reversions", () => {
      const callbacks = props();
      const Harness = () => {
        const [policy, setPolicy] = React.useState(baseline);
        return (
          <ContainerPolicyComponent
            {...callbacks}
            fullTextPolicy={policy}
            onFullTextPolicyChange={(next) => {
              callbacks.onFullTextPolicyChange(next);
              setPolicy(next);
            }}
          />
        );
      };
      render(<Harness />);
      const words = within(screen.getByRole("group", { name: "Default stopwords" })).getByRole("textbox", {
        name: "Additional stopwords",
      });
      expect(callbacks.onFullTextPolicyDirtyChange).toHaveBeenLastCalledWith(false);
      fireEvent.change(words, { target: { value: "two words" } });
      expect(callbacks.onFullTextPolicyDirtyChange).toHaveBeenLastCalledWith(true);
      expect(callbacks.onFullTextPolicyValidationChange).toHaveBeenLastCalledWith(false);
      fireEvent.change(words, { target: { value: "cosmos" } });
      expect(callbacks.onFullTextPolicyChange).toHaveBeenLastCalledWith(baseline);
      expect(callbacks.onFullTextPolicyDirtyChange).toHaveBeenLastCalledWith(false);
      expect(callbacks.onFullTextPolicyValidationChange).toHaveBeenLastCalledWith(true);
    });

    it("discards drafts without losing hidden fields or relocking against draft indexes", () => {
      const callbacks = props();
      const { rerender } = render(<ContainerPolicyComponent {...callbacks} />);
      const words = within(screen.getByRole("group", { name: "Default stopwords" })).getByRole("textbox", {
        name: "Additional stopwords",
      });
      fireEvent.change(words, { target: { value: "draft" } });
      rerender(<ContainerPolicyComponent {...callbacks} shouldDiscardContainerPolicies />);
      expect(words).toHaveValue("cosmos");
      expect(callbacks.onFullTextPolicyChange).toHaveBeenLastCalledWith(baseline);
      expect(callbacks.resetShouldDiscardContainerPolicyChange).toHaveBeenCalledTimes(1);
      rerender(<ContainerPolicyComponent {...callbacks} fullTextIndexesBaseline={[{ path: "/text" }]} />);
      expect(words).toBeDisabled();
      expect(screen.getByRole("textbox", { name: "Path" })).toBeDisabled();
    });

    it("propagates vector removal instead of leaving a stale draft to save with full-text edits", () => {
      const vector: VectorEmbedding = {
        path: "/vector",
        dataType: "float32",
        dimensions: 8,
        distanceFunction: "cosine",
      };
      const callbacks = props();
      const Harness = () => {
        const [vectorPolicy, setVectorPolicy] = React.useState({ vectorEmbeddings: [vector] });
        return (
          <ContainerPolicyComponent
            {...callbacks}
            isVectorSearchEnabled
            vectorEmbeddingPolicy={vectorPolicy}
            vectorEmbeddingPolicyBaseline={{ vectorEmbeddings: [vector] }}
            onVectorEmbeddingPolicyChange={(next) => {
              callbacks.onVectorEmbeddingPolicyChange(next);
              setVectorPolicy(next);
            }}
          />
        );
      };
      const { container } = render(<Harness />);
      const deleteButton = container.querySelector<HTMLButtonElement>('[id^="delete-Vector"]');
      expect(deleteButton).not.toBeNull();
      fireEvent.click(deleteButton!);
      expect(callbacks.onVectorEmbeddingPolicyChange).toHaveBeenLastCalledWith({ vectorEmbeddings: [] });
    });
  });

  it("preserves the complete policy on mount instead of reconstructing legacy fields", () => {
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={policy}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    expect(changed).toHaveBeenLastCalledWith(policy, [], true);
    expect(screen.getByRole("group", { name: "Default stopwords" })).toBeVisible();
  });

  it("keeps capability gating independent of the English-only language restriction", () => {
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={policy}
        onFullTextPathChange={jest.fn()}
        allowStopwordCustomization
        englishOnly
        isEditing
      />,
    );
    expect(screen.getByRole("group", { name: "Default stopwords" })).toBeVisible();
    expect(getFullTextLanguageOptions(true).map((option) => option.key)).toEqual(["en-US"]);
    expect(getFullTextLanguageOptions().map((option) => option.key)).toHaveLength(7);
  });

  const apiTypes: ApiType[] = ["SQL", "Mongo", "Gremlin", "Tables", "Cassandra", "Postgres", "VCoreMongo"];
  it.each(apiTypes)("gates stopwords and languages correctly for %s and target-account overrides", (apiType) => {
    for (const preview of [false, true]) {
      const capabilities = preview
        ? account.properties.capabilities
        : [{ name: "EnableNoSQLFullTextSearch", description: "" }];
      updateUserContext({ apiType, databaseAccount: { ...account, properties: { capabilities } } });
      updateUserContext({ apiType });
      expect(isFullTextSearchPreviewFeaturesEnabled()).toBe(apiType === "SQL" && preview);
      expect(getFullTextLanguageOptions()).toHaveLength(apiType === "SQL" && preview ? 7 : 1);
      expect(getFullTextLanguageOptions(true)).toHaveLength(1);
      for (const targetPreview of [false, true]) {
        const target = {
          subscriptionId: "subscription",
          resourceGroup: "group",
          accountName: "target",
          capabilities: targetPreview ? account.properties.capabilities : [],
        };
        expect(isFullTextSearchPreviewFeaturesEnabled(target)).toBe(apiType === "SQL" && targetPreview);
        expect(getFullTextLanguageOptions(false, target)).toHaveLength(apiType === "SQL" && targetPreview ? 7 : 1);
      }
    }
  });

  it("preserves a custom policy when the preview capability is unavailable", () => {
    updateUserContext({ databaseAccount: { ...account, properties: { capabilities: [] } } });
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={policy}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    expect(screen.queryByRole("group", { name: "Default stopwords" })).not.toBeInTheDocument();
    expect(screen.getByText(/customization is not enabled for this connection/)).toBeVisible();
    expect(changed).toHaveBeenLastCalledWith(policy, [], true);
  });

  it("opts into standard customization explicitly and restores a legacy-shaped new policy when unchecked", () => {
    const legacy: FullTextPolicy = { defaultLanguage: "en-US", fullTextPaths: [{ path: "/text", language: "en-US" }] };
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent fullTextPolicy={legacy} onFullTextPathChange={changed} allowStopwordCustomization />,
    );
    expect(changed).toHaveBeenLastCalledWith(legacy, [{ path: "/text" }], true);
    const toggle = screen.getByRole("checkbox", { name: "Customize stopwords with standard analysis" });
    fireEvent.click(toggle);
    expect(changed.mock.calls[changed.mock.calls.length - 1][0].package).toBe("standard");
    expect(changed.mock.calls[changed.mock.calls.length - 1][0].fullTextPaths).toEqual([{ path: "/text" }]);
    fireEvent.click(toggle);
    expect(changed).toHaveBeenLastCalledWith(legacy, [{ path: "/text" }], true);
    expect(legacy).toEqual({ defaultLanguage: "en-US", fullTextPaths: [{ path: "/text", language: "en-US" }] });
  });

  it("propagates invalid custom words and recovers without mutating the baseline", () => {
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={policy}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    const input = within(screen.getByRole("group", { name: "Default stopwords" })).getByRole("textbox", {
      name: "Additional stopwords",
    });
    fireEvent.change(input, { target: { value: "two words" } });
    expect(changed.mock.calls[changed.mock.calls.length - 1][2]).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("cannot contain");
    fireEvent.change(input, { target: { value: "Cosmos\ncosmos" } });
    const updated = changed.mock.calls[changed.mock.calls.length - 1][0];
    expect(updated.defaultSpec.addStopWords).toEqual(["Cosmos", "cosmos"]);
    expect(updated.defaultSpec.futureField).toEqual({ preserved: true });
    expect(changed.mock.calls[changed.mock.calls.length - 1][2]).toBe(true);
    expect(policy.defaultSpec?.addStopWords).toEqual(["cosmos"]);
  });

  it("locks only persisted indexed paths and global defaults, not unrelated paths", () => {
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={policy}
        onFullTextPathChange={jest.fn()}
        allowStopwordCustomization
        isEditing
        fullTextIndexes={[{ path: "/text" }]}
      />,
    );
    expect(
      within(screen.getByRole("group", { name: "Default stopwords" })).getByRole("textbox", {
        name: "Additional stopwords",
      }),
    ).toBeDisabled();
    const paths = screen.getAllByRole("textbox", { name: "Path" });
    expect(paths[0]).toBeDisabled();
    expect(paths[1]).toBeEnabled();
    expect(
      within(screen.getByRole("group", { name: "Stopwords for /other" })).getByRole("textbox", {
        name: "Additional stopwords",
      }),
    ).toBeEnabled();
  });

  it("discards draft changes and restores all hidden fields from the supplied baseline", () => {
    const changed = jest.fn();
    const discarded = jest.fn();
    const props = {
      fullTextPolicy: policy,
      onFullTextPathChange: changed,
      onChangesDiscarded: discarded,
      allowStopwordCustomization: true,
      isEditing: true,
    };
    const { rerender } = render(<FullTextPoliciesComponent {...props} />);
    const input = within(screen.getByRole("group", { name: "Default stopwords" })).getByRole("textbox", {
      name: "Additional stopwords",
    });
    fireEvent.change(input, { target: { value: "changed" } });
    rerender(<FullTextPoliciesComponent {...props} discardChanges />);
    expect(input).toHaveValue("cosmos");
    expect(changed).toHaveBeenLastCalledWith(policy, [], true);
    expect(discarded).toHaveBeenCalledTimes(1);
  });

  it("keeps unknown presets read-only and lossless", () => {
    const future = { ...policy, defaultSpec: { ...policy.defaultSpec, stopWordListKind: "future" } };
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={future}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    expect(screen.getByText(/settings this editor cannot safely change/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Add full text path" })).toBeDisabled();
    expect(changed).toHaveBeenLastCalledWith(future, [], true);
  });

  it("requires explicit activation when an existing standard policy has no stop filter", () => {
    const withoutFilter: FullTextPolicy = { ...policy, defaultSpec: { ...policy.defaultSpec, filters: [] } };
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={withoutFilter}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    const defaults = within(screen.getByRole("group", { name: "Default stopwords" }));
    expect(defaults.getByRole("textbox", { name: "Additional stopwords" })).toBeDisabled();
    fireEvent.click(defaults.getByRole("checkbox", { name: "Enable stopword filtering" }));
    expect(defaults.getByRole("textbox", { name: "Additional stopwords" })).toBeEnabled();
    expect(changed.mock.calls[changed.mock.calls.length - 1][0].defaultSpec.filters).toEqual(["stop"]);
    expect(withoutFilter.defaultSpec?.filters).toEqual([]);
  });

  it("does not inherit filters when a path explicitly chooses a tokenizer and writes a tokenizer with new filters", () => {
    const changed = jest.fn();
    const explicitTokenizer = {
      ...policy,
      fullTextPaths: [{ path: "/text", language: "en-US", tokenizer: "word", stopWordListKind: "basic" }],
    };
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={explicitTokenizer}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    const pathSettings = within(screen.getByRole("group", { name: "Stopwords for /text" }));
    expect(pathSettings.getByRole("checkbox", { name: "Enable stopword filtering" })).not.toBeChecked();
    fireEvent.click(pathSettings.getByRole("checkbox", { name: "Enable stopword filtering" }));
    expect(changed.mock.calls[changed.mock.calls.length - 1][0].fullTextPaths[0]).toEqual({
      ...explicitTokenizer.fullTextPaths[0],
      filters: ["stop"],
    });
  });

  it("preserves customized legacy policies read-only without the capability", () => {
    updateUserContext({ databaseAccount: { ...account, properties: { capabilities: [] } } });
    const legacy: FullTextPolicy = {
      defaultLanguage: "en-US",
      fullTextPaths: [{ path: "/text", language: "en-US", stopWordListKind: "extended", addStopWords: ["cosmos"] }],
    };
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent
        fullTextPolicy={legacy}
        onFullTextPathChange={changed}
        allowStopwordCustomization
        isEditing
      />,
    );
    expect(screen.getByRole("textbox", { name: "Path" })).toBeDisabled();
    expect(changed).toHaveBeenLastCalledWith(legacy, [], true);
  });

  it("keeps existing standard policies valid and unchanged in compatibility-only GSI use", () => {
    const changed = jest.fn();
    render(<FullTextPoliciesComponent fullTextPolicy={policy} onFullTextPathChange={changed} />);
    expect(screen.getByRole("button", { name: "Add full text path" })).toBeDisabled();
    expect(changed).toHaveBeenLastCalledWith(policy, [{ path: "/text" }, { path: "/other" }], true);
  });

  it("validates new empty paths and generates indexes without altering other policy fields", async () => {
    const changed = jest.fn();
    render(
      <FullTextPoliciesComponent fullTextPolicy={policy} onFullTextPathChange={changed} allowStopwordCustomization />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add full text path" }));
    expect(changed.mock.calls[changed.mock.calls.length - 1][2]).toBe(false);
    expect(await screen.findByText("Full text path should not be empty")).toBeVisible();
    const paths = screen.getAllByRole("textbox", { name: "Path" });
    fireEvent.change(paths[2], { target: { value: "added" } });
    const updated = changed.mock.calls[changed.mock.calls.length - 1];
    expect(updated[0].fullTextPaths[2]).toEqual({ path: "/added" });
    expect(updated[0].defaultSpec).toEqual(policy.defaultSpec);
    expect(updated[1]).toEqual([{ path: "/text" }, { path: "/other" }, { path: "/added" }]);
    expect(updated[2]).toBe(true);
  });
});
