import { ChoiceGroup, Stack, Text } from "@fluentui/react";
import React from "react";

interface PromptCardProps {
  header: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  header,
  description,
  isSelected,
  onSelect,
}: PromptCardProps): JSX.Element => {
  return (
    <Stack
      horizontal
      style={{
        padding: "16px 0 16px 16px ",
        boxSizing: "border-box",
        width: 650,
        height: 100,
        border: "1px solid #F3F2F1",
        boxShadow: "0px 1.6px 3.6px rgba(0, 0, 0, 0.132), 0px 0.3px 0.9px rgba(0, 0, 0, 0.108)",
      }}
    >
      <Stack.Item grow={1}>
        <Stack horizontal>
          <div>
            <Text style={{ fontSize: 13, color: "#00A2AD", background: "#F8FFF0" }}>Prompt</Text>
          </div>
          <Text style={{ fontSize: 13, marginLeft: 16 }}>{header}</Text>
        </Stack>
        <Text style={{ fontSize: 10, marginTop: 16 }}>{description}</Text>
      </Stack.Item>
      <Stack.Item style={{ marginLeft: 16 }}>
        <ChoiceGroup
          styles={{ flexContainer: { width: 36 } }}
          options={[{ key: "selected", text: "" }]}
          selectedKey={isSelected ? "selected" : ""}
          onChange={onSelect}
        />
      </Stack.Item>
    </Stack>
  );
};
