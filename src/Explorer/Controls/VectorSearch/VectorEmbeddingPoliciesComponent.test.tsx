import "@testing-library/jest-dom";
import { RenderResult, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import React from "react";
import { VectorEmbeddingPoliciesComponent } from "./VectorEmbeddingPoliciesComponent";

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
    const deleteButton = component.container.querySelector("#delete-vector-policy-1");
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
    await waitFor(() => expect(screen.getByText("Vector embedding path should not be empty")).toBeInTheDocument(), {
      timeout: 1500,
    });
    await waitFor(
      () =>
        expect(
          screen.getByText("Vector embedding dimension must be greater than 0 and less than or equal 4096"),
        ).toBeInTheDocument(),
      {
        timeout: 1500,
      },
    );
    fireEvent.change(component.container.querySelector("#vector-policy-dimension-1"), { target: { value: "4096" } });
    fireEvent.change(screen.getByPlaceholderText("/vector1"), { target: { value: "/vector1" } });
    await waitFor(() => expect(screen.queryByText("Vector embedding path should not be empty")).toBeNull(), {
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
