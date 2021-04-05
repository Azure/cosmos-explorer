import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import Explorer from "../../../Explorer";
import QueryViewModel from "../../../Tables/QueryBuilder/QueryViewModel";
import { TableQuerySelectPanel } from "./index";

describe("Table query select Panel", () => {
  const fakeExplorer = {} as Explorer;
  const fakeQueryViewModal = {} as QueryViewModel;
  fakeQueryViewModal.columnOptions = ko.observableArray<string>([""])

  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
    queryViewModel: fakeQueryViewModal
  };

  it("should render Default properly", () => {
    const wrapper = mount(<TableQuerySelectPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
