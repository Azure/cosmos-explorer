import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../Explorer";
import * as Actions from "../Actions/CopyJobActions";
import { MonitorCopyJobsRefState } from "../MonitorCopyJobs/MonitorCopyJobRefState";
import { getCommandBarButtons } from "./Utils";

jest.mock("../../../ConfigContext", () => ({
  configContext: {
    platform: "Portal",
  },
  Platform: {
    Portal: "Portal",
    Emulator: "Emulator",
    Hosted: "Hosted",
  },
}));

jest.mock("../Actions/CopyJobActions", () => ({
  openCreateCopyJobPanel: jest.fn(),
}));

jest.mock("../MonitorCopyJobs/MonitorCopyJobRefState", () => ({
  MonitorCopyJobsRefState: jest.fn(),
}));

describe("CommandBar Utils", () => {
  let mockExplorer: Explorer;
  let mockOpenContainerCopyFeedbackBlade: jest.Mock;
  let mockRefreshJobList: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenContainerCopyFeedbackBlade = jest.fn();
    mockRefreshJobList = jest.fn();

    mockExplorer = {
      openContainerCopyFeedbackBlade: mockOpenContainerCopyFeedbackBlade,
    } as unknown as Explorer;

    (MonitorCopyJobsRefState as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        ref: {
          refreshJobList: mockRefreshJobList,
        },
      };
      return selector(state);
    });
  });

  describe("getCommandBarButtons", () => {
    it("should return an array of command button props", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      expect(buttons).toBeDefined();
      expect(Array.isArray(buttons)).toBe(true);
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should include create copy job button", () => {
      const buttons = getCommandBarButtons(mockExplorer);
      const createButton = buttons[0];

      expect(createButton).toBeDefined();
      expect(createButton.commandButtonLabel).toBeUndefined();
      expect(createButton.ariaLabel).toBe("Create a new container copy job");
      expect(createButton.tooltipText).toBe("Create Copy Job");
      expect(createButton.hasPopup).toBe(false);
      expect(createButton.disabled).toBe(false);
    });

    it("should include refresh button", () => {
      const buttons = getCommandBarButtons(mockExplorer);
      const refreshButton = buttons[1];

      expect(refreshButton).toBeDefined();
      expect(refreshButton.ariaLabel).toBe("Refresh copy jobs");
      expect(refreshButton.tooltipText).toBe("Refresh");
      expect(refreshButton.disabled).toBe(false);
    });

    it("should include feedback button when platform is Portal", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      expect(buttons.length).toBe(4);

      const feedbackButton = buttons[3];
      expect(feedbackButton).toBeDefined();
      expect(feedbackButton.ariaLabel).toBe("Provide feedback on copy jobs");
      expect(feedbackButton.tooltipText).toBe("Feedback");
      expect(feedbackButton.disabled).toBe(false);
    });

    it("should not include feedback button when platform is not Portal", async () => {
      jest.resetModules();
      jest.doMock("../../../ConfigContext", () => ({
        configContext: {
          platform: "Emulator",
        },
        Platform: {
          Portal: "Portal",
          Emulator: "Emulator",
          Hosted: "Hosted",
        },
      }));

      const { getCommandBarButtons: getCommandBarButtonsEmulator } = await import("./Utils");
      const buttons = getCommandBarButtonsEmulator(mockExplorer);

      expect(buttons.length).toBe(3);
    });

    it("should call openCreateCopyJobPanel when create button is clicked", () => {
      const buttons = getCommandBarButtons(mockExplorer);
      const createButton = buttons[0];

      createButton.onCommandClick({} as React.SyntheticEvent);

      expect(Actions.openCreateCopyJobPanel).toHaveBeenCalledWith(mockExplorer);
      expect(Actions.openCreateCopyJobPanel).toHaveBeenCalledTimes(1);
    });

    it("should call refreshJobList when refresh button is clicked", () => {
      const buttons = getCommandBarButtons(mockExplorer);
      const refreshButton = buttons[1];

      refreshButton.onCommandClick({} as React.SyntheticEvent);

      expect(mockRefreshJobList).toHaveBeenCalledTimes(1);
    });

    it("should call openContainerCopyFeedbackBlade when feedback button is clicked", () => {
      const buttons = getCommandBarButtons(mockExplorer);
      const feedbackButton = buttons[3];

      feedbackButton.onCommandClick({} as React.SyntheticEvent);

      expect(mockOpenContainerCopyFeedbackBlade).toHaveBeenCalledTimes(1);
    });

    it("should return buttons with correct icon sources", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      expect(buttons[0].iconSrc).toBeDefined();
      expect(buttons[0].iconAlt).toBe("Create Copy Job");

      expect(buttons[1].iconSrc).toBeDefined();
      expect(buttons[1].iconAlt).toBe("Refresh");

      expect(buttons[2].iconSrc).toBeDefined();
      expect(buttons[2].iconAlt).toBe("Dark Theme");

      expect(buttons[3].iconSrc).toBeDefined();
      expect(buttons[3].iconAlt).toBe("Feedback");
    });

    it("should handle null MonitorCopyJobsRefState ref gracefully", () => {
      (MonitorCopyJobsRefState as unknown as jest.Mock).mockImplementationOnce((selector) => {
        const state: { ref: null } = { ref: null };
        return selector(state);
      });

      const buttons = getCommandBarButtons(mockExplorer);
      const refreshButton = buttons[1];

      expect(() => refreshButton.onCommandClick({} as React.SyntheticEvent)).not.toThrow();
    });

    it("should set hasPopup to false for all buttons", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(button.hasPopup).toBe(false);
      });
    });

    it("should set commandButtonLabel to undefined for all buttons", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(button.commandButtonLabel).toBeUndefined();
      });
    });

    it("should respect disabled state when provided", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(button.disabled).toBe(false);
      });
    });

    it("should return CommandButtonComponentProps with all required properties", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button: CommandButtonComponentProps) => {
        expect(button).toHaveProperty("iconSrc");
        expect(button).toHaveProperty("iconAlt");
        expect(button).toHaveProperty("onCommandClick");
        expect(button).toHaveProperty("commandButtonLabel");
        expect(button).toHaveProperty("ariaLabel");
        expect(button).toHaveProperty("tooltipText");
        expect(button).toHaveProperty("hasPopup");
        expect(button).toHaveProperty("disabled");
      });
    });

    it("should maintain button order: create, refresh, themeToggle, feedback", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      expect(buttons[0].tooltipText).toBe("Create Copy Job");
      expect(buttons[1].tooltipText).toBe("Refresh");
      expect(buttons[2].tooltipText).toBe("Dark Theme");
      expect(buttons[3].tooltipText).toBe("Feedback");
    });
  });

  describe("Button click handlers", () => {
    it("should execute click handlers without errors", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(() => button.onCommandClick({} as React.SyntheticEvent)).not.toThrow();
      });
    });

    it("should call correct action for each button", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons[0].onCommandClick({} as React.SyntheticEvent);
      expect(Actions.openCreateCopyJobPanel).toHaveBeenCalledWith(mockExplorer);

      buttons[1].onCommandClick({} as React.SyntheticEvent);
      expect(mockRefreshJobList).toHaveBeenCalled();


      buttons[3].onCommandClick({} as React.SyntheticEvent);
      expect(mockOpenContainerCopyFeedbackBlade).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have aria labels for all buttons", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(button.ariaLabel).toBeDefined();
        expect(typeof button.ariaLabel).toBe("string");
        expect(button.ariaLabel.length).toBeGreaterThan(0);
      });
    });

    it("should have tooltip text for all buttons", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(button.tooltipText).toBeDefined();
        expect(typeof button.tooltipText).toBe("string");
        expect(button.tooltipText.length).toBeGreaterThan(0);
      });
    });

    it("should have icon alt text for all buttons", () => {
      const buttons = getCommandBarButtons(mockExplorer);

      buttons.forEach((button) => {
        expect(button.iconAlt).toBeDefined();
        expect(typeof button.iconAlt).toBe("string");
        expect(button.iconAlt.length).toBeGreaterThan(0);
      });
    });
  });
});
