import "@testing-library/jest-dom";
import { RenderResult, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import React from "react";
import * as CapabilityUtils from "Utils/CapabilityUtils";
import { VectorEmbeddingPoliciesComponent } from "./VectorEmbeddingPoliciesComponent";
import { isValidFoundryEndpoint } from "./VectorSearchUtils";

// The embedding-source UI is gated behind the integrated-embedding capability.
// Default the mock to `true` for the existing suites so they exercise the full UI;
// the dedicated suite at the bottom of this file flips it to `false` to verify gating.
jest.spyOn(CapabilityUtils, "isIntegratedEmbeddingEnabled").mockReturnValue(true);

const mockVectorEmbedding: VectorEmbedding[] = [
  { path: "/vector1", dataType: "float32", distanceFunction: "euclidean", dimensions: 0 },
];

const mockVectorIndex: VectorIndex[] = [{ path: "/vector1", type: "flat" }];

const mockOnVectorEmbeddingChange = jest.fn();

describe("AddVectorEmbeddingPolicyForm", () => {
  let component: RenderResult;

  beforeEach(() => {
    component = render(
      <VectorEmbeddingPoliciesComponent
        vectorEmbeddingsBaseline={mockVectorEmbedding}
        vectorEmbeddings={mockVectorEmbedding}
        vectorIndexes={mockVectorIndex}
        onVectorEmbeddingChange={mockOnVectorEmbeddingChange}
      />,
    );
  });

  test("renders correctly", () => {
    expect(screen.getByText("Vector embedding 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("/vector1")).toBeInTheDocument();
  });

  test("calls onVectorEmbeddingChange on adding a new vector embedding", () => {
    fireEvent.click(screen.getByText("Add vector embedding"));
    expect(mockOnVectorEmbeddingChange).toHaveBeenCalled();
  });

  test("calls onDelete when delete button is clicked", async () => {
    const deleteButton = component.container.querySelector("#delete-Vector-embedding-1");
    fireEvent.click(deleteButton);
    expect(mockOnVectorEmbeddingChange).toHaveBeenCalled();
    expect(screen.queryByText("Vector embedding 1")).toBeNull();
  });

  test("calls onVectorEmbeddingPathChange on input change", () => {
    fireEvent.change(screen.getByPlaceholderText("/vector1"), { target: { value: "/newPath" } });
    expect(mockOnVectorEmbeddingChange).toHaveBeenCalled();
  });

  test("validates input correctly", async () => {
    fireEvent.change(screen.getByPlaceholderText("/vector1"), { target: { value: "" } });
    await waitFor(() => expect(screen.getByText("Path should not be empty")).toBeInTheDocument(), {
      timeout: 1500,
    });
    await waitFor(
      () =>
        expect(screen.getByText("Dimension must be greater than 0 and less than or equal 4096")).toBeInTheDocument(),
      {
        timeout: 1500,
      },
    );
    fireEvent.change(component.container.querySelector("#vector-policy-dimension-1"), { target: { value: "4096" } });
    fireEvent.change(screen.getByPlaceholderText("/vector1"), { target: { value: "/vector1" } });
    await waitFor(() => expect(screen.queryByText("Path should not be empty")).toBeNull(), {
      timeout: 1500,
    });
    await waitFor(
      () => expect(screen.queryByText("Maximum allowed dimension for flat index is 505")).toBeInTheDocument(),
      {
        timeout: 1500,
      },
    );
  });

  test("duplicate vector path is not allowed", async () => {
    fireEvent.click(screen.getByText("Add vector embedding"));
    fireEvent.change(component.container.querySelector("#vector-policy-path-2"), { target: { value: "/vector1" } });
    await waitFor(() => expect(screen.queryByText("Vector embedding path is already defined")).toBeNull(), {
      timeout: 1500,
    });
  });
});

describe("VectorEmbeddingPoliciesComponent - embedding source", () => {
  const newEmbedding: VectorEmbedding[] = [
    { path: "/vector2", dataType: "float32", distanceFunction: "cosine", dimensions: 1536 },
  ];
  let onChange: jest.Mock;
  let view: RenderResult;

  beforeEach(() => {
    onChange = jest.fn();
    view = render(
      <VectorEmbeddingPoliciesComponent
        vectorEmbeddingsBaseline={[]}
        vectorEmbeddings={newEmbedding}
        vectorIndexes={[]}
        onVectorEmbeddingChange={onChange}
      />,
    );
  });

  const expandSection = () => {
    const header = screen.getByRole("button", { name: /Embedding Configuration/ });
    fireEvent.click(header);
  };

  test("renders the embedding source accordion collapsed by default with no errors", () => {
    expect(screen.getByText("Embedding Configuration (Preview)")).toBeInTheDocument();
    expect(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1")).toBeNull();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[2]).toBe(true);
    expect(lastCall[0][0].embeddingSource).toBeUndefined();
  });

  test("expanding the accordion reveals all source fields without errors when empty", () => {
    expandSection();
    expect(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1")).not.toBeNull();
    expect(view.container.querySelector("#vector-policy-embeddingSource-deploymentName-1")).not.toBeNull();
    expect(view.container.querySelector("#vector-policy-embeddingSource-modelName-1")).not.toBeNull();
    expect(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1")).not.toBeNull();
    expect(view.container.querySelector("#vector-policy-embeddingSource-authType-1")).not.toBeNull();
    expect(screen.getByPlaceholderText("/title, /description")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("text-embedding-3-small")).toHaveLength(2);
    expect(screen.getByPlaceholderText("https://<foundry-resource-name>.openai.azure.com/")).toBeInTheDocument();
    expect(screen.getByText("Embedding model name")).toBeInTheDocument();
    expect(screen.getByText("Microsoft Foundry Endpoint")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "The item property paths whose values are used as input for embedding generation. Enter multiple values separated by commas, for example /title, /description.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Microsoft Foundry model deployment name")).toBeInTheDocument();
    expect(screen.getByLabelText("Microsoft Foundry model name")).toBeInTheDocument();
    expect(screen.queryByText("At least one source path is required")).toBeNull();
    expect(screen.queryByText("Deployment name is required")).toBeNull();
  });

  test("identifies embedding inputs by their visible labels", () => {
    expandSection();
    expect(screen.getByRole("textbox", { name: /^Source paths/ })).toHaveAttribute(
      "id",
      "vector-policy-embeddingSource-sourcePaths-1",
    );
    expect(screen.getByRole("textbox", { name: /^Deployment name/ })).toHaveAttribute(
      "id",
      "vector-policy-embeddingSource-deploymentName-1",
    );
    expect(screen.getByRole("textbox", { name: /^Embedding model name/ })).toHaveAttribute(
      "id",
      "vector-policy-embeddingSource-modelName-1",
    );
    expect(screen.getByRole("textbox", { name: "Microsoft Foundry Endpoint" })).toHaveAttribute(
      "id",
      "vector-policy-embeddingSource-endpoint-1",
    );
    expect(screen.getByRole("combobox", { name: "Authentication type" })).toBeInTheDocument();
  });

  test("typing in one field surfaces required errors for the others", async () => {
    expandSection();
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-deploymentName-1"), {
      target: { value: "my-deployment" },
    });
    await waitFor(() => {
      expect(screen.getByText("At least one source path is required")).toBeInTheDocument();
      expect(screen.getByText("Embedding model name is required")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Foundry Endpoint is required")).toBeInTheDocument();
    });
    const last = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(last[2]).toBe(false);
  });

  test("source paths must start with slash and differ from vector path", async () => {
    expandSection();
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1"), {
      target: { value: "description" },
    });
    await waitFor(() => expect(screen.getByText("Source paths must start with /")).toBeInTheDocument());

    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1"), {
      target: { value: "/vector2" },
    });
    await waitFor(() => expect(screen.getByText("Source path must be different from vector path")).toBeInTheDocument());
  });

  test("invalid endpoint shows the Azure OpenAI or Foundry URL error", async () => {
    expandSection();
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1"), {
      target: { value: "not-a-url" },
    });
    await waitFor(() =>
      expect(screen.getByText("Endpoint must be a valid Azure OpenAI or Foundry https:// URL")).toBeInTheDocument(),
    );

    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1"), {
      target: { value: "http://insecure.example.com" },
    });
    await waitFor(() =>
      expect(screen.getByText("Endpoint must be a valid Azure OpenAI or Foundry https:// URL")).toBeInTheDocument(),
    );

    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1"), {
      target: { value: "https://example.com" },
    });
    await waitFor(() =>
      expect(screen.getByText("Endpoint must be a valid Azure OpenAI or Foundry https:// URL")).toBeInTheDocument(),
    );
  });

  test("valid input propagates an embeddingSource with parsed sourcePaths", async () => {
    expandSection();
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1"), {
      target: { value: "/description, /title" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-deploymentName-1"), {
      target: { value: "my-deployment" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-modelName-1"), {
      target: { value: "text-embedding-3-small" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1"), {
      target: { value: "https://my-foundry.openai.azure.com" },
    });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      const [embeddings, , valid] = lastCall;
      expect(valid).toBe(true);
      expect(embeddings[0].embeddingSource).toEqual({
        sourcePaths: ["/description", "/title"],
        deploymentName: "my-deployment",
        modelName: "text-embedding-3-small",
        endpoint: "https://my-foundry.openai.azure.com",
        authType: "Entra",
      });
    });
  });

  test("clearing all fields drops embeddingSource from the emitted embedding", async () => {
    expandSection();
    const sourcePaths = view.container.querySelector(
      "#vector-policy-embeddingSource-sourcePaths-1",
    ) as HTMLInputElement;
    const deploymentName = view.container.querySelector(
      "#vector-policy-embeddingSource-deploymentName-1",
    ) as HTMLInputElement;
    const modelName = view.container.querySelector("#vector-policy-embeddingSource-modelName-1") as HTMLInputElement;
    const endpoint = view.container.querySelector("#vector-policy-embeddingSource-endpoint-1") as HTMLInputElement;

    fireEvent.change(sourcePaths, { target: { value: "/description" } });
    fireEvent.change(deploymentName, { target: { value: "d" } });
    fireEvent.change(modelName, { target: { value: "m" } });
    fireEvent.change(endpoint, { target: { value: "https://x.openai.azure.com" } });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[2]).toBe(true);
      expect(lastCall[0][0].embeddingSource).toBeDefined();
    });

    fireEvent.change(sourcePaths, { target: { value: "" } });
    fireEvent.change(deploymentName, { target: { value: "" } });
    fireEvent.change(modelName, { target: { value: "" } });
    fireEvent.change(endpoint, { target: { value: "" } });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      const [embeddings, , valid] = lastCall;
      expect(valid).toBe(true);
      expect(embeddings[0].embeddingSource).toBeUndefined();
    });
  });

  test("does not loop onVectorEmbeddingChange once all fields become valid (regression)", async () => {
    // Regression for an infinite render loop where the child rebuilt a fresh
    // VectorEmbeddingSource literal on every render, defeating the parent's
    // reference-equality dedupe and re-triggering child useEffect via the
    // unstable onChange prop. Before the fix, this scenario hung the test
    // runner (Jest would time out after several minutes).
    expandSection();
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1"), {
      target: { value: "/title, /description" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-deploymentName-1"), {
      target: { value: "text-embedding-ada-002" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-modelName-1"), {
      target: { value: "text-embedding-ada-002" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1"), {
      target: { value: "https://my-foundry.openai.azure.com" },
    });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[2]).toBe(true);
      expect(lastCall[0][0].embeddingSource).toBeDefined();
    });

    const stable = onChange.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onChange.mock.calls.length).toBe(stable);
  });

  test("model-specific dimension validation blocks out-of-range values", async () => {
    expandSection();
    fireEvent.change(view.container.querySelector("#vector-policy-dimension-1"), { target: { value: "3073" } });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1"), {
      target: { value: "/description" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-deploymentName-1"), {
      target: { value: "text-embedding-3-large" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-modelName-1"), {
      target: { value: "text-embedding-3-large" },
    });
    fireEvent.change(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1"), {
      target: { value: "https://my-foundry.openai.azure.com" },
    });

    await waitFor(() => {
      expect(screen.getByText("Dimension must be greater than 0 and less than or equal 3072")).toBeInTheDocument();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[2]).toBe(false);
    });
  });

  test("existing embedding source allows endpoint edit but keeps source fields read-only", async () => {
    const existingEmbedding: VectorEmbedding[] = [
      {
        path: "/vector4",
        dataType: "float32",
        distanceFunction: "cosine",
        dimensions: 1536,
        embeddingSource: {
          sourcePaths: ["/description"],
          deploymentName: "text-embedding-3-small",
          modelName: "text-embedding-3-small",
          endpoint: "https://old.openai.azure.com",
          authType: "Entra",
        },
      },
    ];
    const existingOnChange = jest.fn();
    const existingView = render(
      <VectorEmbeddingPoliciesComponent
        vectorEmbeddingsBaseline={existingEmbedding}
        vectorEmbeddings={existingEmbedding}
        vectorIndexes={[]}
        onVectorEmbeddingChange={existingOnChange}
      />,
    );

    const sourcePaths = existingView.container.querySelector(
      "#vector-policy-embeddingSource-sourcePaths-1",
    ) as HTMLInputElement;
    const endpoint = existingView.container.querySelector(
      "#vector-policy-embeddingSource-endpoint-1",
    ) as HTMLInputElement;
    expect(sourcePaths).toBeDisabled();
    expect(endpoint).not.toBeDisabled();

    for (const value of ["", "not-a-url"]) {
      fireEvent.change(endpoint, { target: { value } });
      await waitFor(() => {
        const lastCall = existingOnChange.mock.calls[existingOnChange.mock.calls.length - 1];
        expect(lastCall[2]).toBe(false);
        expect(endpoint).toBeEnabled();
        expect(sourcePaths).toBeDisabled();
      });
    }

    fireEvent.change(endpoint, { target: { value: "https://new.openai.azure.com" } });
    await waitFor(() => {
      const lastCall = existingOnChange.mock.calls[existingOnChange.mock.calls.length - 1];
      expect(lastCall[2]).toBe(true);
      expect(lastCall[0][0].embeddingSource.endpoint).toBe("https://new.openai.azure.com");
    });
  });

  test.each(["float32", "float16", "int8", "uint8"] as const)(
    "existing %s vector policy without an embedding source cannot add one",
    (dataType) => {
      const existingEmbedding: VectorEmbedding[] = [
        {
          path: "/vector5",
          dataType,
          distanceFunction: "cosine",
          dimensions: 1536,
        },
      ];
      const existingView = render(
        <VectorEmbeddingPoliciesComponent
          vectorEmbeddingsBaseline={existingEmbedding}
          vectorEmbeddings={existingEmbedding}
          vectorIndexes={[]}
          onVectorEmbeddingChange={jest.fn()}
        />,
      );

      fireEvent.click(existingView.container.querySelector('[data-test="VectorEmbeddingSource/Section/1"]'));

      expect(existingView.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1")).toBeDisabled();
      expect(existingView.container.querySelector("#vector-policy-embeddingSource-deploymentName-1")).toBeDisabled();
      expect(existingView.container.querySelector("#vector-policy-embeddingSource-modelName-1")).toBeDisabled();
      expect(existingView.container.querySelector("#vector-policy-embeddingSource-authType-1")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(existingView.container.querySelector("#vector-policy-embeddingSource-endpoint-1")).toBeDisabled();
    },
  );
});

