import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import i18n from "../../../i18n";
import { TrialControls } from "./TrialControls";

type Management = React.ComponentProps<typeof TrialControls>["management"];

function management(timeLeftInSeconds: number): Management {
  return {
    resource: {
      accountName: "trial-account",
      resourceGroupName: "trial-group",
      timeLeftInSeconds,
    },
    error: "",
    loading: false,
    pending: false,
    portalUrl: undefined,
    handoff: jest.fn(),
    extend: jest.fn(),
    retry: jest.fn(),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-16T20:00:00Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

it.each<[number, string]>([
  [0, "Expired"],
  [45, "<1m"],
  [1800, "30m"],
  [9000, "2h 30m"],
  [93600, "1d 2h"],
])("shows the remaining trial lifetime for %i seconds", (seconds, text) => {
  render(<TrialControls management={management(seconds)} />);
  expect(screen.getByText(`Time remaining: ${text}`)).toBeVisible();
});

it("counts down locally and disables extension when the trial expires", () => {
  render(<TrialControls management={management(120)} />);
  expect(screen.getByText("Time remaining: 2m")).toBeVisible();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText("Time remaining: 1m")).toBeVisible();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText("Time remaining: Expired")).toBeVisible();
  expect(screen.getByRole("button", { name: "Extend sandbox" })).toBeDisabled();
});

it("offers extension without a sandbox delete action or confirmation dialog", () => {
  const state = management(1800);
  render(<TrialControls management={state} />);
  fireEvent.click(screen.getByRole("button", { name: "Extend sandbox" }));
  expect(state.extend).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("button", { name: "Delete sandbox" })).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("keeps extension disabled while a direct extension is pending", () => {
  render(<TrialControls management={{ ...management(1800), pending: true }} />);
  expect(screen.queryByRole("button", { name: "Stop waiting" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Extend sandbox" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Delete sandbox" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Sandbox operation in progress");
});

it("opens Portal through a normal new-tab link without starting or waiting for an extension", () => {
  const state = {
    ...management(1800),
    portalUrl: "https://cosmos.azure.com/try/?view=account&resourceGroupName=trial-group#extend",
  };
  render(<TrialControls management={state} />);
  const control = screen.getByRole("button", { name: "Extend sandbox" });
  expect(control).toHaveAttribute("href", state.portalUrl);
  expect(control).toHaveAttribute("target", "_blank");
  expect(control).toHaveAttribute("rel", "noopener noreferrer");
  expect(control).toHaveAttribute("title", expect.stringContaining("new tab"));
  fireEvent.click(control);
  expect(state.handoff).toHaveBeenCalledTimes(1);
  expect(state.extend).not.toHaveBeenCalled();
  expect(control).toBeEnabled();
});

it("resets the countdown when refreshed or extended metadata arrives", () => {
  const view = render(<TrialControls management={management(1800)} />);
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByText("Time remaining: 29m")).toBeVisible();
  view.rerender(<TrialControls management={management(2592000)} />);
  expect(screen.getByText("Time remaining: 30d")).toBeVisible();
  act(() => jest.advanceTimersByTime(3600000));
  expect(screen.getByText("Time remaining: 29d 23h")).toBeVisible();
});

it("uses localized countdown, controls, and announcements on render", async () => {
  i18n.addResourceBundle("fr", "Resources", {
    common: { retry: "Réessayer" },
    tryCosmosDB: {
      timeRemaining: "Temps restant : {{time}}",
      hoursAndMinutes: "{{hours}} h {{minutes}} min",
      extend: "Prolonger",
      extendSandbox: "Prolonger le bac à sable",
      extendInPortal: "Prolonger dans Try Portal (nouvel onglet)",
      retryStatus: "Vérifier le statut",
      operationInProgress: "Opération en cours",
    },
  });
  const state = { ...management(9000), pending: true, portalUrl: "https://cosmos.azure.com/try/" };
  const view = render(<TrialControls management={state} />);
  try {
    await act(async () => {
      await i18n.changeLanguage("fr");
    });
    view.rerender(<TrialControls management={state} />);
    expect(screen.getByText("Temps restant : 2 h 30 min")).toBeVisible();
    const extend = screen.getByRole("button", { name: "Prolonger le bac à sable" });
    expect(extend).toHaveTextContent("Prolonger");
    expect(extend).toHaveAttribute("title", "Prolonger dans Try Portal (nouvel onglet)");
    expect(screen.getByRole("status")).toHaveTextContent("Opération en cours");
    view.rerender(<TrialControls management={{ ...state, pending: false, error: "Erreur" }} />);
    expect(screen.getByRole("button", { name: "Vérifier le statut" })).toHaveTextContent("Réessayer");
  } finally {
    view.unmount();
    await i18n.changeLanguage("en");
    i18n.removeResourceBundle("fr", "Resources");
  }
});
