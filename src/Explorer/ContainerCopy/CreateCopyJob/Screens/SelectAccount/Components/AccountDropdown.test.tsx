import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { DropdownOptionType } from "../../../../Types/CopyJobTypes";
import { AccountDropdown } from "./AccountDropdown";

describe("AccountDropdown", () => {
  const mockOnChange = jest.fn();

  const mockAccountOptions: DropdownOptionType[] = [
    {
      key: "account-1",
      text: "Development Account",
      data: {
        id: "account-1",
        name: "Development Account",
        location: "East US",
        resourceGroup: "dev-rg",
        kind: "GlobalDocumentDB",
        properties: {
          documentEndpoint: "https://dev-account.documents.azure.com:443/",
          provisioningState: "Succeeded",
          consistencyPolicy: {
            defaultConsistencyLevel: "Session",
          },
        },
      },
    },
    {
      key: "account-2",
      text: "Production Account",
      data: {
        id: "account-2",
        name: "Production Account",
        location: "West US 2",
        resourceGroup: "prod-rg",
        kind: "GlobalDocumentDB",
        properties: {
          documentEndpoint: "https://prod-account.documents.azure.com:443/",
          provisioningState: "Succeeded",
          consistencyPolicy: {
            defaultConsistencyLevel: "Strong",
          },
        },
      },
    },
    {
      key: "account-3",
      text: "Testing Account",
      data: {
        id: "account-3",
        name: "Testing Account",
        location: "Central US",
        resourceGroup: "test-rg",
        kind: "GlobalDocumentDB",
        properties: {
          documentEndpoint: "https://test-account.documents.azure.com:443/",
          provisioningState: "Succeeded",
          consistencyPolicy: {
            defaultConsistencyLevel: "Eventual",
          },
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Snapshot Testing", () => {
    it("matches snapshot with all account options", () => {
      const { container } = render(
        <AccountDropdown options={mockAccountOptions} disabled={false} onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with selected account", () => {
      const { container } = render(
        <AccountDropdown
          options={mockAccountOptions}
          selectedKey="account-2"
          disabled={false}
          onChange={mockOnChange}
        />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with disabled dropdown", () => {
      const { container } = render(
        <AccountDropdown
          options={mockAccountOptions}
          selectedKey="account-1"
          disabled={true}
          onChange={mockOnChange}
        />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with empty options", () => {
      const { container } = render(<AccountDropdown options={[]} disabled={false} onChange={mockOnChange} />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with single option", () => {
      const { container } = render(
        <AccountDropdown
          options={[mockAccountOptions[0]]}
          selectedKey="account-1"
          disabled={false}
          onChange={mockOnChange}
        />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with special characters in options", () => {
      const specialOptions = [
        {
          key: "special",
          text: 'Account with & <special> "characters"',
          data: {
            id: "special",
            name: 'Account with & <special> "characters"',
            location: "East US",
          },
        },
      ];

      const { container } = render(
        <AccountDropdown options={specialOptions} disabled={false} onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with long account name", () => {
      const longNameOption = [
        {
          key: "long",
          text: "This is an extremely long account name that tests how the component handles text overflow and layout constraints in the dropdown",
          data: {
            id: "long",
            name: "This is an extremely long account name that tests how the component handles text overflow and layout constraints in the dropdown",
            location: "North Central US",
          },
        },
      ];

      const { container } = render(
        <AccountDropdown options={longNameOption} selectedKey="long" disabled={false} onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with disabled state and no selection", () => {
      const { container } = render(
        <AccountDropdown options={mockAccountOptions} disabled={true} onChange={mockOnChange} />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot with multiple account types", () => {
      const mixedAccountOptions = [
        {
          key: "sql-account",
          text: "SQL API Account",
          data: {
            id: "sql-account",
            name: "SQL API Account",
            kind: "GlobalDocumentDB",
            location: "East US",
          },
        },
        {
          key: "mongo-account",
          text: "MongoDB Account",
          data: {
            id: "mongo-account",
            name: "MongoDB Account",
            kind: "MongoDB",
            location: "West US",
          },
        },
        {
          key: "cassandra-account",
          text: "Cassandra Account",
          data: {
            id: "cassandra-account",
            name: "Cassandra Account",
            kind: "Cassandra",
            location: "Central US",
          },
        },
      ];

      const { container } = render(
        <AccountDropdown
          options={mixedAccountOptions}
          selectedKey="mongo-account"
          disabled={false}
          onChange={mockOnChange}
        />,
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
