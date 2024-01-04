jest.mock("../../../../Juno/JunoClient");
import { shallow } from "enzyme";
import React from "react";
import { HttpStatusCodes } from "../../../../Common/Constants";
import { JunoClient } from "../../../../Juno/JunoClient";
import { CodeOfConduct, CodeOfConductProps } from "./CodeOfConduct";

describe("CodeOfConduct", () => {
  let codeOfConductProps: CodeOfConductProps;

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
    const wrapper = shallow(<CodeOfConduct {...codeOfConductProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("onAcceptedCodeOfConductCalled", async () => {
    const wrapper = shallow(<CodeOfConduct {...codeOfConductProps} />);
    wrapper.find(".genericPaneSubmitBtn").first().simulate("click");
    await Promise.resolve();
    expect(codeOfConductProps.onAcceptCodeOfConduct).toHaveBeenCalled();
  });
});
