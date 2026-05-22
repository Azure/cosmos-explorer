import { Callout, IconButton, Link } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { FeedbackButtons } from "Explorer/QueryCopilot/V2/Bubbles/Output/Buttons/Feedback/FeedbackButtons";
import { shallow } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import LikeHover from "../../../../../../../../images/CopilotLikeHover.svg";
import LikePressed from "../../../../../../../../images/CopilotLikePressed.svg";
import LikeRest from "../../../../../../../../images/CopilotLikeRest.svg";

useId as jest.Mock;

jest.mock("../../../../../../../../images/CopilotLikeHover.svg", () => "LikeHover");
jest.mock("../../../../../../../../images/CopilotLikePressed.svg", () => "LikePressed");
jest.mock("../../../../../../../../images/CopilotLikeRest.svg", () => "LikeRest");

beforeEach(() => {
  jest.resetAllMocks();
});

describe("Feedback buttons snapshot tests", () => {
  it("should click like and show callout", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let likeButton = wrapper.find(IconButton).first();
    const dislikeButton = wrapper.find(IconButton).last();
    likeButton.simulate("click");
    likeButton = wrapper.find(IconButton).first();
    const callout = wrapper.find(Callout).first();

    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikeRest);
    expect(callout.exists()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should click like and dismiss callout", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    const likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("click");
    let callout = wrapper.find(Callout).first();
    callout.simulate("dismiss");
    callout = wrapper.find(Callout).first();

    expect(callout.exists()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should click like and submit feedback", () => {
    const spy = jest.spyOn(useQueryCopilot.getState(), "openFeedbackModal");
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    const likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("click");
    const link = wrapper.find(Link).first();
    link.simulate("click");

    expect(spy).toHaveBeenNthCalledWith(1, "", true, "");
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over like", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("mouseover");
    likeButton = wrapper.find(IconButton).first();

    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikeHover);
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over rest like and leave", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("mouseover");
    likeButton.simulate("mouseleave");
    likeButton = wrapper.find(IconButton).first();

    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikeRest);
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over pressed like and leave", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("click");
    likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("mouseover");
    likeButton.simulate("mouseleave");

    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over like and click", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("mouseover");
    likeButton.simulate("click");
    likeButton = wrapper.find(IconButton).first();

    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    expect(wrapper).toMatchSnapshot();
  });

  it("should dobule click on like", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let likeButton = wrapper.find(IconButton).first();
    likeButton.simulate("click");
    likeButton = wrapper.find(IconButton).first();
    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikePressed);

    likeButton.simulate("click");
    likeButton = wrapper.find(IconButton).first();
    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikeRest);
    expect(wrapper).toMatchSnapshot();
  });

  it("should click dislike and show popup", () => {
    const spy = jest.spyOn(useQueryCopilot.getState(), "openFeedbackModal");
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    const likeButton = wrapper.find(IconButton).first();
    let dislikeButton = wrapper.find(IconButton).last();
    dislikeButton.simulate("click");
    const callout = wrapper.find(Callout).first();
    dislikeButton = wrapper.find(IconButton).last();

    expect(likeButton.props().iconProps.imageProps.src).toEqual(LikeRest);
    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    expect(spy).toHaveBeenNthCalledWith(1, "", false, "");
    expect(callout.exists()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over dislike", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let dislikeButton = wrapper.find(IconButton).last();
    dislikeButton.simulate("mouseover");
    dislikeButton = wrapper.find(IconButton).last();

    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikeHover);
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over rest dislike and leave", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let dislikeButton = wrapper.find(IconButton).last();
    dislikeButton.simulate("mouseover");
    dislikeButton.simulate("mouseleave");
    dislikeButton = wrapper.find(IconButton).last();

    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikeRest);
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over pressed dislike and leave", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let dislikeButton = wrapper.find(IconButton).last();
    dislikeButton.simulate("click");
    dislikeButton = wrapper.find(IconButton).last();
    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    dislikeButton.simulate("mouseover");
    dislikeButton.simulate("mouseleave");
    dislikeButton = wrapper.find(IconButton).last();

    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    expect(wrapper).toMatchSnapshot();
  });

  it("should hover over dislike and click", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let dislikeButton = wrapper.find(IconButton).last();
    dislikeButton.simulate("mouseover");
    dislikeButton.simulate("click");
    dislikeButton = wrapper.find(IconButton).last();

    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikePressed);
    expect(wrapper).toMatchSnapshot();
  });

  it("should dobule click on dislike", () => {
    const wrapper = shallow(<FeedbackButtons sqlQuery={""} />);

    let dislikeButton = wrapper.find(IconButton).last();
    dislikeButton.simulate("click");
    dislikeButton = wrapper.find(IconButton).last();
    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikePressed);

    dislikeButton.simulate("click");
    dislikeButton = wrapper.find(IconButton).last();
    expect(dislikeButton.props().iconProps.imageProps.src).toEqual(LikeRest);
    expect(wrapper).toMatchSnapshot();
  });
});
