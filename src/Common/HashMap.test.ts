import { HashMap } from "./HashMap";

describe("HashMap", () => {
  it("should test if key/val exists", () => {
    const map = new HashMap<number>();
    map.set("a", 123);

    expect(map.has("a")).toBe(true);
    expect(map.has("b")).toBe(false);
  });

  it("should get object back", () => {
    const map = new HashMap<string>();
    map.set("a", "123");
    map.set("a", "456");

    expect(map.get("a")).toBe("456");
    expect(map.get("a")).not.toBe("123");
  });

  it("should return the right size", () => {
    const map = new HashMap<string>();
    map.set("a", "123");
    map.set("b", "456");

    expect(map.size()).toBe(2);
  });

  it("should be iterable", () => {
    const map = new HashMap<number>();
    map.set("a", 1);
    map.set("b", 10);
    map.set("c", 100);
    map.set("d", 1000);

    let i = 0;
    map.forEach((key: string, value: number) => {
      i += value;
    });
    expect(i).toBe(1111);
  });

  it("should be deleted", () => {
    const map = new HashMap<number>();
    map.set("a", 1);
    map.set("b", 10);

    expect(map.delete("a")).toBe(true);
    expect(map.delete("c")).toBe(false);
    expect(map.has("a")).toBe(false);
    expect(map.has("b")).toBe(true);
  });

  it("should clear", () => {
    const map = new HashMap<number>();
    map.set("a", 1);
    map.clear();
    expect(map.size()).toBe(0);
    expect(map.has("a")).toBe(false);
  });

  it("should return all keys", () => {
    const map = new HashMap<number>();
    map.set("a", 1);
    map.set("b", 1);
    expect(map.keys()).toEqual(["a", "b"]);
    map.clear();
    expect(map.keys().length).toBe(0);
  });
});