describe("VectorEmbeddingPoliciesComponent - preserve selected data type", () => {
  test.each(["int8", "uint8"] as const)(
    "preserves a new %s policy's type when its endpoint is edited and cleared",
    (dataType) => {
      const embeddings: VectorEmbedding[] = [
        { path: "/vector", dataType, distanceFunction: "cosine", dimensions: 1536 },
      ];
      const onChange = jest.fn();
      const view = render(
        <VectorEmbeddingPoliciesComponent
          vectorEmbeddingsBaseline={[]}
          vectorEmbeddings={embeddings}
          vectorIndexes={[]}
          onVectorEmbeddingChange={onChange}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Embedding Configuration/ }));
      const endpoint = screen.getByRole("textbox", { name: "Microsoft Foundry Endpoint" });
      expect(endpoint).toBeEnabled();

      for (const value of ["not-a-url", "https://test.openai.azure.com", ""]) {
        fireEvent.change(endpoint, { target: { value } });
        const [policies, , valid] = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(policies[0].dataType).toBe(dataType);
        expect(valid).toBe(value === "");
        expect(endpoint).toBeEnabled();
        expect(view.container.querySelector("#vector-policy-path-1")).toBeEnabled();
        expect(view.container.querySelector("#vector-policy-dimension-1")).toBeEnabled();
        expect(screen.getByRole("textbox", { name: /^Source paths/ })).toBeEnabled();
      }
    },
  );

  test.each(["int8", "uint8"] as const)(
    "shows an error for %s with an embedding source until the user selects a supported type",
    (dataType) => {
      const embeddings: VectorEmbedding[] = [
        { path: "/vector", dataType, distanceFunction: "cosine", dimensions: 1536 },
      ];
      const onChange = jest.fn();
      render(
        <VectorEmbeddingPoliciesComponent
          vectorEmbeddingsBaseline={[]}
          vectorEmbeddings={embeddings}
          onVectorEmbeddingChange={onChange}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Embedding Configuration/ }));
      fireEvent.change(screen.getByRole("textbox", { name: /^Source paths/ }), {
        target: { value: "/description" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: /^Deployment name/ }), {
        target: { value: "my-deployment" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: /^Embedding model name/ }), {
        target: { value: "text-embedding-3-small" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Microsoft Foundry Endpoint" }), {
        target: { value: "https://test.cognitiveservices.azure.com/" },
      });

      const error = "Embedding generation supports only float32 or float16 data types";
      expect(screen.getByText(error)).toBeVisible();
      const [policies, , valid] = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(policies[0].dataType).toBe(dataType);
      expect(policies[0].embeddingSource).toBeDefined();
      expect(valid).toBe(false);
      const dataTypeDropdown = screen.getAllByRole("combobox")[0];
      expect(dataTypeDropdown).toHaveTextContent(dataType);
      fireEvent.click(dataTypeDropdown);
      fireEvent.click(screen.getByRole("option", { name: "float32", exact: true }));

      expect(screen.queryByText(error)).not.toBeInTheDocument();
      const [updatedPolicies, , updatedValid] = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(updatedPolicies[0].dataType).toBe("float32");
      expect(updatedValid).toBe(true);
    },
  );
});

