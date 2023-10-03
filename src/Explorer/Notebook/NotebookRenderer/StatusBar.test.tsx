import { shallow } from "enzyme";
import React from "react";
import { StatusBar } from "./StatusBar";

describe("StatusBar", () => {
  test("can render on a dummyNotebook", () => {
    const lastSaved = new Date();
    const kernelSpecDisplayName = "python3";

    const component = shallow(
      <StatusBar kernelStatus="kernel status" lastSaved={lastSaved} kernelSpecDisplayName={kernelSpecDisplayName} />,
    );

    expect(component).not.toBeNull();
  });
  test("Update if kernelSpecDisplayName has changed", () => {
    const lastSaved = new Date();
    const kernelSpecDisplayName = "python3";

    const component = shallow(
      <StatusBar kernelStatus="kernel status" lastSaved={lastSaved} kernelSpecDisplayName={kernelSpecDisplayName} />,
    );

    const shouldUpdate = component.instance().shouldComponentUpdate(
      {
        lastSaved,
        kernelSpecDisplayName: "javascript",
        kernelStatus: "kernelStatus",
      },
      undefined,
      undefined,
    );
    expect(shouldUpdate).toBe(true);
  });
  test("update if kernelStatus has changed", () => {
    const lastSaved = new Date();
    const kernelSpecDisplayName = "python3";

    const component = shallow(
      <StatusBar kernelStatus="kernel status" lastSaved={lastSaved} kernelSpecDisplayName={kernelSpecDisplayName} />,
    );

    const shouldUpdate = component.instance().shouldComponentUpdate(
      {
        lastSaved: new Date(),
        kernelSpecDisplayName: "python3",
        kernelStatus: "kernelStatus",
      },
      undefined,
      undefined,
    );
    expect(shouldUpdate).toBe(true);
  });
});
