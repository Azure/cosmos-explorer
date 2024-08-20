import { Button, MessageBar, MessageBarActions, MessageBarBody } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import React, { useState } from "react";

export enum MessageBannerState {
  /** The banner should be visible if the triggering conditions are met. */
  Allowed = "allowed",

  /** The banner has been dismissed by the user and will not be shown until the component is recreated, even if the visibility condition is true. */
  Dismissed = "dismissed",

  /** The banner has been supressed by the user and will not be shown at all, even if the visibility condition is true. */
  Suppressed = "suppressed",
}

export type MessageBannerProps = {
  /** A CSS class for the root MessageBar component */
  className: string;

  /** A unique ID for the message that will be used to store it's dismiss/suppress state across sessions. */
  messageId: string;

  /** The current visibility state for the banner IGNORING the user's dimiss/suppress preference
   *
   * If this value is true but the user has dismissed the banner, the banner will NOT be shown.
   */
  visible: boolean;
};

/** A component that shows a message banner which can be dismissed by the user.
 *
 * In the future, this can also support persisting the dismissed state in local storage without requiring changes to all the components that use it.
 *
 * A message banner can be in three "states":
 * - Allowed: The banner should be visible if the triggering conditions are met.
 * - Dismissed: The banner has been dismissed by the user and will not be shown until the component is recreated, even if the visibility condition is true.
 * - Suppressed: The banner has been supressed by the user and will not be shown at all, even if the visibility condition is true.
 *
 * The "Dismissed" state represents the user clicking the "x" in the banner to dismiss it.
 * The "Suppressed" state represents the user clicking "Don't show this again".
 */
export const MessageBanner: React.FC<MessageBannerProps> = ({ visible, className, children }) => {
  const [state, setState] = useState<MessageBannerState>(MessageBannerState.Allowed);

  if (state !== MessageBannerState.Allowed) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <MessageBar className={className}>
      <MessageBarBody>{children}</MessageBarBody>
      <MessageBarActions
        containerAction={
          <Button
            aria-label="dismiss"
            appearance="transparent"
            icon={<DismissRegular />}
            onClick={() => setState(MessageBannerState.Dismissed)}
          />
        }
      ></MessageBarActions>
    </MessageBar>
  );
};
