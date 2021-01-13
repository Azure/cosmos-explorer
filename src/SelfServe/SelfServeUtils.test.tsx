import {
  CommonInputTypes,
  mapToSmartUiDescriptor,
  SelfServeBaseClass,
  updateContextWithDecorator
} from "./SelfServeUtils";
import { InputType, UiType } from "./../Explorer/Controls/SmartUi/SmartUiComponent";

describe("SelfServeUtils", () => {
  it("initialize should be declared for self serve classes", () => {
    class Test extends SelfServeBaseClass {
      public onSubmit = async (): Promise<void> => {
        return;
      };
      public initialize: () => Promise<Map<string, InputType>>;
    }
    expect(() => new Test().toSmartUiDescriptor()).toThrow("initialize() was not declared for the class 'Test'");
  });

  it("onSubmit should be declared for self serve classes", () => {
    class Test extends SelfServeBaseClass {
      public onSubmit: () => Promise<void>;
      public initialize = async (): Promise<Map<string, InputType>> => {
        return undefined;
      };
    }
    expect(() => new Test().toSmartUiDescriptor()).toThrow("onSubmit() was not declared for the class 'Test'");
  });

  it("@SmartUi decorator must be present for self serve classes", () => {
    class Test extends SelfServeBaseClass {
      public onSubmit = async (): Promise<void> => {
        return;
      };
      public initialize = async (): Promise<Map<string, InputType>> => {
        return undefined;
      };
    }
    expect(() => new Test().toSmartUiDescriptor()).toThrow("@SmartUi decorator was not declared for the class 'Test'");
  });

  it("updateContextWithDecorator", () => {
    const context = new Map<string, CommonInputTypes>();
    updateContextWithDecorator(context, "dbThroughput", "testClass", "max", 1);
    updateContextWithDecorator(context, "dbThroughput", "testClass", "min", 2);
    updateContextWithDecorator(context, "collThroughput", "testClass", "max", 5);
    expect(context.size).toEqual(2);
    expect(context.get("dbThroughput")).toEqual({ id: "dbThroughput", max: 1, min: 2 });
    expect(context.get("collThroughput")).toEqual({ id: "collThroughput", max: 5 });
  });

  it("mapToSmartUiDescriptor", () => {
    const context: Map<string, CommonInputTypes> = new Map([
      [
        "dbThroughput",
        {
          id: "dbThroughput",
          dataFieldName: "dbThroughput",
          type: "number",
          label: "Database Throughput",
          min: 1,
          max: 5,
          step: 1,
          uiType: UiType.Slider
        }
      ],
      [
        "collThroughput",
        {
          id: "collThroughput",
          dataFieldName: "collThroughput",
          type: "number",
          label: "Coll Throughput",
          min: 1,
          max: 5,
          step: 1,
          uiType: UiType.Spinner
        }
      ],
      [
        "invalidThroughput",
        {
          id: "invalidThroughput",
          dataFieldName: "invalidThroughput",
          type: "boolean",
          label: "Invalid Coll Throughput",
          min: 1,
          max: 5,
          step: 1,
          uiType: UiType.Spinner,
          errorMessage: "label, truelabel and falselabel are required for boolean input"
        }
      ],
      [
        "collName",
        {
          id: "collName",
          dataFieldName: "collName",
          type: "string",
          label: "Coll Name",
          placeholder: "placeholder text"
        }
      ],
      [
        "enableLogging",
        {
          id: "enableLogging",
          dataFieldName: "enableLogging",
          type: "boolean",
          label: "Enable Logging",
          trueLabel: "Enable",
          falseLabel: "Disable"
        }
      ],
      [
        "invalidEnableLogging",
        {
          id: "invalidEnableLogging",
          dataFieldName: "invalidEnableLogging",
          type: "boolean",
          label: "Invalid Enable Logging",
          placeholder: "placeholder text"
        }
      ],
      [
        "regions",
        {
          id: "regions",
          dataFieldName: "regions",
          type: "object",
          label: "Regions",
          choices: [
            { label: "South West US", key: "SWUS" },
            { label: "North Central US", key: "NCUS" },
            { label: "East US 2", key: "EUS2" }
          ]
        }
      ],
      [
        "invalidRegions",
        {
          id: "invalidRegions",
          dataFieldName: "invalidRegions",
          type: "object",
          label: "Invalid Regions",
          placeholder: "placeholder text"
        }
      ]
    ]);
    const expectedDescriptor = {
      root: {
        id: "root",
        children: [
          {
            id: "dbThroughput",
            input: {
              id: "dbThroughput",
              dataFieldName: "dbThroughput",
              type: "number",
              label: "Database Throughput",
              min: 1,
              max: 5,
              step: 1,
              uiType: "Slider"
            },
            children: [] as Node[]
          },
          {
            id: "collThroughput",
            input: {
              id: "collThroughput",
              dataFieldName: "collThroughput",
              type: "number",
              label: "Coll Throughput",
              min: 1,
              max: 5,
              step: 1,
              uiType: "Spinner"
            },
            children: [] as Node[]
          },
          {
            id: "invalidThroughput",
            input: {
              id: "invalidThroughput",
              dataFieldName: "invalidThroughput",
              type: "boolean",
              label: "Invalid Coll Throughput",
              min: 1,
              max: 5,
              step: 1,
              uiType: "Spinner",
              errorMessage: "label, truelabel and falselabel are required for boolean input 'invalidThroughput'."
            },
            children: [] as Node[]
          },
          {
            id: "collName",
            input: {
              id: "collName",
              dataFieldName: "collName",
              type: "string",
              label: "Coll Name",
              placeholder: "placeholder text"
            },
            children: [] as Node[]
          },
          {
            id: "enableLogging",
            input: {
              id: "enableLogging",
              dataFieldName: "enableLogging",
              type: "boolean",
              label: "Enable Logging",
              trueLabel: "Enable",
              falseLabel: "Disable"
            },
            children: [] as Node[]
          },
          {
            id: "invalidEnableLogging",
            input: {
              id: "invalidEnableLogging",
              dataFieldName: "invalidEnableLogging",
              type: "boolean",
              label: "Invalid Enable Logging",
              placeholder: "placeholder text",
              errorMessage: "label, truelabel and falselabel are required for boolean input 'invalidEnableLogging'."
            },
            children: [] as Node[]
          },
          {
            id: "regions",
            input: {
              id: "regions",
              dataFieldName: "regions",
              type: "object",
              label: "Regions",
              choices: [
                { label: "South West US", key: "SWUS" },
                { label: "North Central US", key: "NCUS" },
                { label: "East US 2", key: "EUS2" }
              ]
            },
            children: [] as Node[]
          },
          {
            id: "invalidRegions",
            input: {
              id: "invalidRegions",
              dataFieldName: "invalidRegions",
              type: "object",
              label: "Invalid Regions",
              placeholder: "placeholder text",
              errorMessage: "label and choices are required for Dropdown input 'invalidRegions'."
            },
            children: [] as Node[]
          }
        ]
      },
      inputNames: [
        "dbThroughput",
        "collThroughput",
        "invalidThroughput",
        "collName",
        "enableLogging",
        "invalidEnableLogging",
        "regions",
        "invalidRegions"
      ]
    };
    const descriptor = mapToSmartUiDescriptor(context);
    expect(descriptor).toEqual(expectedDescriptor);
  });
});
