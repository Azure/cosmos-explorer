const assert = require("node:assert/strict");
const test = require("node:test");
const { generateUniqueName } = require("./testResourceName");

const noRandomSuffix = { length: 0 };

test("includes the workflow run and attempt in CI resource names", () => {
  const name = generateUniqueName("db", noRandomSuffix, {
    GITHUB_RUN_ID: "12345",
    GITHUB_RUN_ATTEMPT: "2",
  });

  assert.match(name, /^t_12345_2_db_\d+$/);
});

test("defaults a missing workflow attempt to one", () => {
  const name = generateUniqueName("db", noRandomSuffix, { GITHUB_RUN_ID: "12345" });

  assert.match(name, /^t_12345_1_db_\d+$/);
});

test("preserves the local resource name format outside GitHub Actions", () => {
  const name = generateUniqueName("db", noRandomSuffix, {});

  assert.match(name, /^t_db_\d+$/);
});

test("omits the test and workflow prefixes when requested", () => {
  const name = generateUniqueName(
    "db",
    { ...noRandomSuffix, prefixed: false },
    {
      GITHUB_RUN_ID: "12345",
      GITHUB_RUN_ATTEMPT: "2",
    },
  );

  assert.match(name, /^db_\d+$/);
});

test("omits the timestamp when requested", () => {
  const name = generateUniqueName(
    "db",
    { ...noRandomSuffix, timestampped: false },
    {
      GITHUB_RUN_ID: "12345",
      GITHUB_RUN_ATTEMPT: "2",
    },
  );

  assert.equal(name, "t_12345_2_db");
});
