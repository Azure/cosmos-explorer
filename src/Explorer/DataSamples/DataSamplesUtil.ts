import * as ViewModels from "../../Contracts/ViewModels";
import { userContext } from "../../UserContext";
import { logConsoleError, logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import { useDialog } from "../Controls/Dialog";
import Explorer from "../Explorer";
import { useDatabases } from "../useDatabases";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";

// TODO: this does not seem to be used. Remove?
export class DataSamplesUtil {
  private static readonly DialogTitle = "Create Sample Container";
  constructor(private container: Explorer) {}

  /**
   * Check if Database/Container is already there: if so, show modal to delete
   * If not, create and show modal to confirm.
   */
  public async createSampleContainerAsync(): Promise<void> {
    const generator = await this.createGeneratorAsync();

    const databaseName = generator.getDatabaseId();
    const containerName = generator.getCollectionId();
    if (this.hasContainer(databaseName, containerName, useDatabases.getState().databases)) {
      const msg = `The container ${containerName} in database ${databaseName} already exists. Please delete it and retry.`;
      useDialog.getState().showOkModalDialog(DataSamplesUtil.DialogTitle, msg);
      logConsoleError(msg);
      return;
    }

    await generator
      .createSampleContainerAsync()
      .catch((error) => logConsoleError(`Error creating sample container: ${error}`));
    const msg = `The sample ${containerName} in database ${databaseName} has been successfully created.`;
    useDialog.getState().showOkModalDialog(DataSamplesUtil.DialogTitle, msg);
    logConsoleInfo(msg);
  }

  /**
   * Public for unit tests
   */
  public async createGeneratorAsync(): Promise<ContainerSampleGenerator> {
    return await ContainerSampleGenerator.createSampleGeneratorAsync(this.container);
  }

  /**
   * Public for unit tests
   * @param databaseName
   * @param containerName
   * @param containerDatabases
   */
  public hasContainer(databaseName: string, containerName: string, containerDatabases: ViewModels.Database[]): boolean {
    const filteredDatabases = containerDatabases.filter((database) => database.id() === databaseName);
    return (
      filteredDatabases.length > 0 &&
      filteredDatabases[0].collections().filter((collection) => collection.id() === containerName).length > 0
    );
  }

  public isSampleContainerCreationSupported(): boolean {
    return userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
  }
}
