import * as ko from "knockout";
import { NewVertexComponent, NewVertexViewModel } from "./NewVertexComponent";

const component = NewVertexComponent;

describe("New Vertex Component", () => {
  let vm: NewVertexViewModel;
  let partitionKeyProperty: ko.Observable<string>;

  beforeEach(async () => {
    document.body.innerHTML = component.template as any;
    partitionKeyProperty = ko.observable(null);
    vm = new component.viewModel({
      newVertexData: null,
      partitionKeyProperty
    });
    ko.applyBindings(vm);
  });

  afterEach(() => {
    ko.cleanNode(document);
  });

  describe("Rendering", () => {
    it("should display property list with input and +Add Property", () => {
      expect(document.querySelector(".newVertexComponent .newVertexForm")).not.toBeNull();
      expect(document.querySelector(".newVertexComponent .edgeInput")).not.toBeNull();
      expect(document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn")).not.toBeNull();
    });

    it("should display partition key property if set", () => {
      partitionKeyProperty("testKey");
      expect(
        (document.querySelector(".newVertexComponent .newVertexForm .labelCol input") as HTMLInputElement).value
      ).toEqual("testKey");
    });

    it("should NOT display partition key property if NOT set", () => {
      expect(document.getElementsByClassName("valueCol").length).toBe(0);
    });
  });

  describe("Behavior", () => {
    let clickSpy: jasmine.Spy;

    beforeEach(() => {
      clickSpy = jasmine.createSpy("Command button click spy");
    });

    it("should add new property row when +Add property button is pressed", () => {
      document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn").dispatchEvent(new Event("click"));
      document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn").dispatchEvent(new Event("click"));
      document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn").dispatchEvent(new Event("click"));
      expect(document.getElementsByClassName("valueCol").length).toBe(3);
      expect(document.getElementsByClassName("rightPaneTrashIcon").length).toBe(3);
    });

    it("should remove property row when trash button is pressed", () => {
      document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn").dispatchEvent(new Event("click"));
      document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn").dispatchEvent(new Event("click"));

      // Mark this one to delete
      const elts = document.querySelectorAll(".newVertexComponent .rightPaneTrashIconImg");
      elts[elts.length - 1].className += " deleteme";

      document.querySelector(".newVertexComponent .rightPaneAddPropertyBtn").dispatchEvent(new Event("click"));
      document
        .querySelector(".newVertexComponent .rightPaneTrashIconImg.deleteme")
        .parentElement.dispatchEvent(new Event("click"));
      expect(document.getElementsByClassName("valueCol").length).toBe(2);
      expect(document.getElementsByClassName("rightPaneTrashIcon").length).toBe(2);
      expect(document.querySelectorAll(".newVertexComponent .rightPaneTrashIconImg.deleteme").length).toBe(0);
    });
  });
});
