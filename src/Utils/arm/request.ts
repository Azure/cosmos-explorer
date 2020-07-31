/* */

export async function armRequest(options: { host: string; apiVersion: string; method }) {
  return window.fetch(host, { method: options.method });
}
