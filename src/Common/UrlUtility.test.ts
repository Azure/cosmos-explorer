import * as UrlUtility from "./UrlUtility";

describe("parseDocumentsPath", () => {
    it("empty resource path", () => {
        const resourcePath = "";

        expect(UrlUtility.parseDocumentsPath(resourcePath)).toEqual({});
    });

    it("resourcePath does not begin or end with /", () => {
        const resourcePath = "localhost/portal/home";
        const expectedResult = {
            type: "home",
            objectBody: {
                id: "portal",
                self: "/localhost/portal/home/",
            },
        };

        expect(UrlUtility.parseDocumentsPath(resourcePath)).toEqual(expectedResult);
    });

    it("resourcePath length is even", () => {
        const resourcePath = "/localhost/portal/src/home/";
        const expectedResult = {
            type: "src",
            objectBody: {
                id: "home",
                self: resourcePath,
            },
        };

        expect(UrlUtility.parseDocumentsPath(resourcePath)).toEqual(expectedResult);
    });

    it("createUri", () => {
        const baseUri = "http://foo.com/bar/";
        const relativeUri = "/index.html";
        const expectedUri = "http://foo.com/bar/index.html";

        expect(UrlUtility.createUri(baseUri, relativeUri)).toEqual(expectedUri);
    });

    it("should throw an error if baseUri is empty", () => {
        expect(() => {
            UrlUtility.createUri("", "/home");
        }).toThrow("baseUri is null or empty");
    });
});
