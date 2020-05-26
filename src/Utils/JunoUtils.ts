import * as DataModels from "../Contracts/DataModels";
import { config } from "../Config";

export class JunoUtils {
  public static async getLikedNotebooks(authorizationToken: string): Promise<DataModels.LikedNotebooksJunoResponse> {
    //TODO: Add Get method once juno has it implemented
    return {
      likedNotebooksContent: await JunoUtils.getOfficialSampleNotebooks(),
      userMetadata: {
        likedNotebooks: []
      }
    };
  }

  public static async getOfficialSampleNotebooks(): Promise<DataModels.GitHubInfoJunoResponse[]> {
    try {
      const response = await window.fetch(config.JUNO_ENDPOINT + "/api/galleries/notebooks", {
        method: "GET"
      });
      if (!response.ok) {
        throw new Error("Status code:" + response.status);
      }
      return await response.json();
    } catch (e) {
      throw new Error("Official samples fetch failed.");
    }
  }

  public static async updateUserMetadata(
    authorizationToken: string,
    userMetadata: DataModels.UserMetadata
  ): Promise<DataModels.UserMetadata> {
    return undefined;
    //TODO: add userMetadata updation code
  }

  public static async updateNotebookMetadata(
    authorizationToken: string,
    userMetadata: DataModels.NotebookMetadata
  ): Promise<DataModels.NotebookMetadata> {
    return undefined;
    //TODO: add notebookMetadata updation code
  }
}
