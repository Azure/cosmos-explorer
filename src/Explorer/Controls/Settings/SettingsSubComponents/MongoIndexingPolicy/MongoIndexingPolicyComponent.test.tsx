import { shallow } from "enzyme";
import React from "react";
import { MongoIndexTypes, MongoNotificationMessage, MongoNotificationType } from "../../SettingsUtils";
import { MongoIndexingPolicyComponent, MongoIndexingPolicyComponentProps } from "./MongoIndexingPolicyComponent";

describe("MongoIndexingPolicyComponent", () => {
  const baseProps: MongoIndexingPolicyComponentProps = {
    mongoIndexes: [],
    onIndexDrop: () => {
      return;
    },
    indexesToDrop: [],
    onRevertIndexDrop: () => {
      return;
    },
    indexesToAdd: [],
    onRevertIndexAdd: () => {
      return;
    },
    onIndexAddOrChange: () => {
      return;
    },
    onMongoIndexingPolicySaveableChange: () => {
      return;
    },
    onMongoIndexingPolicyDiscardableChange: () => {
      return;
    }
  };

  it("renders", () => {
    const wrapper = shallow(<MongoIndexingPolicyComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  describe("AddMongoIndexProps test", () => {
    const wrapper = shallow(<MongoIndexingPolicyComponent {...baseProps} />);
    const mongoIndexingPolicyComponent = wrapper.instance() as MongoIndexingPolicyComponent;

    it("defaults", () => {
      expect(mongoIndexingPolicyComponent.isMongoIndexingPolicySaveable()).toEqual(false);
      expect(mongoIndexingPolicyComponent.isMongoIndexingPolicyDiscardable()).toEqual(false);
      expect(mongoIndexingPolicyComponent.getMongoWarningNotificationMessage()).toEqual(undefined);
    });

    const sampleWarning = "sampleWarning";
    const sampleError = "sampleError";

    const cases = [
      [
        { type: MongoNotificationType.Warning, message: sampleWarning } as MongoNotificationMessage,
        false,
        true,
        sampleWarning
      ],
      [{ type: MongoNotificationType.Error, message: sampleError } as MongoNotificationMessage, false, true, undefined],
      [undefined, true, true, undefined]
    ];

    test.each(cases)(
      "",
      (
        notification: MongoNotificationMessage,
        isMongoIndexingPolicySaveable: boolean,
        isMongoIndexingPolicyDiscardable: boolean,
        mongoWarningNotificationMessage: string
      ) => {
        const addMongoIndexProps = {
          mongoIndex: { key: { keys: ["sampleKey"] } },
          type: MongoIndexTypes.Single,
          notification: notification
        };

        wrapper.setProps({ indexesToAdd: [addMongoIndexProps] });
        wrapper.update();

        expect(mongoIndexingPolicyComponent.isMongoIndexingPolicySaveable()).toEqual(isMongoIndexingPolicySaveable);
        expect(mongoIndexingPolicyComponent.isMongoIndexingPolicyDiscardable()).toEqual(
          isMongoIndexingPolicyDiscardable
        );
        expect(mongoIndexingPolicyComponent.getMongoWarningNotificationMessage()).toEqual(
          mongoWarningNotificationMessage
        );
      }
    );
  });
});
