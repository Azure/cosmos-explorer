import * as Base64Utils from "./Base64Utils";

describe("Base64Utils", () => {
  describe("utf8ToB64", () => {
    it("should convert utf8 to base64", () => {
      expect(Base64Utils.utf8ToB64("abcd")).toEqual(btoa("abcd"));
      expect(Base64Utils.utf8ToB64("小飼弾")).toEqual("5bCP6aO85by+");
      expect(Base64Utils.utf8ToB64("à mon hôpital préféré")).toEqual("w6AgbW9uIGjDtHBpdGFsIHByw6lmw6lyw6k=");
    });
  });
});
