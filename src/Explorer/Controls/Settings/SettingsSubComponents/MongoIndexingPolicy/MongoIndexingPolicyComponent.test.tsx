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
    indexTransformationProgress: undefined,
    refreshIndexTransformationProgress: () =>
      new Promise(() => {
        return;
      }),
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

  it("isIndexingTransforming", () => {
    const wrapper = shallow(<MongoIndexingPolicyComponent {...baseProps} />);
    const mongoIndexingPolicyComponent = wrapper.instance() as MongoIndexingPolicyComponent;
    expect(mongoIndexingPolicyComponent.isIndexingTransforming()).toEqual(false);
    wrapper.setProps({ indexTransformationProgress: 50 });
    expect(mongoIndexingPolicyComponent.isIndexingTransforming()).toEqual(true);
    wrapper.setProps({ indexTransformationProgress: 100 });
    expect(mongoIndexingPolicyComponent.isIndexingTransforming()).toEqual(false);
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
        false,
        true,
        sampleWarning
      ],
      [
        { type: MongoNotificationType.Error, message: sampleError } as MongoNotificationMessage,
        false,
        false,
        true,
        undefined
      ],
      [
        { type: MongoNotificationType.Error, message: sampleError } as MongoNotificationMessage,
        true,
        false,
        true,
        undefined
      ],
      [undefined, false, true, true, undefined],
      [undefined, true, true, true, undefined]
    ];

    test.each(cases)(
      "",
      (
        notification: MongoNotificationMessage,
        indexToDropIsPresent: boolean,
        isMongoIndexingPolicySaveable: boolean,
        isMongoIndexingPolicyDiscardable: boolean,
        mongoWarningNotificationMessage: string
      ) => {
        const addMongoIndexProps = {
          mongoIndex: { key: { keys: ["sampleKey"] } },
          type: MongoIndexTypes.Single,
          notification: notification
        };

        let indexesToDrop: number[] = [];
        if (indexToDropIsPresent) {
          indexesToDrop = [0];
        }
        wrapper.setProps({ indexesToAdd: [addMongoIndexProps], indexesToDrop: indexesToDrop });
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
