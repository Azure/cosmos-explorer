import { shallow } from "enzyme";
import React from "react";
import { MongoIndexTypes, MongoNotificationType } from "../../SettingsUtils";
import { AddMongoIndexComponent, AddMongoIndexComponentProps } from "./AddMongoIndexComponent";

describe("AddMongoIndexComponent", () => {
  it("renders", () => {
    const props: AddMongoIndexComponentProps = {
      position: 1,
      description: "sample_key",
      type: MongoIndexTypes.Single,
      notification: { type: MongoNotificationType.Error, message: "sample error" },
      onIndexAddOrChange: () => {
        return;
      },
      onDiscard: () => {
        return;
      },
      setRef: () => {
        return;
      }
    };

    const wrapper = shallow(<AddMongoIndexComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
