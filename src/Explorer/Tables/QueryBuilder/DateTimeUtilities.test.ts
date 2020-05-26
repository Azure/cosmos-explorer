import * as DateTimeUtilities from "./DateTimeUtilities";

describe("DateTimeUtilities", () => {
  const testDateTime1 = new Date("Fri Jul 26 2019 17:03:02 GMT-0700 (Pacific Daylight Time)");
  const testDateTime2 = new Date("Mon Dec 31 2018 16:00:00 GMT-0800 (Pacific Standard Time)");
  const testUnixTime1 = 1564185782;
  const testUnixTime2 = 1546300800;
  const testTicks1 = "00636997825820000000";
  const testTicks2 = "00636818976000000000";

  describe("getLocalDateTime", () => {
    it("should return right local time for date time 1", () => {
      const time = DateTimeUtilities.getLocalDateTime(testDateTime1.toISOString());
      expect(new Date(time).toLocaleString()).toBe(testDateTime1.toLocaleString());
    });
    it("should return right local time for date time 2", () => {
      const time = DateTimeUtilities.getLocalDateTime(testDateTime2.toISOString());
      expect(new Date(time).toLocaleString()).toBe(testDateTime2.toLocaleString());
    });
  });

  describe("getUTCDateTime", () => {
    it("should return right utc time for date time 1", () => {
      const time = DateTimeUtilities.getUTCDateTime(testDateTime1.toISOString());
      expect(time).toBe("2019-07-27T00:03:02.000Z");
    });
    it("should return right utc time for date time 2", () => {
      const time = DateTimeUtilities.getUTCDateTime(testDateTime2.toISOString());
      expect(time).toBe("2019-01-01T00:00:00.000Z");
    });
  });

  describe("ensureDoubleDigits", () => {
    it("should return correct double digits with input of single digit", () => {
      const digits = DateTimeUtilities.ensureDoubleDigits(2);
      expect(digits).toBe("02");
    });
    it("should return correct double digits with input of double digit", () => {
      const digits = DateTimeUtilities.ensureDoubleDigits(53);
      expect(digits).toBe("53");
    });
    it("should return correct double digits with input of multi digit", () => {
      const digits = DateTimeUtilities.ensureDoubleDigits(321654);
      expect(digits).toBe("32");
    });
  });

  describe("ensureTripleDigits", () => {
    it("should return correct triple digits with input of single digit", () => {
      const digits = DateTimeUtilities.ensureTripleDigits(2);
      expect(digits).toBe("002");
    });
    it("should return correct triple digits with double digit", () => {
      const digits = DateTimeUtilities.ensureTripleDigits(53);
      expect(digits).toBe("053");
    });
    it("should return correct triple digits with triple digit", () => {
      const digits = DateTimeUtilities.ensureTripleDigits(344);
      expect(digits).toBe("344");
    });
    it("should return correct triple digits with multi digit", () => {
      const digits = DateTimeUtilities.ensureTripleDigits(321654);
      expect(digits).toBe("321");
    });
  });

  describe("convertUnixToJSDate", () => {
    it("should convert unix number to JS Date for date time 1", () => {
      const time = DateTimeUtilities.convertUnixToJSDate(testUnixTime1);
      expect(time.toISOString()).toBe("2019-07-27T00:03:02.000Z");
    });
    it("should convert unix number to JS Date for date time 2", () => {
      const time = DateTimeUtilities.convertUnixToJSDate(testUnixTime2);
      expect(time.toISOString()).toBe(testDateTime2.toISOString());
    });
  });

  describe("convertJSDateToUnix", () => {
    it("should convert JS Date to unix number for date time 1", () => {
      const time = DateTimeUtilities.convertJSDateToUnix(testDateTime1.toISOString());
      expect(time).toBe(testUnixTime1);
    });
    it("should convert JS Date to unix number for date time 2", () => {
      const time = DateTimeUtilities.convertJSDateToUnix(testDateTime2.toISOString());
      expect(time).toBe(testUnixTime2);
    });
  });

  describe("convertTicksToJSDate", () => {
    it("should convert ticks to JS Date for date time 1", () => {
      const time = DateTimeUtilities.convertTicksToJSDate(testTicks1);
      expect(time.toISOString()).toBe(testDateTime1.toISOString());
    });
    it("should convert ticks to JS Date for date time 2", () => {
      const time = DateTimeUtilities.convertTicksToJSDate(testTicks2);
      expect(time.toISOString()).toBe(testDateTime2.toISOString());
    });
  });

  describe("convertJSDateToTicksWithPadding", () => {
    it("should convert JS Date to ticks for date time 1", () => {
      const time = DateTimeUtilities.convertJSDateToTicksWithPadding(testDateTime1.toISOString());
      expect(time).toBe(testTicks1);
    });
    it("should convert JS Date to ticks for date time 2", () => {
      const time = DateTimeUtilities.convertJSDateToTicksWithPadding(testDateTime2.toISOString());
      expect(time).toBe(testTicks2);
    });
  });
});
