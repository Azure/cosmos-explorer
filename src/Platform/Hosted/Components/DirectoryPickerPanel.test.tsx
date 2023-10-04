jest.mock("../../../hooks/useDirectories");
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { Tenant } from "../../../Contracts/DataModels";
import { useDirectories } from "../../../hooks/useDirectories";
import { DirectoryPickerPanel } from "./DirectoryPickerPanel";

it("switches tenant for user", () => {
  const armToken = "fakeToken";
  const switchTenant = jest.fn();
  const dismissPanel = jest.fn();
  const directories = [
    { displayName: "test1", tenantId: "test1-id" },
    { displayName: "test2", tenantId: "test2-id" },
  ] as Tenant[];
  (useDirectories as jest.Mock).mockReturnValue(directories);

  render(
    <DirectoryPickerPanel
      armToken={armToken}
      isOpen={true}
      tenantId="test1-id"
      switchTenant={switchTenant}
      dismissPanel={dismissPanel}
    />,
  );
  fireEvent.click(screen.getByLabelText(/test2-id/));
  expect(switchTenant).toHaveBeenCalledWith(directories[1].tenantId);
  expect(dismissPanel).toHaveBeenCalled();
});
