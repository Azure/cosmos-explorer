import { Terminal } from "xterm";
import { askConfirmation } from "./CommonUtils";

describe("askConfirmation", () => {
  const createTerminalMock = () => {
    let keyHandler: ((event: { key: string }) => void) | undefined;
    const dispose = jest.fn();
    const terminal = {
      writeln: jest.fn(),
      focus: jest.fn(),
      onKey: jest.fn((handler: (event: { key: string }) => void) => {
        keyHandler = handler;
        return { dispose };
      }),
    } as unknown as Terminal;

    return {
      terminal,
      dispose,
      pressKey: (key: string) => keyHandler?.({ key }),
    };
  };

  it("resolves true when the user presses Y", async () => {
    const { terminal, dispose, pressKey } = createTerminalMock();
    const promise = askConfirmation(terminal, "Proceed?");

    pressKey("Y");

    await expect(promise).resolves.toBe(true);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("resolves true when the user presses lowercase y", async () => {
    const { terminal, pressKey } = createTerminalMock();
    const promise = askConfirmation(terminal, "Proceed?");

    pressKey("y");

    await expect(promise).resolves.toBe(true);
  });

  it("resolves false when the user presses N", async () => {
    const { terminal, dispose, pressKey } = createTerminalMock();
    const promise = askConfirmation(terminal, "Proceed?");

    pressKey("N");

    await expect(promise).resolves.toBe(false);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("ignores keys other than Y or N and keeps listening until a valid answer", async () => {
    const { terminal, dispose, pressKey } = createTerminalMock();
    const promise = askConfirmation(terminal, "Proceed?");

    pressKey("a");
    pressKey("1");
    pressKey("\r");
    expect(dispose).not.toHaveBeenCalled();

    pressKey("y");

    await expect(promise).resolves.toBe(true);
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
