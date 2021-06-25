import * as ko from "knockout";
import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import { SplashScreen } from "./SplashScreen";
jest.mock("../Explorer");

const createExplorer = () => {
  const mock = new Explorer();
  mock.isNotebookEnabled = ko.observable(false);
  return mock as jest.Mocked<Explorer>;
};

describe("SplashScreen", () => {
  it("allows sample collection creation for supported api's", () => {
    const explorer = createExplorer();
    const dataSampleUtil = new DataSamplesUtil(explorer);
    const createStub = jest
      .spyOn(dataSampleUtil, "createGeneratorAsync")
      .mockImplementation(() => Promise.reject(undefined));

    // Sample is supported
    jest.spyOn(dataSampleUtil, "isSampleContainerCreationSupported").mockImplementation(() => true);

    const splashScreen = new SplashScreen({ explorer });
    jest.spyOn(splashScreen, "createDataSampleUtil").mockImplementation(() => dataSampleUtil);
    const mainButtons = splashScreen.createMainItems();

    // Press all buttons and make sure create gets called
    mainButtons.forEach((button) => {
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

    const splashScreen = new SplashScreen({ explorer: explorerStub });
    jest.spyOn(splashScreen, "createDataSampleUtil").mockImplementation(() => dataSampleUtil);
    const mainButtons = splashScreen.createMainItems();

    // Press all buttons and make sure create doesn't get called
    mainButtons.forEach((button) => {
      try {
        button.onClick();
      } catch (e) {
        // noop
      }
    });
    expect(createStub).not.toHaveBeenCalled();
  });
});