describe("embedding endpoint validation", () => {
  test.each([
    ["https://test.openai.azure.com/", true],
    ["https://test.cognitiveservices.azure.com/", true],
    ["http://test.cognitiveservices.azure.com/", false],
    ["https://test.cognitiveservices.azure.com.example.org/", false],
    ["https://testcognitiveservices.azure.com/", false],
  ])("validates %s", (endpoint, valid) => {
    expect(isValidFoundryEndpoint(endpoint as string)).toBe(valid);
  });
});

describe("VectorEmbeddingPoliciesComponent - embedding source gating", () => {
  const newEmbedding: VectorEmbedding[] = [
    { path: "/vector3", dataType: "float32", distanceFunction: "cosine", dimensions: 1536 },
  ];

  test("hides the embedding source accordion when the integrated-embedding capability is missing", () => {
    const isEnabledSpy = jest.spyOn(CapabilityUtils, "isIntegratedEmbeddingEnabled").mockReturnValue(false);
    try {
      const view = render(
        <VectorEmbeddingPoliciesComponent
          vectorEmbeddingsBaseline={[]}
          vectorEmbeddings={newEmbedding}
          vectorIndexes={[]}
          onVectorEmbeddingChange={jest.fn()}
        />,
      );
      expect(screen.queryByText("Embedding Configuration (Preview)")).toBeNull();
      expect(view.container.querySelector("#vector-policy-embeddingSource-sourcePaths-1")).toBeNull();
      expect(view.container.querySelector("#vector-policy-embeddingSource-deploymentName-1")).toBeNull();
      expect(view.container.querySelector("#vector-policy-embeddingSource-modelName-1")).toBeNull();
      expect(view.container.querySelector("#vector-policy-embeddingSource-endpoint-1")).toBeNull();
      expect(view.container.querySelector("#vector-policy-embeddingSource-authType-1")).toBeNull();
    } finally {
      isEnabledSpy.mockReturnValue(true);
    }
  });
});
