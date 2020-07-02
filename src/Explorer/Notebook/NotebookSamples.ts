import { IGitHubRepo, IGitHubBranch } from "../../GitHub/GitHubClient";

export const SamplesRepo: IGitHubRepo = {
  name: "cosmos-notebooks",
  owner: "Azure-Samples",
  private: false,
};

export const SamplesBranch: IGitHubBranch = {
  name: "master",
};

export const isSamplesCall = (owner: string, repo: string, branch?: string): boolean => {
  return owner === SamplesRepo.owner && repo === SamplesRepo.name && (!branch || branch === SamplesBranch.name);
};

// GitHub API calls have a rate limit of 5000 requests per hour. So if we get high traffic on Data Explorer
// loading samples exceed that limit. Using this hard coded response for samples until we fix that.
export const SamplesContentsQueryResponse = {
  repository: {
    owner: {
      login: "Azure-Samples",
    },
    name: "cosmos-notebooks",
    isPrivate: false,
    ref: {
      name: "master",
      target: {
        history: {
          nodes: [
            {
              oid: "cda7facb9e039b173f3376200c26c859896e7974",
              message:
                "Merge pull request #45 from Azure-Samples/users/deborahc/pythonSampleUpdates\n\nAdd bokeh version to notebook",
              committer: {
                date: "2020-05-28T11:28:01-07:00",
              },
            },
          ],
        },
      },
    },
    object: {
      entries: [
        {
          name: ".github",
          type: "tree",
          object: {},
        },
        {
          name: ".gitignore",
          type: "blob",
          object: {
            oid: "3e759b75bf455ac809d0987d369aab89137b5689",
            byteSize: 5582,
          },
        },
        {
          name: "1. GettingStarted.ipynb",
          type: "blob",
          object: {
            oid: "0732ff5366e4aefdc4c378c61cbd968664f0acec",
            byteSize: 3933,
          },
        },
        {
          name: "2. Visualization.ipynb",
          type: "blob",
          object: {
            oid: "6b16b0740a77afdd38a95bc6c3ebd0f2f17d9465",
            byteSize: 820317,
          },
        },
        {
          name: "3. RequestUnits.ipynb",
          type: "blob",
          object: {
            oid: "252b79a4adc81e9f2ffde453231b695d75e270e8",
            byteSize: 9490,
          },
        },
        {
          name: "4. Indexing.ipynb",
          type: "blob",
          object: {
            oid: "e10dd67bd1c55c345226769e4f80e43659ef9cd5",
            byteSize: 10394,
          },
        },
        {
          name: "5. StoredProcedures.ipynb",
          type: "blob",
          object: {
            oid: "949941949920de4d2d111149e2182e9657cc8134",
            byteSize: 11818,
          },
        },
        {
          name: "6. GlobalDistribution.ipynb",
          type: "blob",
          object: {
            oid: "b91c31dacacbc9e35750d9054063dda4a5309f3b",
            byteSize: 11375,
          },
        },
        {
          name: "7. IoTAnomalyDetection.ipynb",
          type: "blob",
          object: {
            oid: "82057ae52a67721a5966e2361317f5dfbd0ee595",
            byteSize: 377939,
          },
        },
        {
          name: "All_API_quickstarts",
          type: "tree",
          object: {},
        },
        {
          name: "CSharp_quickstarts",
          type: "tree",
          object: {},
        },
      ],
    },
  },
};
