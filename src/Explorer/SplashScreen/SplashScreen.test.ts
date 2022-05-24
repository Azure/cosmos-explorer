import { DataSamplesUtil } from "../DataSamples/DataSamplesUtil";
import Explorer from "../Explorer";
import { SplashScreen } from "./SplashScreen";
jest.mock("../Explorer");

const createExplorer = () => {
  const mock = new Explorer();
  return mock as jest.Mocked<Explorer>;
};

describe("SplashScreen", () => {
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
