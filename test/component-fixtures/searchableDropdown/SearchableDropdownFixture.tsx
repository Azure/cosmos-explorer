import { initializeIcons, Stack } from "@fluentui/react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SearchableDropdown } from "../../../src/Common/SearchableDropdown";

// Initialize Fluent UI icons
initializeIcons();

/**
 * Mock subscription data matching the Subscription interface shape.
 */
interface MockSubscription {
  subscriptionId: string;
  displayName: string;
  state: string;
}

/**
 * Mock database account data matching the DatabaseAccount interface shape.
 */
interface MockDatabaseAccount {
  id: string;
  name: string;
  location: string;
  type: string;
  kind: string;
}

const mockSubscriptions: MockSubscription[] = [
  { subscriptionId: "sub-001", displayName: "Development Subscription", state: "Enabled" },
  { subscriptionId: "sub-002", displayName: "Production Subscription", state: "Enabled" },
  { subscriptionId: "sub-003", displayName: "Testing Subscription", state: "Enabled" },
  { subscriptionId: "sub-004", displayName: "Staging Subscription", state: "Enabled" },
  { subscriptionId: "sub-005", displayName: "QA Subscription", state: "Enabled" },
];

const mockAccounts: MockDatabaseAccount[] = [
  {
    id: "acc-001",
    name: "cosmos-dev-westus",
    location: "westus",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
  },
  {
    id: "acc-002",
    name: "cosmos-prod-eastus",
    location: "eastus",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
  },
  {
    id: "acc-003",
    name: "cosmos-test-northeurope",
    location: "northeurope",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
  },
  {
    id: "acc-004",
    name: "cosmos-staging-westus2",
    location: "westus2",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
  },
];

const SearchableDropdownTestFixture: React.FC = () => {
  const [selectedSubscription, setSelectedSubscription] = React.useState<MockSubscription | null>(null);
  const [selectedAccount, setSelectedAccount] = React.useState<MockDatabaseAccount | null>(null);

  return (
    <Stack tokens={{ childrenGap: 20 }} style={{ padding: 20, maxWidth: 400 }}>
      <div data-test="subscription-dropdown">
        <SearchableDropdown<MockSubscription>
          label="Subscription"
          items={mockSubscriptions}
          selectedItem={selectedSubscription}
          onSelect={(sub) => setSelectedSubscription(sub)}
          getKey={(sub) => sub.subscriptionId}
          getDisplayText={(sub) => sub.displayName}
          placeholder="Select a Subscription"
          filterPlaceholder="Search by Subscription name"
          className="subscriptionDropdown"
        />
      </div>

      <div data-test="account-dropdown">
        <SearchableDropdown<MockDatabaseAccount>
          label="Cosmos DB Account"
          items={selectedSubscription ? mockAccounts : []}
          selectedItem={selectedAccount}
          onSelect={(account) => setSelectedAccount(account)}
          getKey={(account) => account.id}
          getDisplayText={(account) => account.name}
          placeholder="Select an Account"
          filterPlaceholder="Search by Account name"
          className="accountDropdown"
          disabled={!selectedSubscription}
        />
      </div>

      {/* Display selection state for test assertions */}
      <div data-test="selection-state">
        <div data-test="selected-subscription">{selectedSubscription?.displayName || ""}</div>
        <div data-test="selected-account">{selectedAccount?.name || ""}</div>
      </div>
    </Stack>
  );
};

ReactDOM.render(<SearchableDropdownTestFixture />, document.getElementById("root"));
