import * as PriorityBasedExecutionUtils from "./PriorityBasedExecutionUtils";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { PriorityLevel } from "../Common/Constants";
import * as Cosmos from "@azure/cosmos";

describe("Priority execution utility", () => {

  it("check default priority level is Low", () => {
	expect(PriorityBasedExecutionUtils.getPriorityLevel()).toEqual(PriorityLevel.Low)
  });

  it("check the priority level is returned as present in local storage", () => {
	LocalStorageUtility.setEntryString(StorageKey.PriorityLevel, PriorityLevel.High);
	expect(PriorityBasedExecutionUtils.getPriorityLevel()).toEqual(PriorityLevel.High)

  });
  
  it("check relevant request based on different resource types", () => {
	const requestContext1: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.item,
	}
	const requestContext2: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.conflicts,
	}
	const requestContext3: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.sproc,
		operationType: Cosmos.OperationType.Execute,
	}
	const requestContext4: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.database,
	}
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext1)).toEqual(true)
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext2)).toEqual(true)
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext3)).toEqual(true)
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext4)).toEqual(false)
	
  });


});