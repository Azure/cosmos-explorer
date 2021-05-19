import { mount, shallow, ShallowWrapper } from "enzyme";
import React from "react";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";
import { NewVertexPanel } from "./NewVertexPanel";

describe("New Vertex Panel", () => {
  let fakeExplorer: Explorer;
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    fakeExplorer = new Explorer();
  });

  it("should render default property", () => {
    const props = {
      explorer: fakeExplorer,
      partitionKeyPropertyProp: "",
      onSubmit: (): void => undefined,
      openNotificationConsole: (): void => undefined,
    };
    wrapper = shallow(<NewVertexPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render button in footer", () => {
    const button = wrapper.find("PrimaryButton").first();
    expect(button).toBeDefined();
  });

  it("should render form", () => {
    const form = wrapper.find("form").first();
    expect(form).toBeDefined();
  });

  it("should call form submit method", () => {
    const onSubmitSpy = jest.fn();

    const newWrapper = mount(
      <NewVertexPanel
        explorer={fakeExplorer}
        partitionKeyPropertyProp={undefined}
        openNotificationConsole={(): void => undefined}
        onSubmit={onSubmitSpy}
      />
    );
    //eslint-disable-next-line
    newWrapper.find("form").simulate("submit", { preventDefault: () => {} });

    expect(onSubmitSpy).toHaveBeenCalled();
  });

  it("should call error and success scenario method", () => {
    const onSubmitSpy = jest.fn();
    const onErrorSpy = jest.fn();
    const onSuccessSpy = jest.fn();
    const fakeNewVertexData: ViewModels.NewVertexData = {
      label: "",
      properties: [],
    };

    const result = onSubmitSpy(fakeNewVertexData, onErrorSpy, onSuccessSpy);

    const newWrapper = mount(
      <NewVertexPanel
        explorer={fakeExplorer}
        partitionKeyPropertyProp={undefined}
        openNotificationConsole={(): void => undefined}
        onSubmit={onSubmitSpy}
      />
    );
    //eslint-disable-next-line
    newWrapper.find("form").simulate("submit", { preventDefault: () => {} });

    expect(result).toBeUndefined();
    expect(onSubmitSpy).toHaveBeenCalledWith(fakeNewVertexData, onErrorSpy, onSuccessSpy);
  });
});
