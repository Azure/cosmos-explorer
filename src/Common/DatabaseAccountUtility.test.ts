import { WorkloadType } from "Common/Constants";
import { getWorkloadType } from "Common/DatabaseAccountUtility";
import { DatabaseAccount, Tags } from "Contracts/DataModels";
import { updateUserContext } from "UserContext";

describe("Database Account Utility", () => {
    describe("Workload Type", () => {
        it("Workload Type should return Learning", () => {
            updateUserContext({
                databaseAccount: {
                    tags: {
                        "hidden-workload-type": WorkloadType.Learning
                    } as Tags
                } as DatabaseAccount
            })

            const workloadType: WorkloadType = getWorkloadType();
            expect(workloadType).toBe(WorkloadType.Learning);
        });

        it("Workload Type should return None", () => {
            const workloadType: WorkloadType = getWorkloadType();
            expect(workloadType).toBe(WorkloadType.None);
        });
    })
})