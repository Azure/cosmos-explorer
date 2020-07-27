import * as DataModels from "../Contracts/DataModels";
import { StringUtils } from "./StringUtils";

export class DatabaseAccountUtils {
  public static mergeDatabaseAccountWithGateway(
    databaseAccount: DataModels.DatabaseAccount,
    gatewayDatabaseAccount: DataModels.GatewayDatabaseAccount
  ): DataModels.DatabaseAccount {
    if (!databaseAccount || !gatewayDatabaseAccount) {
      return databaseAccount;
    }

    if (databaseAccount.properties && gatewayDatabaseAccount.EnableMultipleWriteLocations) {
      databaseAccount.properties.enableMultipleWriteLocations = gatewayDatabaseAccount.EnableMultipleWriteLocations;
    }

    if (databaseAccount.properties && !databaseAccount.properties.readLocations) {
      databaseAccount.properties.readLocations = DatabaseAccountUtils._convertToDatabaseAccountResponseLocation(
        gatewayDatabaseAccount.ReadableLocations
      );
    }

    if (databaseAccount.properties && !databaseAccount.properties.writeLocations) {
      databaseAccount.properties.writeLocations = DatabaseAccountUtils._convertToDatabaseAccountResponseLocation(
        gatewayDatabaseAccount.WritableLocations
      );
    }

    return databaseAccount;
  }

  private static _convertToDatabaseAccountResponseLocation(
    gatewayLocations: DataModels.RegionEndpoint[]
  ): DataModels.DatabaseAccountResponseLocation[] {
    if (!gatewayLocations) {
      return undefined;
    }

    return gatewayLocations.map((gatewayLocation: DataModels.RegionEndpoint, index: number) => {
      const responseLocation: DataModels.DatabaseAccountResponseLocation = {
        documentEndpoint: gatewayLocation.documentAccountEndpoint,
        locationName: gatewayLocation.name,
        failoverPriority: index,
        locationId: StringUtils.stripSpacesFromString(gatewayLocation.name).toLowerCase(),
        provisioningState: "Succeeded",
        id: gatewayLocation.name
      };

      return responseLocation;
    });
  }
}
