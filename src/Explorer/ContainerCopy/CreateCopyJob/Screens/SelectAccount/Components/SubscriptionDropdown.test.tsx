import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { DropdownOptionType } from "../../../../Types/CopyJobTypes";
import { SubscriptionDropdown } from "./SubscriptionDropdown";

describe("SubscriptionDropdown", () => {
  const mockOnChange = jest.fn();

  const mockSubscriptionOptions: DropdownOptionType[] = [
    {
      key: "sub-1",
      text: "Development Subscription",
      data: {
        subscriptionId: "sub-1",
        displayName: "Development Subscription",
        authorizationSource: "RoleBased",
        subscriptionPolicies: {
          quotaId: "quota-1",
          spendingLimit: "Off",
          locationPlacementId: "loc-1",
        },
      },
    },
    {
      key: "sub-2",
      text: "Production Subscription",
      data: {
        subscriptionId: "sub-2",
        displayName: "Production Subscription",
        authorizationSource: "RoleBased",
        subscriptionPolicies: {
          quotaId: "quota-2",
          spendingLimit: "On",
          locationPlacementId: "loc-2",
        },
      },
    },
    {
      key: "sub-3",
      text: "Testing Subscription",
      data: {
        subscriptionId: "sub-3",
        displayName: "Testing Subscription",
        authorizationSource: "Legacy",
        subscriptionPolicies: {
          quotaId: "quota-3",
          spendingLimit: "Off",
          locationPlacementId: "loc-3",
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Snapshot Testing", () => {
    it("matches snapshot with all subscription options", () => {
      const { container } = render(<SubscriptionDropdown options={mockSubscriptionOptions} onChange={mockOnChange} />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with selected subscription", () => {
      const { container } = render(
        <SubscriptionDropdown options={mockSubscriptionOptions} selectedKey="sub-2" onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with empty options", () => {
      const { container } = render(<SubscriptionDropdown options={[]} onChange={mockOnChange} />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with single option", () => {
      const { container } = render(
        <SubscriptionDropdown options={[mockSubscriptionOptions[0]]} selectedKey="sub-1" onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with special characters in options", () => {
      const specialOptions = [
        {
          key: "special",
          text: 'Subscription with & <special> "characters"',
          data: { subscriptionId: "special" },
        },
      ];

      const { container } = render(<SubscriptionDropdown options={specialOptions} onChange={mockOnChange} />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with long subscription name", () => {
      const longNameOption = [
        {
          key: "long",
          text: "This is an extremely long subscription name that tests how the component handles text overflow and layout constraints",
          data: { subscriptionId: "long" },
        },
      ];

      const { container } = render(
        <SubscriptionDropdown options={longNameOption} selectedKey="long" onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
