jest.mock("../../../../Juno/JunoClient");
import { shallow } from "enzyme";
import React from "react";
import { CodeOfConductComponent, CodeOfConductComponentProps } from ".";
import { HttpStatusCodes } from "../../../../Common/Constants";
import { JunoClient } from "../../../../Juno/JunoClient";

describe("CodeOfConductComponent", () => {
  let codeOfConductProps: CodeOfConductComponentProps;

  beforeEach(() => {
    const junoClient = new JunoClient();
    junoClient.acceptCodeOfConduct = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      data: true,
    });
    codeOfConductProps = {
      junoClient: junoClient,
      onAcceptCodeOfConduct: jest.fn(),
    };
  });

  it("renders", () => {
    const wrapper = shallow(<CodeOfConductComponent {...codeOfConductProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("onAcceptedCodeOfConductCalled", async () => {
    const wrapper = shallow(<CodeOfConductComponent {...codeOfConductProps} />);
    wrapper.find(".genericPaneSubmitBtn").first().simulate("click");
    await Promise.resolve();
    expect(codeOfConductProps.onAcceptCodeOfConduct).toBeCalled();
  });
});
