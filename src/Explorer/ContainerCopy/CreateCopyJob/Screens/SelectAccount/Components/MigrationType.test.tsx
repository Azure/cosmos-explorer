import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import ContainerCopyMessages from "../../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";
import { MigrationType } from "./MigrationType";

jest.mock("../../../../Context/CopyJobContext", () => ({
  useCopyJobContext: jest.fn(),
}));

describe("MigrationType", () => {
  const mockSetCopyJobState = jest.fn();

  const defaultContextValue = {
    copyJobState: {
      jobName: "",
      migrationType: CopyJobMigrationType.Online,
      source: {
        subscription: null as any,
        account: null as any,
        databaseId: "",
        containerId: "",
      },
      target: {
        subscriptionId: "",
        account: null as any,
        databaseId: "",
        containerId: "",
      },
      sourceReadAccessFromTarget: false,
    },
    setCopyJobState: mockSetCopyJobState,
    flow: { currentScreen: "selectAccount" },
    setFlow: jest.fn(),
    contextError: "",
    setContextError: jest.fn(),
    explorer: {} as any,
    resetCopyJobState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCopyJobContext as jest.Mock).mockReturnValue(defaultContextValue);
  });

  describe("Component Rendering", () => {
    it("should render migration type component with radio buttons", () => {
      const { container } = render(<MigrationType />);

      expect(container.querySelector("[data-test='migration-type']")).toBeInTheDocument();
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();

      const offlineRadio = screen.getByRole("radio", {
        name: ContainerCopyMessages.migrationTypeOptions.offline.title,
      });
      const onlineRadio = screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.online.title });

      expect(offlineRadio).toBeInTheDocument();
      expect(onlineRadio).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    it("should render with online mode selected by default", () => {
      render(<MigrationType />);

      const onlineRadio = screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.online.title });
      const offlineRadio = screen.getByRole("radio", {
        name: ContainerCopyMessages.migrationTypeOptions.offline.title,
      });

      expect(onlineRadio).toBeChecked();
      expect(offlineRadio).not.toBeChecked();
    });

    it("should render with offline mode selected when state is offline", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: CopyJobMigrationType.Offline,
        },
      });

      render(<MigrationType />);

      const offlineRadio = screen.getByRole("radio", {
        name: ContainerCopyMessages.migrationTypeOptions.offline.title,
      });
      const onlineRadio = screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.online.title });

      expect(offlineRadio).toBeChecked();
      expect(onlineRadio).not.toBeChecked();
    });
  });

  describe("Descriptions and Learn More Links", () => {
    it("should render online description and learn more link when online is selected", () => {
      render(<MigrationType />);

      expect(screen.getByTestId("migration-type-description-online")).toBeInTheDocument();

      const learnMoreLink = screen.getByRole("link", {
        name: "online copy jobs",
      });
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink).toHaveAttribute(
        "href",
        "https://learn.microsoft.com/azure/cosmos-db/container-copy?tabs=online-copy&pivots=api-nosql#getting-started",
      );
      expect(learnMoreLink).toHaveAttribute("target", "_blank");
    });

    it("should render offline description and learn more link when offline is selected", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: CopyJobMigrationType.Offline,
        },
      });

      render(<MigrationType />);

      expect(screen.getByTestId("migration-type-description-offline")).toBeInTheDocument();

      const learnMoreLink = screen.getByRole("link", {
        name: "offline copy jobs",
      });
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink).toHaveAttribute(
        "href",
        "https://learn.microsoft.com/azure/cosmos-db/how-to-container-copy?tabs=offline-copy&pivots=api-nosql",
      );
    });
  });

  describe("User Interactions", () => {
    it("should call setCopyJobState when offline radio button is clicked", () => {
      render(<MigrationType />);

      const offlineRadio = screen.getByRole("radio", {
        name: ContainerCopyMessages.migrationTypeOptions.offline.title,
      });
      fireEvent.click(offlineRadio);

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetCopyJobState.mock.calls[0][0];
      const result = updateFunction(defaultContextValue.copyJobState);

      expect(result).toEqual({
        ...defaultContextValue.copyJobState,
        migrationType: CopyJobMigrationType.Offline,
      });
    });

    it("should call setCopyJobState when online radio button is clicked", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: CopyJobMigrationType.Offline,
        },
      });

      render(<MigrationType />);

      const onlineRadio = screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.online.title });
      fireEvent.click(onlineRadio);

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetCopyJobState.mock.calls[0][0];
      const result = updateFunction({
        ...defaultContextValue.copyJobState,
        migrationType: CopyJobMigrationType.Offline,
      });

      expect(result).toEqual({
        ...defaultContextValue.copyJobState,
        migrationType: CopyJobMigrationType.Online,
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<MigrationType />);

      const choiceGroup = screen.getByRole("radiogroup");
      expect(choiceGroup).toBeInTheDocument();
      expect(choiceGroup).toHaveAttribute("aria-labelledby", "migrationTypeChoiceGroup");
    });

    it("should have proper radio button labels", () => {
      render(<MigrationType />);

      expect(
        screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.offline.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.online.title }),
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined migration type gracefully", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: undefined,
        },
      });

      const { container } = render(<MigrationType />);

      expect(container.querySelector("[data-test='migration-type']")).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.offline.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: ContainerCopyMessages.migrationTypeOptions.online.title }),
      ).toBeInTheDocument();
    });

    it("should handle null copyJobState gracefully", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: null,
      });

      const { container } = render(<MigrationType />);

      expect(container.querySelector("[data-test='migration-type']")).toBeInTheDocument();
    });
  });
});
