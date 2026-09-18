import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useTeachingBubble } from "hooks/useTeachingBubble";
import React from "react";
import { updateUserContext } from "UserContext";
import { MongoQuickstartTutorial } from "./MongoQuickstartTutorial";
import { SQLQuickstartTutorial } from "./SQLQuickstartTutorial";

describe("quickstart tutorials", () => {
  beforeEach(() => {
    const target = document.createElement("div");
    target.id = "openFullScreenBtn";
    document.body.appendChild(target);
    useTeachingBubble.setState({ step: 1 });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("continues the SQL tour from full screen to the final step", () => {
    updateUserContext({ apiType: "SQL", isTryCosmosDBSubscription: false });
    useTeachingBubble.setState({ step: 6 });

    const { rerender } = render(<SQLQuickstartTutorial />);

    expect(screen.getByText("Launch full screen")).toBeInTheDocument();
    expect(screen.getByText("Step 6 of 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    rerender(<SQLQuickstartTutorial />);

    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    expect(screen.getByText("Step 7 of 7")).toBeInTheDocument();
  });

  it("continues the Mongo tour from full screen to the final step", () => {
    updateUserContext({ apiType: "Mongo", isTryCosmosDBSubscription: false });
    useTeachingBubble.setState({ step: 7 });

    const { rerender } = render(<MongoQuickstartTutorial />);

    expect(screen.getByText("Launch full screen")).toBeInTheDocument();
    expect(screen.getByText("Step 7 of 8")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    rerender(<MongoQuickstartTutorial />);

    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    expect(screen.getByText("Step 8 of 8")).toBeInTheDocument();
  });
});
