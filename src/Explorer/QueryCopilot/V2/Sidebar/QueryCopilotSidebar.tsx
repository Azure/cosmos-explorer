import { Stack } from "@fluentui/react";
import { RetrievingBubble } from "Explorer/QueryCopilot/V2/Bubbles/Retriveing/RetrievingBubble";
import { SampleBubble } from "Explorer/QueryCopilot/V2/Bubbles/Sample/SampleBubble";
import { WelcomeBubble } from "Explorer/QueryCopilot/V2/Bubbles/Welcome/WelcomeBubble";
import { Footer } from "Explorer/QueryCopilot/V2/Footer/Footer";
import { Header } from "Explorer/QueryCopilot/V2/Header/Header";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";
import { WelcomeSidebarModal } from "../Modal/WelcomeSidebarModal";

export const QueryCopilotSidebar: React.FC = (): JSX.Element => {
  const { setWasCopilotUsed, showCopilotSidebar, chatMessages, showWelcomeSidebar } = useQueryCopilot();

  React.useEffect(() => {
    if (showCopilotSidebar) {
      setWasCopilotUsed(true);
    }
  }, []);

  return (
    <Stack style={{ width: "100%", height: "100%", backgroundColor: "#FAFAFA", overflow: "auto" }}>
      <Header />
      {showWelcomeSidebar ? (
        <WelcomeSidebarModal />
      ) : (
        <>
          <Stack
            style={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <WelcomeBubble />
            {chatMessages.map((message, index) => (
              <Stack
                key={index}
                horizontalAlign="center"
                tokens={{ padding: 8, childrenGap: 8 }}
                style={{
                  backgroundColor: "#E0E7FF",
                  borderRadius: "8px",
                  margin: "5px 10px",
                  textAlign: "start",
                }}
              >
                {message}
              </Stack>
            ))}

            <RetrievingBubble />

            {chatMessages.length === 0 && <SampleBubble />}
          </Stack>
          <Footer />
        </>
      )}
    </Stack>
  );
};
