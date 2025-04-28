import { shallow } from "enzyme";
import { PartitionKeyComponent, PartitionKeyComponentProps } from "Explorer/Controls/Settings/SettingsSubComponents/PartitionKeyComponent";
import Explorer from "Explorer/Explorer";
import React from "react";

describe("PartitionKeyComponent", () => {
  // Create a test setup function to get fresh instances for each test
  const setupTest = () => {
    // Create an instance of the mocked Explorer
    const explorer = new Explorer();
    // Create minimal mock objects for database and collection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockDatabase = {} as any as import("../../../../Contracts/ViewModels").Database;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockCollection = {} as any as import("../../../../Contracts/ViewModels").Collection;

    // Create props with the mocked Explorer instance
    const props: PartitionKeyComponentProps = {
      database: mockDatabase,
      collection: mockCollection,
      explorer
    };

    return { explorer, props };
  };

  it("renders default component and matches snapshot", () => {
    const { props } = setupTest();
    const wrapper = shallow(<PartitionKeyComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders read-only component and matches snapshot", () => {
    const { props } = setupTest();
    const wrapper = shallow(<PartitionKeyComponent {...props} isReadOnly={true} />);
    expect(wrapper).toMatchSnapshot();
  });
});