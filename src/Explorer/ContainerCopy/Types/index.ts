import { DatabaseAccount, Subscription } from "Contracts/DataModels";
import React from "react";
import { ApiType } from "UserContext";
import Explorer from "../../Explorer";
import { CopyJobMigrationType } from "../Enums";

export interface ContainerCopyProps {
	container: Explorer;
}

export type CopyJobCommandBarBtnType = {
	key: string;
	iconSrc: string;
	label: string;
	ariaLabel: string;
	disabled?: boolean;
	onClick: () => void;
};

export type CopyJobTabForwardRefHandle = {
	validate: (state: CopyJobContextState) => boolean;
};

export type DropdownOptionType = {
	key: string,
	text: string,
	data: any
};

export type FetchDatabasesListParams = {
	armToken: string;
	subscriptionId: string;
	resourceGroupName: string;
	accountName: string;
	apiType?: ApiType;
};

export interface FetchDataContainersListParams extends FetchDatabasesListParams {
	databaseName: string;
}

export type DatabaseParams = [
	string,
	string | undefined,
	string | undefined,
	string | undefined,
	ApiType
];
export type DataContainerParams = [
	string,
	string | undefined,
	string | undefined,
	string | undefined,
	string | undefined,
	ApiType
];

export interface DatabaseContainerSectionProps {
	heading: string,
	databaseOptions: DropdownOptionType[],
	selectedDatabase: string,
	databaseDisabled?: boolean,
	databaseOnChange: (ev: any, option: DropdownOptionType) => void,
	containerOptions: DropdownOptionType[],
	selectedContainer: string,
	containerDisabled?: boolean,
	containerOnChange: (ev: any, option: DropdownOptionType) => void
}

export interface CopyJobContextState {
	jobName: string;
	migrationType: CopyJobMigrationType;
	// source details
	source: {
		subscription: Subscription;
		account: DatabaseAccount;
		databaseId: string;
		containerId: string;
	},
	// target details
	target: {
		subscriptionId: string;
		account: DatabaseAccount;
		databaseId: string;
		containerId: string;
	},
}

export interface CopyJobFlowType {
	currentScreen: string;
}

export interface CopyJobContextProviderType {
	armToken: string;
	flow: CopyJobFlowType;
	setFlow: React.Dispatch<React.SetStateAction<CopyJobFlowType>>;
	copyJobState: CopyJobContextState | null;
	setCopyJobState: React.Dispatch<React.SetStateAction<CopyJobContextState>>;
	resetCopyJobState: () => void;
}