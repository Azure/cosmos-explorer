import { createUuid } from "./UuidUtils";

describe("createUuid", () => {
  it("creates a version 4 UUID", () => {
    expect(createUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
