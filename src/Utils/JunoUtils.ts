import * as DataModels from "../Contracts/DataModels";
import { config } from "../Config";
import { RepoListItem } from "../Explorer/Controls/GitHub/GitHubReposComponent";
import { IPinnedRepo } from "../Juno/JunoClient";
import { IGitHubRepo } from "../GitHub/GitHubClient";

export class JunoUtils {
  public static async getLikedNotebooks(authorizationToken: string): Promise<DataModels.LikedNotebooksJunoResponse> {
    //TODO: Add Get method once juno has it implemented
    return {
      likedNotebooksContent: [],
      userMetadata: {
        likedNotebooks: []
      }
    };
  }

  public static async getOfficialSampleNotebooks(
    authorizationToken: string
  ): Promise<DataModels.GitHubInfoJunoResponse[]> {
    try {
      const response = await window.fetch(config.JUNO_ENDPOINT + "/api/notebooks/galleries", {
        method: "GET",
        headers: {
          authorization: authorizationToken
        }
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
    // TODO: Make sure to throw error if failed
  }

  public static async updateNotebookMetadata(
    authorizationToken: string,
    notebookMetadata: DataModels.NotebookMetadata
  ): Promise<DataModels.NotebookMetadata> {
    return undefined;
    //TODO: add notebookMetadata updation code
    // TODO: Make sure to throw error if failed
  }

  public static toPinnedRepo(item: RepoListItem): IPinnedRepo {
    return {
      owner: item.repo.owner,
      name: item.repo.name,
      private: item.repo.private,
      branches: item.branches.map(element => ({ name: element.name }))
    };
  }

  public static toGitHubRepo(pinnedRepo: IPinnedRepo): IGitHubRepo {
    return {
      owner: pinnedRepo.owner,
      name: pinnedRepo.name,
      private: pinnedRepo.private
    };
  }
}
