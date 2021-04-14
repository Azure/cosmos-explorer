import { shallow } from "enzyme";
import React from "react";
import {
  ConsoleDataType,
  NotificationConsoleComponent,
  NotificationConsoleComponentProps,
} from "./NotificationConsoleComponent";

describe("NotificationConsoleComponent", () => {
  const createBlankProps = (): NotificationConsoleComponentProps => {
    return {
      consoleData: undefined,
      isConsoleExpanded: false,
      inProgressConsoleDataIdToBeDeleted: "",
      setIsConsoleExpanded: (): void => undefined,
    };
  };

  it("renders the console", () => {
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper).toMatchSnapshot();

    props.consoleData = {
      type: ConsoleDataType.Info,
      date: "date",
      message: "message",
    };
    wrapper.setProps(props);
    expect(wrapper).toMatchSnapshot();
  });

  it("shows proper progress count", () => {
    const count = 100;
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    for (let i = 0; i < count; i++) {
      props.consoleData = {
        type: ConsoleDataType.InProgress,
        date: "date" + i,
        message: "message",
      };
      wrapper.setProps(props);
    }
    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual(count.toString());
    expect(wrapper.find(".notificationConsoleHeader .numErroredItems").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numInfoItems").text()).toEqual("0");
  });

  it("shows proper error count", () => {
    const count = 100;
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    for (let i = 0; i < count; i++) {
      props.consoleData = {
        type: ConsoleDataType.Error,
        date: "date" + i,
        message: "message",
      };
      wrapper.setProps(props);
    }

    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numErroredItems").text()).toEqual(count.toString());
    expect(wrapper.find(".notificationConsoleHeader .numInfoItems").text()).toEqual("0");
  });

  it("shows proper info count", () => {
    const count = 100;
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    for (let i = 0; i < count; i++) {
      props.consoleData = {
        type: ConsoleDataType.Info,
        date: "date" + i,
        message: "message",
      };
      wrapper.setProps(props);
    }

    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numErroredItems").text()).toEqual("0");
    expect(wrapper.find(".notificationConsoleHeader .numInfoItems").text()).toEqual(count.toString());
  });

  const testRenderNotification = (date: string, message: string, type: ConsoleDataType, iconClassName: string) => {
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    props.consoleData = {
      type,
      date,
      message,
    };
    wrapper.setProps(props);
    expect(wrapper.find(".notificationConsoleData .date").text()).toEqual(date);
    expect(wrapper.find(".notificationConsoleData .message").text()).toEqual(message);
    expect(wrapper.exists(`.notificationConsoleData .${iconClassName}`)).toBe(true);
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
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    props.consoleData = {
      type: ConsoleDataType.InProgress,
      date: "date",
      message: "message1",
    };
    wrapper.setProps(props);

    props.consoleData = {
      type: ConsoleDataType.Error,
      date: "date",
      message: "message2",
    };
    wrapper.setProps(props);

    props.consoleData = {
      type: ConsoleDataType.Info,
      date: "date",
      message: "message3",
    };
    wrapper.setProps(props);

    wrapper.find(".clearNotificationsButton").simulate("click");
    expect(wrapper.exists(".notificationConsoleData")).toBe(true);
  });

  it("collapses and hide content", () => {
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    props.consoleData = {
      type: ConsoleDataType.Info,
      date: "date",
      message: "message",
    };
    props.isConsoleExpanded = true;
    wrapper.setProps(props);

    wrapper.find(".notificationConsoleHeader").simulate("click");
    expect(wrapper.exists(".notificationConsoleContent")).toBe(false);
  });

  it("display latest data in header", () => {
    const latestData = "latest data";
    const props = createBlankProps();
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);

    props.consoleData = {
      type: ConsoleDataType.Info,
      date: "date",
      message: latestData,
    };
    props.isConsoleExpanded = true;
    wrapper.setProps(props);

    expect(wrapper.find(".headerStatusEllipsis").text()).toEqual(latestData);
  });

  it("delete in progress message", () => {
    const props = createBlankProps();
    props.consoleData = {
      type: ConsoleDataType.InProgress,
      date: "date",
      message: "message",
      id: "1",
    };
    const wrapper = shallow(<NotificationConsoleComponent {...props} />);
    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual("1");

    props.inProgressConsoleDataIdToBeDeleted = "1";
    wrapper.setProps(props);
    expect(wrapper.find(".notificationConsoleHeader .numInProgress").text()).toEqual("0");
  });
});
