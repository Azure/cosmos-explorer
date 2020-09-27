import { shallow } from "enzyme";
import React from "react";
import { ConflictResolutionComponentProps, ConflictResolutionComponent } from "./ConflictResolutionComponent";
import { container, collection } from "../TestUtils";
import * as DataModels from "../../../../Contracts/DataModels";

describe("ConflictResolutionComponent", () => {
  const baseProps: ConflictResolutionComponentProps = {
    collection: collection,
    container: container,
    conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.Custom,
    conflictResolutionPolicyModeBaseline: DataModels.ConflictResolutionMode.Custom,
    onConflictResolutionPolicyModeChange: () => {
      return;
    },
    conflictResolutionPolicyPath: "",
    conflictResolutionPolicyPathBaseline: "",
    onConflictResolutionPolicyPathChange: () => {
      return;
    },
    conflictResolutionPolicyProcedure: "",
    conflictResolutionPolicyProcedureBaseline: "",
    onConflictResolutionPolicyProcedureChange: () => {
      return;
    },
    onConflictResolutionDirtyChange: () => {
      return;
    }
  };

  it("Sproc text field displayed", () => {
    const wrapper = shallow(<ConflictResolutionComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#conflictResolutionCustomTextField")).toEqual(true);
    expect(wrapper.exists("#conflictResolutionLwwTextField")).toEqual(false);
  });

  it("Path text field displayed", () => {
    const props = { ...baseProps, conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.LastWriterWins };
    const wrapper = shallow(<ConflictResolutionComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#conflictResolutionCustomTextField")).toEqual(false);
    expect(wrapper.exists("#conflictResolutionLwwTextField")).toEqual(true);
  });

  it("conflict resolution policy dirty is set", () => {
    let conflictRsolutionComponent = new ConflictResolutionComponent(baseProps)
    expect(conflictRsolutionComponent.IsComponentDirty()).toEqual(false)

    const newProps = {...baseProps, conflictResolutionPolicyMode: DataModels.ConflictResolutionMode.LastWriterWins}
    conflictRsolutionComponent = new ConflictResolutionComponent(newProps)
    expect(conflictRsolutionComponent.IsComponentDirty()).toEqual(true)
  });
});
