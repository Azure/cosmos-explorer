jest.mock("../../Utils/arm/request");
jest.mock("../MessageHandler");
import { deleteDatabase } from "./deleteDatabase";
import { armRequest } from "../../Utils/arm/request";
import { AuthType } from "../../AuthType";
import { sendCachedDataMessage } from "../MessageHandler";

describe("deleteDatabase", () => {
  it("should call ARM if logged in with AAD", async () => {
    window.authType = AuthType.AAD;
    (sendCachedDataMessage as jest.Mock).mockResolvedValue(undefined);
    await deleteDatabase("database");
    expect(armRequest).toHaveBeenCalled();
  });
  // TODO: Test non-AAD case
});
