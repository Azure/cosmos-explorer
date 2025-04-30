/**
 * Accordion top class
 */
import { Link, makeStyles, tokens } from "@fluentui/react-components";
import { DocumentAddRegular, LinkMultipleRegular } from "@fluentui/react-icons";
import { SampleDataImportDialog } from "Explorer/SplashScreen/SampleDataImportDialog";
import { CosmosFluentProvider } from "Explorer/Theme/ThemeUtil";
import { isFabricNative, isFabricNativeReadOnly } from "Platform/Fabric/FabricUtil";
import * as React from "react";
import { userContext } from "UserContext";
import CosmosDbBlackIcon from "../../../images/CosmosDB_black.svg";
import LinkIcon from "../../../images/Link_blue.svg";
import Explorer from "../Explorer";

export interface SplashScreenProps {
  explorer: Explorer;
}

const useStyles = makeStyles({
  homeContainer: {
    width: "100%",
    alignContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "bold",
  },
  buttonsContainer: {
    width: "584px",
    margin: "auto",
    display: "grid",
    padding: "16px",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    gridAutoRows: "minmax(184px, auto)",
  },
  one: {
    gridColumn: "1 / 3",
    gridRow: "1 / 3",
    "& svg": {
      width: "48px",
      height: "48px",
      margin: "auto",
    },
  },
  two: {
    gridColumn: "3",
    gridRow: "1",
    "& img": {
      width: "32px",
      height: "32px",
      margin: "auto",
    },
  },
  three: {
    gridColumn: "3",
    gridRow: "2",
    "& svg": {
      width: "32px",
      height: "32px",
      margin: "auto",
    },
  },
  single: {
    gridColumn: "1 / 4",
    gridRow: "1 / 3",
    "& svg": {
      width: "64px",
      height: "64px",
      margin: "auto",
    },
  },
  buttonContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      "border-color": tokens.colorNeutralStroke1Hover,
    },
  },
  buttonUpperPart: {
    textAlign: "center",
    flexGrow: 1,
    display: "flex",
    backgroundColor: "#e3f7ef",
  },
  buttonLowerPart: {
    borderTop: "1px solid #e0e0e0",
    height: "76px",
    padding: "8px",
    "> div:nth-child(1)": {
      fontWeight: "bold",
    },
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  footer: {
    textAlign: "center",
  },
});

interface FabricHomeScreenButtonProps {
  title: string;
  description: string;
  icon: JSX.Element;
  onClick?: () => void;
}

const FabricHomeScreenButton: React.FC<FabricHomeScreenButtonProps & { className: string }> = ({
  title,
  description,
  icon,
  className,
  onClick,
}) => {
  const styles = useStyles();
  return (
    <div role="button" className={`${styles.buttonContainer} ${className}`} onClick={onClick}>
      <div className={styles.buttonUpperPart}>{icon}</div>
      <div aria-label={title} className={styles.buttonLowerPart}>
        <div>{title}</div>
        <div>{description}</div>
      </div>
    </div>
  );
};

export const FabricHomeScreen: React.FC<SplashScreenProps> = (props: SplashScreenProps) => {
  const styles = useStyles();
  const [openSampleDataImportDialog, setOpenSampleDataImportDialog] = React.useState(false);

  const getSplashScreenButtons = (): JSX.Element => {
    const buttons: FabricHomeScreenButtonProps[] = [
      {
        title: "New container",
        description: "Create a destination container to store your data",
        icon: <DocumentAddRegular />,
        onClick: () => {
          const databaseId = isFabricNative() ? userContext.fabricContext?.databaseName : undefined;
          props.explorer.onNewCollectionClicked({ databaseId });
        },
      },
      {
        title: "Sample data",
        description: "Automatically load sample data in your database",
        icon: <img src={CosmosDbBlackIcon} />,
        onClick: () => setOpenSampleDataImportDialog(true),
      },
      {
        title: "App development",
        description: "Start here to use an SDK to build your apps",
        icon: <LinkMultipleRegular />,
        onClick: () => window.open("https://aka.ms/cosmosdbfabricsdk", "_blank"),
      },
    ];

    return isFabricNativeReadOnly() ? (
      <div className={styles.buttonsContainer}>
        <FabricHomeScreenButton className={styles.single} {...buttons[2]} />
      </div>
    ) : (
      <div className={styles.buttonsContainer}>
        <FabricHomeScreenButton className={styles.one} {...buttons[0]} />
        <FabricHomeScreenButton className={styles.two} {...buttons[1]} />
        <FabricHomeScreenButton className={styles.three} {...buttons[2]} />
      </div>
    );
  };

  const title = isFabricNativeReadOnly() ? "Use your database" : "Build your database";
  return (
    <>
      <CosmosFluentProvider className={styles.homeContainer}>
        <SampleDataImportDialog
          open={openSampleDataImportDialog}
          setOpen={setOpenSampleDataImportDialog}
          explorer={props.explorer}
          databaseName={userContext.fabricContext?.databaseName}
        />
        <div className={styles.title} role="heading" aria-label={title}>
          {title}
        </div>
        {getSplashScreenButtons()}
        <div className={styles.footer}>
          Need help?{" "}
          <Link href="https://aka.ms/cosmosdbfabricdocs" target="_blank">
            Learn more <img src={LinkIcon} alt="Learn more" />
          </Link>
        </div>
      </CosmosFluentProvider>
    </>
  );
};
