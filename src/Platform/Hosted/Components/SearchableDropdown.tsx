import { Callout, DefaultButton, DirectionalHint, Stack, TextField } from "office-ui-fabric-react";
import React from "react";

export interface DropdownItem {
  key: string;
  text: string;
}

export interface SearchableDropdownProps {
  items: DropdownItem[];
  onItemSelected: (selectedItem: DropdownItem) => void;
  defaultSelectedItem?: DropdownItem;
  placeholder?: string;
  title?: string;
}

export interface SearchableDropdownState {
  isDropdownExpanded: boolean;
  selectedItem: DropdownItem;
  filteredItems: DropdownItem[];
}

export class SearchableDropdown extends React.Component<SearchableDropdownProps, SearchableDropdownState> {
  constructor(props: SearchableDropdownProps) {
    super(props);

    this.state = {
      isDropdownExpanded: false,
      selectedItem: props.defaultSelectedItem,
      filteredItems: props.items,
    };
  }

  public render(): JSX.Element {
    return this.state.isDropdownExpanded ? (
      <Stack>
        <TextField
          className="dropdownTextField"
          title={this.props.title}
          onChange={(event, newInput?: string) => this.onSearchInputChange(newInput)}
          placeholder={this.props.placeholder}
          autoFocus
        />
        <Callout
          isBeakVisible={false}
          target=".dropdownTextField"
          directionalHint={DirectionalHint.rightTopEdge}
          onDismiss={() => this.setState({ isDropdownExpanded: false })}
          gapSpace={0}
        >
          <Stack>
            {this.state.filteredItems?.map((item) => (
              <DefaultButton
                key={item.key}
                text={item.text}
                style={{ border: "none", textAlign: "left" }}
                styles={{ label: { fontWeight: "normal" } }}
                onClick={() => this.onItemSelected(item)}
              />
            ))}
          </Stack>
        </Callout>
      </Stack>
    ) : (
      <TextField
        className="dropdownTextField"
        title={this.props.title}
        onClick={() => this.setState({ isDropdownExpanded: true, filteredItems: this.props.items })}
        value={this.state.selectedItem?.text || ""}
        placeholder={this.props.placeholder}
        readOnly
      />
    );
  }

  private onSearchInputChange(newInput: string): void {
    const filteredItems = this.props.items.filter((item: DropdownItem) =>
      item.text.toLocaleLowerCase().includes(newInput.toLocaleLowerCase())
    );
    this.setState({ filteredItems });
  }

  private onItemSelected(item: DropdownItem): void {
    this.setState({ selectedItem: item, isDropdownExpanded: false });
    this.props.onItemSelected(item);
  }
}
