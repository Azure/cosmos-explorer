import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Subscription } from "../../../../../../Contracts/DataModels";
import Explorer from "../../../../../Explorer";
import CopyJobContextProvider from "../../../../Context/CopyJobContext";
import { SubscriptionDropdown } from "./SubscriptionDropdown";

jest.mock("../../../../../../hooks/useSubscriptions");
jest.mock("../../../../../../UserContext");
jest.mock("../../../../ContainerCopyMessages");

const mockUseSubscriptions = jest.requireMock("../../../../../../hooks/useSubscriptions").useSubscriptions;
const mockUserContext = jest.requireMock("../../../../../../UserContext").userContext;
const mockContainerCopyMessages = jest.requireMock("../../../../ContainerCopyMessages").default;

mockContainerCopyMessages.subscriptionDropdownLabel = "Subscription";
mockContainerCopyMessages.subscriptionDropdownPlaceholder = "Select a subscription";

describe("SubscriptionDropdown", () => {
  let mockExplorer: Explorer;
  const mockSubscriptions: Subscription[] = [
    {
      subscriptionId: "sub-1",
      displayName: "Subscription One",
      state: "Enabled",
      tenantId: "tenant-1",
    },
    {
      subscriptionId: "sub-2",
      displayName: "Subscription Two",
      state: "Enabled",
      tenantId: "tenant-1",
    },
    {
      subscriptionId: "sub-3",
      displayName: "Another Subscription",
      state: "Enabled",
      tenantId: "tenant-1",
    },
  ];

  const renderWithProvider = (children: React.ReactNode) => {
    return render(<CopyJobContextProvider explorer={mockExplorer}>{children}</CopyJobContextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExplorer = {} as Explorer;

    mockUseSubscriptions.mockReturnValue(mockSubscriptions);
    mockUserContext.subscriptionId = "sub-1";
  });

  describe("Rendering", () => {
    it("should render subscription dropdown with correct attributes", () => {
      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveAttribute("aria-label", "Subscription");
      expect(dropdown).toHaveAttribute("data-test", "subscription-dropdown");
      expect(dropdown).toBeRequired();
    });

    it("should render field label correctly", () => {
      renderWithProvider(<SubscriptionDropdown />);

      expect(screen.getByText("Subscription:")).toBeInTheDocument();
    });

    it("should show placeholder when no subscription is selected", async () => {
      mockUserContext.subscriptionId = "";
      mockUseSubscriptions.mockReturnValue([]);

      renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Select a subscription");
      });
    });
  });

  describe("Subscription Options", () => {
    it("should populate dropdown with available subscriptions", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        expect(screen.getByText("Subscription One", { selector: ".ms-Dropdown-optionText" })).toBeInTheDocument();
        expect(screen.getByText("Subscription Two", { selector: ".ms-Dropdown-optionText" })).toBeInTheDocument();
        expect(screen.getByText("Another Subscription", { selector: ".ms-Dropdown-optionText" })).toBeInTheDocument();
      });
    });

    it("should handle empty subscriptions list", () => {
      mockUseSubscriptions.mockReturnValue([]);

      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveTextContent("Select a subscription");
    });

    it("should handle undefined subscriptions", () => {
      mockUseSubscriptions.mockReturnValue(undefined);

      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveTextContent("Select a subscription");
    });
  });

  describe("Selection Logic", () => {
    it("should auto-select subscription based on userContext.subscriptionId on mount", async () => {
      mockUserContext.subscriptionId = "sub-2";

      renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Subscription Two");
      });
    });

    it("should maintain current selection when subscriptions list updates with same subscription", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Subscription One");
      });

      act(() => {
        mockUseSubscriptions.mockReturnValue([...mockSubscriptions]);
      });

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Subscription One");
      });
    });

    it("should prioritize current copyJobState subscription over userContext subscription", async () => {
      mockUserContext.subscriptionId = "sub-2";

      const { rerender } = renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Subscription Two");
      });

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        const option = screen.getByText("Another Subscription");
        fireEvent.click(option);
      });

      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SubscriptionDropdown />
        </CopyJobContextProvider>,
      );

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Another Subscription");
      });
    });

    it("should handle subscription selection change", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        const option = screen.getByText("Subscription Two");
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(dropdown).toHaveTextContent("Subscription Two");
      });
    });

    it("should not auto-select if target subscription not found in list", async () => {
      mockUserContext.subscriptionId = "non-existent-sub";

      renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Select a subscription");
      });
    });
  });

  describe("Context State Management", () => {
    it("should update copyJobState when subscription is selected", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        const option = screen.getByText("Subscription Two");
        fireEvent.click(option);
      });
      await waitFor(() => {
        expect(dropdown).toHaveTextContent("Subscription Two");
      });
    });

    it("should reset account when subscription changes", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Subscription One");
      });
      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        const option = screen.getByText("Subscription Two");
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(dropdown).toHaveTextContent("Subscription Two");
      });
    });

    it("should not update state if same subscription is selected", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      await waitFor(() => {
        const dropdown = screen.getByRole("combobox");
        expect(dropdown).toHaveTextContent("Subscription One");
      });

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);

      await waitFor(() => {
        const option = screen.getByText("Subscription One", { selector: ".ms-Dropdown-optionText" });
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(dropdown).toHaveTextContent("Subscription One");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle subscription change event with option missing data", async () => {
      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);
      expect(dropdown).toBeInTheDocument();
    });

    it("should handle subscriptions loading state", () => {
      mockUseSubscriptions.mockReturnValue(undefined);

      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveTextContent("Select a subscription");
    });

    it("should work when both userContext.subscriptionId and copyJobState subscription are null", () => {
      mockUserContext.subscriptionId = "";

      renderWithProvider(<SubscriptionDropdown />);

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveTextContent("Select a subscription");
    });
  });
});
