import { shallow } from "enzyme";
import * as sinon from "sinon";
import React from "react";
import { CodeOfConductComponent, CodeOfConductComponentProps } from "./CodeOfConductComponent";
import { IJunoResponse, JunoClient } from "../../../Juno/JunoClient";
import { HttpStatusCodes } from "../../../Common/Constants";

sinon.stub(JunoClient.prototype, "acceptCodeOfConduct").returns({
  status: HttpStatusCodes.OK,
  data: true
} as IJunoResponse<boolean>);
const junoClient = new JunoClient(undefined);
const codeOfConductProps: CodeOfConductComponentProps = {
  junoClient: junoClient,
  onAcceptCodeOfConduct: jest.fn()
};

describe("CodeOfConductComponent", () => {
  it("renders", () => {
    const wrapper = shallow(<CodeOfConductComponent {...codeOfConductProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("onAcceptedCodeOfConductCalled", async () => {
    const wrapper = shallow(<CodeOfConductComponent {...codeOfConductProps} />);
    wrapper
      .find(".genericPaneSubmitBtn")
      .first()
      .simulate("click");
    await Promise.resolve();
    expect(codeOfConductProps.onAcceptCodeOfConduct).toBeCalled();
  });
});
