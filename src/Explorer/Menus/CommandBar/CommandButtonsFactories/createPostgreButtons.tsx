import { CommandButtonComponentProps } from "../../../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../../../Explorer";
import { createOpenPsqlTerminalButton } from "./createOpenPsqlTerminalButton";

export function createPostgreButtons(container: Explorer): CommandButtonComponentProps[] {
  const openPostgreShellBtn = createOpenPsqlTerminalButton(container);

  return [openPostgreShellBtn];
}
