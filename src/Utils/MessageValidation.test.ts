import { isInvalidParentFrameOrigin } from "./MessageValidation";

test.each`
  domain                                             | expected
  ${"https://cosmos.azure.com"}                      | ${false}
  ${"https://cosmos.azure.us"}                       | ${false}
  ${"https://cosmos.azure.cn"}                       | ${false}
  ${"https://cosmos.microsoftazure.de"}              | ${false}
  ${"https://portal.azure.com"}                      | ${false}
  ${"https://portal.azure.us"}                       | ${false}
  ${"https://portal.azure.cn"}                       | ${false}
  ${"https://subdomain.portal.azure.com"}            | ${false}
  ${"https://subdomain.portal.azure.us"}             | ${false}
  ${"https://subdomain.portal.azure.cn"}             | ${false}
  ${"https://subdomain.microsoftazure.de"}           | ${false}
  ${"https://main.documentdb.ext.azure.com"}         | ${false}
  ${"https://main.documentdb.ext.azure.us"}          | ${false}
  ${"https://main.documentdb.ext.azure.cn"}          | ${false}
  ${"https://main.documentdb.ext.microsoftazure.de"} | ${false}
  ${"https://random.domain"}                         | ${true}
  ${"https://malicious.cloudapp.azure.com"}          | ${true}
`("returns $expected when called with $domain", ({ domain, expected }) => {
  expect(isInvalidParentFrameOrigin({ origin: domain } as MessageEvent)).toBe(expected);
});
