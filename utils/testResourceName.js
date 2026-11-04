const crypto = require("crypto");

function generateUniqueName(baseName, options, environment = process.env) {
  const length = options?.length ?? 1;
  const timestamp = options?.timestampped === undefined ? true : options.timestampped;
  const prefixed = options?.prefixed === undefined ? true : options.prefixed;

  const runId = environment.GITHUB_RUN_ID;
  const runAttempt = environment.GITHUB_RUN_ATTEMPT ?? "1";
  const runPrefix = runId ? `${runId}_${runAttempt}_` : "";
  const prefix = prefixed ? `t_${runPrefix}` : "";
  const suffix = timestamp ? `_${Date.now()}` : "";
  return `${prefix}${baseName}${crypto.randomBytes(length).toString("hex")}${suffix}`;
}

module.exports = { generateUniqueName };
