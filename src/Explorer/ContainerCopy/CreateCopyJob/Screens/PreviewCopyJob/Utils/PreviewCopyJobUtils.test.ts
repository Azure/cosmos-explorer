import { getPreviewCopyJobDetailsListColumns } from "./PreviewCopyJobUtils";

describe("PreviewCopyJobUtils", () => {
  it("should return correctly formatted columns for preview copy job details list", () => {
    const columns = getPreviewCopyJobDetailsListColumns();
    expect(columns).toMatchSnapshot();
  });
});
