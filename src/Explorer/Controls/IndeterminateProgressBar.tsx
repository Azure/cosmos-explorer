import { ProgressBar, makeStyles } from "@fluentui/react-components";
import React from "react";

const useStyles = makeStyles({
  indeterminateProgressBarRoot: {
    '@media screen and (prefers-reduced-motion: reduce)': {
      animationIterationCount: "infinite",
      animationDuration: "3s",
      animationName: {
        "0%": {
          opacity: ".2", // matches indeterminate bar width
        },
        "50%": {
          opacity: "1",
        },
        "100%": {
          opacity: ".2",
        },
      },
    }
  },
  indeterminateProgressBarBar: {
    '@media screen and (prefers-reduced-motion: reduce)': {
      maxWidth: "100%",
    }
  }
});

export const IndeterminateProgressBar: React.FC = () => {
  const styles = useStyles();
  return <ProgressBar bar={{className: styles.indeterminateProgressBarBar}} className={styles.indeterminateProgressBarRoot} />;
};