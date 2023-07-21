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
      globalEndpointManager: null,
      connectionPolicy: null,
      requestAgent: null,
      method: null,
      options: null,
      plugins: null,
	  }
	const requestContext2: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.conflicts,
	      globalEndpointManager: null,
      connectionPolicy: null,
      requestAgent: null,
      method: null,
      options: null,
      plugins: null,
	  }
	const requestContext3: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.sproc,
		operationType: Cosmos.OperationType.Execute,
      globalEndpointManager: null,
      connectionPolicy: null,
      requestAgent: null,
      method: null,
      options: null,
      plugins: null,
	  }
	const requestContext4: Cosmos.RequestContext = {
		resourceType: Cosmos.ResourceType.database,
		      globalEndpointManager: null,
      connectionPolicy: null,
      requestAgent: null,
      method: null,
      options: null,
      plugins: null,
	}
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext1)).toEqual(true)
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext2)).toEqual(true)
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext3)).toEqual(true)
	expect(PriorityBasedExecutionUtils.isRelevantRequest(requestContext4)).toEqual(false)
	
  });


});