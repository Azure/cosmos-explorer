import React from "react";
import { shallow } from "enzyme";
import {
  NotificationConsoleComponentProps,
  ConsoleData,
  NotificationConsoleComponent,
  ConsoleDataType,
} from "./NotificationConsoleComponent";

describe("NotificationConsoleComponent", () => {
  const createBlankProps = (): NotificationConsoleComponentProps => {
    return {
      consoleData: [],
      isConsoleExpanded: true,
      onConsoleDataChange: (consoleData: ConsoleData[]) => {},
      onConsoleExpandedChange: (isExpanded: boolean) => {},
    };
  };

  it("renders the console (expanded)", () => {
    const props = createBlankProps();
    props.consoleData.push({
      type: ConsoleDataType.Info,
      date: "date",
      message: "message",
    });

    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("shows proper progress count", () => {
    const count = 100;
    const props = createBlankProps();

    for (let i = 0; i < count; i++) {
      props.consoleData.push({
        type: ConsoleDataType.InProgress,
        date: "date",
        message: "message",
      });
    }

    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual(count.toString());
    expect(wrapper.find(".notificationConsoleHeader .numErroredItems").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numInfoItems").text()).toEqual("0");
  });

  it("shows proper error count", () => {
    const count = 100;
    const props = createBlankProps();

    for (let i = 0; i < count; i++) {
      props.consoleData.push({
        type: ConsoleDataType.Error,
        date: "date",
        message: "message",
      });
    }

    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numErroredItems").text()).toEqual(count.toString());
    expect(wrapper.find(".notificationConsoleHeader .numInfoItems").text()).toEqual("0");
  });

  it("shows proper info count", () => {
    const count = 100;
    const props = createBlankProps();

    for (let i = 0; i < count; i++) {
      props.consoleData.push({
        type: ConsoleDataType.Info,
        date: "date",
        message: "message",
      });
    }

    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numErroredItems").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numInfoItems").text()).toEqual(count.toString());
  });

  const testRenderNotification = (date: string, msg: string, type: ConsoleDataType, iconClassName: string) => {
    const props = createBlankProps();
    props.consoleData.push({
      date: date,
      message: msg,
      type: type,
    });
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper.find(".notificationConsoleData .date").text()).toEqual(date);
    expect(wrapper.find(".notificationConsoleData .message").text()).toEqual(msg);
    expect(wrapper.exists(`.notificationConsoleData .${iconClassName}`));
  };

  it("renders progress notifications", () => {
    testRenderNotification("date", "message", ConsoleDataType.InProgress, "loaderIcon");
  });

  it("renders error notifications", () => {
    testRenderNotification("date", "message", ConsoleDataType.Error, "errorIcon");
  });

  it("renders info notifications", () => {
    testRenderNotification("date", "message", ConsoleDataType.Info, "infoIcon");
  });

  it("clears notifications", () => {
    const props = createBlankProps();
    props.consoleData.push({
      type: ConsoleDataType.InProgress,
      date: "date",
      message: "message1",
    });
    props.consoleData.push({
      type: ConsoleDataType.Error,
      date: "date",
      message: "message2",
    });
    props.consoleData.push({
      type: ConsoleDataType.Info,
      date: "date",
      message: "message3",
    });

    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    wrapper.find(".clearNotificationsButton").simulate("click");

    expect(!wrapper.exists(".notificationConsoleData"));
  });

  it("collapses and hide content", () => {
    const props = createBlankProps();
    props.consoleData.push({
      date: "date",
      message: "message",
      type: ConsoleDataType.Info,
    });
    props.isConsoleExpanded = true;

    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    wrapper.find(".notificationConsoleHeader").simulate("click");
    expect(!wrapper.exists(".notificationConsoleContent"));
  });

  it("display latest data in header", () => {
    const latestData = "latest data";
    const props1 = createBlankProps();
    const props2 = createBlankProps();
    props2.consoleData.push({
      date: "date",
      message: latestData,
      type: ConsoleDataType.Info,
    });
    props2.isConsoleExpanded = true;

    const wrapper = shallow(<NotificationConsoleComponent {...props1} />);
    wrapper.setProps(props2);
    expect(wrapper.find(".headerStatusEllipsis").text()).toEqual(latestData);
  });
});
