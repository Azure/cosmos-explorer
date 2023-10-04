import { shallow } from "enzyme";
import React from "react";
import { MongoIndexTypes, MongoNotificationMessage, MongoNotificationType } from "../../SettingsUtils";
import { MongoIndexingPolicyComponent, MongoIndexingPolicyComponentProps } from "./MongoIndexingPolicyComponent";
import { renderToString } from "react-dom/server";

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
    refreshIndexTransformationProgress: () => new Promise(jest.fn()),
    onMongoIndexingPolicySaveableChange: () => {
      return;
    },
    onMongoIndexingPolicyDiscardableChange: () => {
      return;
    },
  };

  it("renders", () => {
    const wrapper = shallow(<MongoIndexingPolicyComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("error shown for collection with compound indexes", () => {
    const props = { ...baseProps, mongoIndexes: [{ key: { keys: ["prop1", "prop2"] } }] };
    const wrapper = shallow(<MongoIndexingPolicyComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
    const mongoIndexingPolicyComponent = wrapper.instance() as MongoIndexingPolicyComponent;
    expect(mongoIndexingPolicyComponent.hasCompoundIndex()).toBeTruthy();
  });

  describe("AddMongoIndexProps test", () => {
    const wrapper = shallow(<MongoIndexingPolicyComponent {...baseProps} />);
    const mongoIndexingPolicyComponent = wrapper.instance() as MongoIndexingPolicyComponent;

    it("defaults", () => {
      expect(mongoIndexingPolicyComponent.isMongoIndexingPolicySaveable()).toEqual(false);
      expect(mongoIndexingPolicyComponent.isMongoIndexingPolicyDiscardable()).toEqual(false);
      expect(mongoIndexingPolicyComponent.getMongoWarningNotificationMessage()).toBeUndefined();
    });

    const sampleWarning = "sampleWarning";
    const sampleError = "sampleError";

    const cases = [
      [
        { type: MongoNotificationType.Warning, message: sampleWarning } as MongoNotificationMessage,
        false,
        false,
        true,
        sampleWarning,
      ],
      [
        { type: MongoNotificationType.Error, message: sampleError } as MongoNotificationMessage,
        false,
        false,
        true,
        undefined,
      ],
      [
        { type: MongoNotificationType.Error, message: sampleError } as MongoNotificationMessage,
        true,
        false,
        true,
        undefined,
      ],
      [undefined, false, true, true, undefined],
      [undefined, true, true, true, undefined],
    ];

    test.each(cases)(
      "",
      (
        notification: MongoNotificationMessage,
        indexToDropIsPresent: boolean,
        isMongoIndexingPolicySaveable: boolean,
        isMongoIndexingPolicyDiscardable: boolean,
        mongoWarningNotificationMessage: string,
      ) => {
        const addMongoIndexProps = {
          mongoIndex: { key: { keys: ["sampleKey"] } },
          type: MongoIndexTypes.Single,
          notification: notification,
        };

        let indexesToDrop: number[] = [];
        if (indexToDropIsPresent) {
          indexesToDrop = [0];
        }
        wrapper.setProps({ indexesToAdd: [addMongoIndexProps], indexesToDrop: indexesToDrop });
        wrapper.update();

        expect(mongoIndexingPolicyComponent.isMongoIndexingPolicySaveable()).toEqual(isMongoIndexingPolicySaveable);
        expect(mongoIndexingPolicyComponent.isMongoIndexingPolicyDiscardable()).toEqual(
          isMongoIndexingPolicyDiscardable,
        );
        if (mongoWarningNotificationMessage) {
          const elementAsString = renderToString(mongoIndexingPolicyComponent.getMongoWarningNotificationMessage());
          expect(elementAsString).toContain(mongoWarningNotificationMessage);
        } else {
          expect(mongoIndexingPolicyComponent.getMongoWarningNotificationMessage()).toBeUndefined();
        }
      },
    );
  });
});
