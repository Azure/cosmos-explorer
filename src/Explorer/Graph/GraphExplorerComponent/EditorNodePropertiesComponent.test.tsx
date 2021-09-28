import { shallow } from "enzyme";
import React from "react";
import { EditorNodePropertiesComponent, EditorNodePropertiesComponentProps } from "./EditorNodePropertiesComponent";

describe("<EditorNodePropertiesComponent />", () => {
  // Tests that: single value prop is rendered with a textbox and a delete button
  // multi-value prop only a delete button (cannot be edited)
  const onUpdateProperties = jest.fn();
  it("renders component", () => {
    const props: EditorNodePropertiesComponentProps = {
      editedProperties: {
        pkId: "id",
        readOnlyProperties: [
          {
            key: "singlevalueprop",
            values: [{ value: "abcd", type: "string" }],
          },
          {
            key: "multivaluesprop",
            values: [
              { value: "efgh", type: "string" },
              { value: 1234, type: "number" },
              { value: true, type: "boolean" },
              { value: false, type: "boolean" },
              { value: undefined, type: "null" },
            ],
          },
        ],
        existingProperties: [
          {
            key: "singlevalueprop2",
            values: [{ value: "ijkl", type: "string" }],
          },
          {
            key: "multivaluesprop2",
            values: [
              { value: "mnop", type: "string" },
              { value: 5678, type: "number" },
              { value: true, type: "boolean" },
              { value: false, type: "boolean" },
              { value: undefined, type: "null" },
            ],
          },
        ],
        addedProperties: [],
        droppedKeys: [],
      },
      onUpdateProperties,
    };
    const wrapper = shallow(<EditorNodePropertiesComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders proper unicode", () => {
    const props: EditorNodePropertiesComponentProps = {
      editedProperties: {
        pkId: "id",
        readOnlyProperties: [
          {
            key: "unicode1",
            values: [{ value: "Véronique", type: "string" }],
          },
          {
            key: "unicode2",
            values: [{ value: "亜妃子", type: "string" }],
          },
        ],
        existingProperties: [
          {
            key: "unicode1",
            values: [{ value: "André", type: "string" }],
          },
          {
            key: "unicode2",
            values: [{ value: "あきら, アキラ,安喜良", type: "string" }],
          },
        ],
        addedProperties: [],
        droppedKeys: [],
      },
      onUpdateProperties,
    };
    const wrapper = shallow(<EditorNodePropertiesComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
