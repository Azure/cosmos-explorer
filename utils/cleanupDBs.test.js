const assert = require("node:assert/strict");
const test = require("node:test");
const { parseCleanupMinimumAge, shouldDeleteResource } = require("./cleanupDBs");

const cleanupThreshold = Date.now();

test("uses a six-hour cleanup age when no value is configured", () => {
  assert.equal(parseCleanupMinimumAge(undefined), 6 * 60 * 60 * 1000);
});

test("accepts a finite positive cleanup age", () => {
  assert.equal(parseCleanupMinimumAge("12h"), 12 * 60 * 60 * 1000);
});

test("rejects unsafe cleanup ages", () => {
  for (const configuredAge of ["", "invalid", "0ms", "-1h", "Infinity"]) {
    assert.throws(() => parseCleanupMinimumAge(configuredAge), /E2E_CLEANUP_MINIMUM_AGE must be a positive duration/);
  }
});

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
