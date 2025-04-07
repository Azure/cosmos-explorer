/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * API versions configuration for CloudShell
 */

import { TerminalKind } from "../../../../Contracts/ViewModels";
import { ResourceType } from "./DataModels";

/**
 * Configuration for API versions used by the CloudShell
 */
export type ApiVersionsConfig = {
    DEFAULT: string;
    RESOURCE_DEFAULTS: Record<ResourceType, string>;
    SHELL_TYPES: Record<TerminalKind, Record<ResourceType, string>>;
}

/**
 * Default API versions configuration
 */
export const DEFAULT_API_VERSIONS: ApiVersionsConfig = {
    DEFAULT: '2024-07-01',
    RESOURCE_DEFAULTS: {
      [ResourceType.DATABASE]: '2024-11-15',
      [ResourceType.NETWORK]: '2024-07-01',
      [ResourceType.VNET]: '2024-07-01',
      [ResourceType.SUBNET]: '2024-07-01',
      [ResourceType.RELAY]: '2022-10-01',
      [ResourceType.ROLE]: '2022-04-01',
    },
    SHELL_TYPES: {
      [TerminalKind.Mongo]: {
        [ResourceType.DATABASE]: '2024-11-15',
        [ResourceType.NETWORK]: '2024-07-01',
        [ResourceType.VNET]: '2024-07-01',
        [ResourceType.SUBNET]: '2024-07-01',
        [ResourceType.RELAY]: '2024-01-01',
        [ResourceType.ROLE]: '2022-04-01',
      },
      [TerminalKind.VCoreMongo]: {
        [ResourceType.DATABASE]: '2024-07-01',
        [ResourceType.NETWORK]: '2024-07-01',
        [ResourceType.VNET]: '2024-07-01',
        [ResourceType.SUBNET]: '2024-07-01',
        [ResourceType.RELAY]: '2024-01-01',
        [ResourceType.ROLE]: '2022-04-01',
      },
      [TerminalKind.Postgres]: {
        [ResourceType.DATABASE]: '2024-11-15',
        [ResourceType.NETWORK]: '2024-07-01',
        [ResourceType.VNET]: '2024-07-01',
        [ResourceType.SUBNET]: '2024-07-01',
        [ResourceType.RELAY]: '2024-01-01',
        [ResourceType.ROLE]: '2022-04-01',
      },
      [TerminalKind.Cassandra]: {
        [ResourceType.DATABASE]: '2024-11-15',
        [ResourceType.NETWORK]: '2024-07-01',
        [ResourceType.VNET]: '2024-07-01',
        [ResourceType.SUBNET]: '2024-07-01',
        [ResourceType.RELAY]: '2024-01-01',
        [ResourceType.ROLE]: '2022-04-01',
      },
      [TerminalKind.Default]: {
        [ResourceType.DATABASE]: undefined,
        [ResourceType.NETWORK]: undefined,
        [ResourceType.VNET]: undefined,
        [ResourceType.SUBNET]: undefined,
        [ResourceType.RELAY]: undefined,
        [ResourceType.ROLE]: undefined,
      },
    },
  };
  
