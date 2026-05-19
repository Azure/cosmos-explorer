export function getNoSqlRbacToken(): string | undefined {
  let nosqlRbacToken: string | undefined;
  const shardIndex = process.env.PLAYWRIGHT_SHARD_INDEX ?? "";
  switch (parseInt(shardIndex)) {
    case 1:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_1_TOKEN;
      break;
    case 2:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_2_TOKEN;
      break;
    case 3:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_3_TOKEN;
      break;
    case 4:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_4_TOKEN;
      break;
    case 5:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_5_TOKEN;
      break;
    case 6:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_6_TOKEN;
      break;
    case 7:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_7_TOKEN;
      break;
    case 8:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_8_TOKEN;
      break;
    case 9:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_9_TOKEN;
      break;
    case 10:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_10_TOKEN;
      break;
    case 11:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_11_TOKEN;
      break;
    case 12:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_12_TOKEN;
      break;
    case 13:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_13_TOKEN;
      break;
    case 14:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_14_TOKEN;
      break;
    case 15:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_15_TOKEN;
      break;
    case 16:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_16_TOKEN;
      break;
    case 17:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_17_TOKEN;
      break;
    case 18:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_18_TOKEN;
      break;
    case 19:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_19_TOKEN;
      break;
    case 20:
      nosqlRbacToken = process.env.NOSQL_TESTACCOUNT_20_TOKEN;
      break;
  }

  if (!nosqlRbacToken) {
    console.warn(`No NoSQL RBAC token found for shard index ${shardIndex}`);
  }
  return nosqlRbacToken;
}
