import { ArraysByKeyCache } from "./ArraysByKeyCache";

describe("Cache arrays by key", () => {
  it("should clear", () => {
    const cache = new ArraysByKeyCache<number>(3);
    const key = "key";
    cache.insert(key, 1, 0);
    cache.clear();
    expect(cache.retrieve(key, 0, 1)).toBe(undefined);
  });

  it("should invalidate oldest key to keep cache size under maximum", () => {
    const cache = new ArraysByKeyCache<number>(4);
    const key1 = "key1";
    const key2 = "key2";
    cache.insert(key1, 0, 0);
    cache.insert(key2, 0, 1);
    cache.insert(key1, 1, 2);
    cache.insert(key2, 1, 3);

    cache.insert(key1, 2, 4);

    expect(cache.retrieve(key1, 0, 3)).toEqual([0, 2, 4]);
    expect(cache.retrieve(key2, 1, 1)).toEqual(undefined);
  });

  it("should cache and retrieve cached page within boundaries", () => {
    const cache = new ArraysByKeyCache<number>(5);
    const key = "key";
    cache.insert(key, 0, 0);
    cache.insert(key, 1, 1);
    cache.insert(key, 2, 2);
    cache.insert(key, 3, 3);
    expect(cache.retrieve(key, 0, 4)).toEqual([0, 1, 2, 3]);
  });

  it("should not retrieve cached page outside boundaries", () => {
    const cache = new ArraysByKeyCache<number>(10);
    const key = "key";
    cache.insert(key, 0, 0);
    cache.insert(key, 1, 1);
    expect(cache.retrieve(key, 2, 1)).toEqual(undefined);
  });

  it("should not retrieve cached page overlapping boundaries", () => {
    const cache = new ArraysByKeyCache<number>(10);
    const key = "key";
    cache.insert(key, 0, 0);
    cache.insert(key, 1, 1);
    cache.insert(key, 2, 2);
    expect(cache.retrieve(key, 2, 4)).toEqual(undefined);
  });

  it("should not insert non-contiguous element", () => {
    const cache = new ArraysByKeyCache<number>(10);
    const key = "key";
    cache.insert(key, 0, 0);
    cache.insert(key, 1, 1);
    cache.insert(key, 3, 3);
    expect(cache.retrieve(key, 3, 1)).toEqual(undefined);
  });

  it("should cache multiple keys", () => {
    const cache = new ArraysByKeyCache<number>(10);
    const key1 = "key1";
    cache.insert(key1, 0, 0);
    cache.insert(key1, 1, 1);
    cache.insert(key1, 2, 2);

    const key2 = "key2";
    cache.insert(key2, 0, 3);
    cache.insert(key2, 1, 4);
    cache.insert(key2, 2, 5);

    expect(cache.retrieve(key1, 0, 3)).toEqual([0, 1, 2]);
    expect(cache.retrieve(key2, 0, 3)).toEqual([3, 4, 5]);
  });
});
