import { IsValidCosmosDbResourceId } from "Utils/ValidationUtils";

const testCases = [
  ["validId", true],
  ["forward/slash", false],
  ["back\\slash", false],
  ["question?mark", false],
  ["hash#mark", false],
  ["?invalidstart", false],
  ["invalidEnd/", false],
  ["space-at-end ", false],
];

describe("IsValidCosmosDbResourceId", () => {
  test.each(testCases)("IsValidCosmosDbResourceId(%p). Expected: %p", (id: string, expected: boolean) => {
    expect(IsValidCosmosDbResourceId(id)).toBe(expected);
  });
});
