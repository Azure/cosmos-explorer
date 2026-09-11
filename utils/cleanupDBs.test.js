const assert = require("node:assert/strict");
const test = require("node:test");
const { shouldDeleteResource } = require("./cleanupDBs");

const cleanupThreshold = Date.now();

test("deletes owned test resources older than the threshold", () => {
  assert.equal(shouldDeleteResource("t_12345_1_dbab_1000", cleanupThreshold - 1, cleanupThreshold), true);
});

test("keeps owned test resources at or newer than the threshold", () => {
  assert.equal(shouldDeleteResource("t_12345_1_dbab_1000", cleanupThreshold, cleanupThreshold), false);
  assert.equal(shouldDeleteResource("t_12345_1_dbab_1000", cleanupThreshold + 1, cleanupThreshold), false);
});

test("keeps resources that are not marked as test-owned", () => {
  assert.equal(shouldDeleteResource("seeded-database", cleanupThreshold - 1, cleanupThreshold), false);
});

test("keeps resources without a valid name or timestamp", () => {
  assert.equal(shouldDeleteResource(undefined, cleanupThreshold - 1, cleanupThreshold), false);
  assert.equal(shouldDeleteResource("t_12345_1_dbab_1000", undefined, cleanupThreshold), false);
});
