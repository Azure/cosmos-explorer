import { shallow } from "enzyme";
import React from "react";
import { ConflictResolutionComponentProps, ConflictResolutionComponent } from "./ConflictResolutionComponent";
import { container, collection } from "../TestUtils";
import { StatefulValue } from "../../StatefulValue";
import * as DataModels from "../../../../Contracts/DataModels";

describe("ConflictResolutionComponent", () => {
  const props: ConflictResolutionComponentProps = {
    collection: collection,
    container: container,
    conflictResolutionPolicyMode: new StatefulValue<DataModels.ConflictResolutionMode>(
      DataModels.ConflictResolutionMode.Custom
    ),
    onConflictResolutionPolicyModeChange: () => {
      return;
    },
    conflictResolutionPolicyPath: new StatefulValue<"">(),
    onConflictResolutionPolicyPathChange: () => {
      return;
    },
    conflictResolutionPolicyProcedure: new StatefulValue<"">(),
    onConflictResolutionPolicyProcedureChange: () => {
      return;
    }
  };

  it("Sproc text field displayed", () => {
    const wrapper = shallow(<ConflictResolutionComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#conflictResolutionCustomTextField")).toEqual(true);
    expect(wrapper.exists("#conflictResolutionLwwTextField")).toEqual(false);
  });

  it("Path text field displayed", () => {
    props.conflictResolutionPolicyMode = new StatefulValue<DataModels.ConflictResolutionMode>(
      DataModels.ConflictResolutionMode.LastWriterWins
    );
    const wrapper = shallow(<ConflictResolutionComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.exists("#conflictResolutionCustomTextField")).toEqual(false);
    expect(wrapper.exists("#conflictResolutionLwwTextField")).toEqual(true);
  });
});
