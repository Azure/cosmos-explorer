import * as React from "react";
import { FeaturePanelComponent } from "./FeaturePanelComponent";
import { getTheme, mergeStyleSets, FontWeights, Modal, IconButton, IIconProps } from "office-ui-fabric-react";
import "./FeaturePanelLauncher.less";

// Modal wrapper
export const FeaturePanelLauncher: React.FunctionComponent = (): JSX.Element => {
  const [isModalOpen, showModal] = React.useState<boolean>(false);

  const onActivate = (event: React.MouseEvent<HTMLSpanElement>): void => {
    if (!event.shiftKey || !event.ctrlKey) {
      return;
    }
    event.stopPropagation();
    showModal(true);
  };

  const theme = getTheme();
  const contentStyles = mergeStyleSets({
    container: {
      display: "flex",
      flexFlow: "column nowrap",
      alignItems: "stretch",
    },
    header: [
      // tslint:disable-next-line:deprecation
      theme.fonts.xLargePlus,
      {
        flex: "1 1 auto",
        borderTop: `4px solid ${theme.palette.themePrimary}`,
        color: theme.palette.neutralPrimary,
        display: "flex",
        alignItems: "center",
        fontWeight: FontWeights.semibold,
        padding: "12px 12px 14px 24px",
      },
    ],
    body: {
      flex: "4 4 auto",
      overflowY: "hidden",
      marginBottom: 40,
      height: "100%",
      display: "flex",
    },
  });

  const iconButtonStyles = {
    root: {
      color: theme.palette.neutralPrimary,
      marginLeft: "auto",
      marginTop: "4px",
      marginRight: "2px",
    },
    rootHovered: {
      color: theme.palette.neutralDark,
    },
  };
  const cancelIcon: IIconProps = { iconName: "Cancel" };
  const hideModal = (): void => showModal(false);

  return (
    <span className="activePatch" onDoubleClick={onActivate}>
      <Modal
        className="featurePanelLauncherContainer"
        titleAriaId="Features"
        isOpen={isModalOpen}
        onDismiss={hideModal}
        isBlocking={false}
        scrollableContentClassName="featurePanelLauncherModal"
      >
        <div className={contentStyles.header}>
          <span>Data Explorer Launcher</span>
          <IconButton
            styles={iconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close popup modal"
            onClick={hideModal}
          />
        </div>
        <div className={contentStyles.body}>
          <FeaturePanelComponent />
        </div>
      </Modal>
    </span>
  );
};
