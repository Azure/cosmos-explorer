import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import InfoTooltip from "./InfoTooltip";

describe("InfoTooltip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render null when no content is provided", () => {
      const { container } = render(<InfoTooltip />);
      expect(container.firstChild).toBeNull();
    });

    it("should render null when content is undefined", () => {
      const { container } = render(<InfoTooltip content={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render tooltip with image when content is provided", () => {
      const { container } = render(<InfoTooltip content="Test tooltip content" />);
      expect(container).toMatchSnapshot();
    });

    it("should render with JSX element content", () => {
      const jsxContent = (
        <div>
          <strong>Important:</strong> This is a JSX tooltip
        </div>
      );

      const { container } = render(<InfoTooltip content={jsxContent} />);

      expect(container).toMatchSnapshot();
    });
  });
});
