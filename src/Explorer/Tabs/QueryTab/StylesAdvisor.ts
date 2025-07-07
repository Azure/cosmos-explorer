import { makeStyles } from "@fluentui/react-components";
export type IndexAdvisorStyles = ReturnType<typeof useIndexAdvisorStyles>;
export const useIndexAdvisorStyles = makeStyles({
  indexAdvisorMessage: {
    padding: "1rem",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  indexAdvisorSuccessIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "#107C10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  indexAdvisorTitle: {
    padding: "1rem",
    fontSize: "1.3rem",
    fontWeight: "bold",
  },
  indexAdvisorTable: {
    display: "block",
    alignItems: "center",
    marginBottom: "7rem",
  },
  indexAdvisorGrid: {
    display: "grid",
    gridTemplateColumns: "30px 30px 1fr 50px 120px",
    alignItems: "center",
    gap: "15px",
    fontWeight: "bold",
  },
  indexAdvisorCheckboxSpacer: {
    width: "18px",
    height: "18px",
  },
  indexAdvisorChevronSpacer: {
    width: "24px",
  },
  indexAdvisorRowBold: {
    fontWeight: "bold",
  },
  indexAdvisorRowNormal: {
    fontWeight: "normal",
  },
  indexAdvisorRowImpactHeader: {
    fontSize: 0,
  },
  indexAdvisorRowImpact: {
    fontWeight: "normal",
  },
  indexAdvisorImpactDot: {
    color: "#0078D4",
    fontSize: "12px",
    display: "inline-flex",
  },
  indexAdvisorImpactDots: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  indexAdvisorButtonBar: {
    padding: "1rem",
    marginTop: "-7rem",
    flexWrap: "wrap",
  },
  indexAdvisorButtonSpinner: {
    marginTop: "1rem",
    minWidth: "320px",
    minHeight: "40px",
    display: "flex",
    alignItems: "left",
    justifyContent: "left",
    marginLeft: "10rem",
  },
  indexAdvisorButton: {
    backgroundColor: "#0078D4",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "1rem",
    fontSize: "1rem",
    fontWeight: 500,
    transition: "background 0.2s",
    ":hover": {
      backgroundColor: "#005a9e",
    },
  },
});
