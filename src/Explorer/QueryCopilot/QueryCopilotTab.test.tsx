import { shallow } from "enzyme";
import { CopilotSubComponentNames } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import React from "react";
import { AppStateComponentNames, StorePath } from "Shared/AppStatePersistenceUtility";
import { updateUserContext } from "UserContext";
import Explorer from "../Explorer";
import { QueryCopilotTab } from "./QueryCopilotTab";

describe("Query copilot tab snapshot test", () => {
  it("should render with initial input", () => {
    updateUserContext({
      databaseAccount: {
        name: "name",
        properties: undefined,
        id: "",
        location: "",
        type: "",
        kind: "",
      },
    });

    const loadState = (path: StorePath) => {
      if (
        path.componentName === AppStateComponentNames.QueryCopilot &&
        path.subComponentName === CopilotSubComponentNames.toggleStatus
      ) {
        return { enabled: true };
      } else {
        return undefined;
      }
    };

    jest.mock("Shared/AppStatePersistenceUtility", () => ({
      loadState,
    }));

    const wrapper = shallow(<QueryCopilotTab explorer={new Explorer()} />);
    expect(wrapper).toMatchSnapshot();
  });
});
