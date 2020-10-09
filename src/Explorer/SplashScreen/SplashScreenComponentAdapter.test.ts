import * as ko from "knockout";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import { SplashScreenComponentAdapter } from "./SplashScreenComponentApdapter";
import { TabsManager } from "../Tabs/TabsManager";
import Explorer from "../Explorer";
jest.mock("../Explorer");

const createExplorer = () => {
  const mock = new Explorer({} as any);
  mock.selectedNode = ko.observable();
  mock.isNotebookEnabled = ko.observable(false);
  mock.addCollectionText = ko.observable("add collection");
  mock.tabsManager = new TabsManager();
  return mock as jest.Mocked<Explorer>;
};

describe("SplashScreenComponentAdapter", () => {
  it("allows sample collection creation for supported api's", () => {
    const explorer = createExplorer();
    const dataSampleUtil = new DataSamplesUtil(explorer);
    const createStub = jest
      .spyOn(dataSampleUtil, "createGeneratorAsync")
      .mockImplementation(() => Promise.reject(undefined));

    // Sample is supported
    jest.spyOn(dataSampleUtil, "isSampleContainerCreationSupported").mockImplementation(() => true);

    const splashScreenAdapter = new SplashScreenComponentAdapter(explorer);
    jest.spyOn(splashScreenAdapter, "createDataSampleUtil").mockImplementation(() => dataSampleUtil);
    const mainButtons = splashScreenAdapter.createMainItems();

    // Press all buttons and make sure create gets called
    mainButtons.forEach(button => {
      try {
        button.onClick();
      } catch (e) {
        // noop
      }
    });
    expect(createStub).toHaveBeenCalled();
  });

  it("does not allow sample collection creation for non-supported api's", () => {
    const explorerStub = createExplorer();
    const dataSampleUtil = new DataSamplesUtil(explorerStub);
    const createStub = jest
      .spyOn(dataSampleUtil, "createGeneratorAsync")
      .mockImplementation(() => Promise.reject(undefined));

    // Sample is not supported
    jest.spyOn(dataSampleUtil, "isSampleContainerCreationSupported").mockImplementation(() => false);

    const splashScreenAdapter = new SplashScreenComponentAdapter(explorerStub);
    jest.spyOn(splashScreenAdapter, "createDataSampleUtil").mockImplementation(() => dataSampleUtil);
    const mainButtons = splashScreenAdapter.createMainItems();

    // Press all buttons and make sure create doesn't get called
    mainButtons.forEach(button => {
      try {
        button.onClick();
      } catch (e) {
        // noop
      }
    });
    expect(createStub).not.toHaveBeenCalled();
  });
});
