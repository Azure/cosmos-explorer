/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Tests for PostgreSQL shell type handler
 */

import { PostgresShellHandler } from '../PostgresShellHandler';

// Mock dependencies
jest.mock("../../../../../UserContext", () => ({
  userContext: {
    databaseAccount: {
      properties: {
        postgresqlEndpoint: 'test-postgres.postgres.database.azure.com'
      }
    }
  }
}));

describe('PostgresShellHandler', () => {
  let postgresShellHandler: PostgresShellHandler;

  beforeEach(() => {
    postgresShellHandler = new PostgresShellHandler();
    jest.clearAllMocks();
  });

  // Positive test cases
  describe('Positive Tests', () => {
    it('should return correct shell name', () => {
      expect(postgresShellHandler.getShellName()).toBe('PostgreSQL');
    });

    it('should return PostgreSQL endpoint from userContext', () => {
      expect(postgresShellHandler.getEndpoint()).toBe('test-postgres.postgres.database.azure.com');
    });

    it('should return array of setup commands with correct package version', () => {
      const commands = postgresShellHandler.getSetUpCommands();
      
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(9);
      expect(commands[1]).toContain('postgresql-15.2.tar.bz2');
      expect(commands[0]).toContain('psql not found');
    });

    it('should generate proper connection command with endpoint', () => {
      const connectionCommand = postgresShellHandler.getConnectionCommand();
      
      expect(connectionCommand).toContain('read -p "Enter Database Name: " dbname');
      expect(connectionCommand).toContain('read -p "Enter Username: " username');
      expect(connectionCommand).toContain('-h "test-postgres.postgres.database.azure.com"');
      expect(connectionCommand).toContain('-p 5432');
      expect(connectionCommand).toContain('--set=sslmode=require');
    });

    it('should return empty string for terminal suppressed data', () => {
      expect(postgresShellHandler.getTerminalSuppressedData()).toBe('');
    });
  });

  // Negative test cases
  describe('Negative Tests', () => {
    it('should handle missing PostgreSQL endpoint', () => {
      // Re-mock UserContext with missing endpoint
      jest.resetModules();
      jest.doMock("../../../../../UserContext", () => ({
        userContext: {
          databaseAccount: {
            properties: {}
          }
        }
      }));
      
      // Import fresh instance with updated mock
      const { PostgresShellHandler } = require('../PostgresShellHandler');
      const handler = new PostgresShellHandler();
      
      expect(handler.getEndpoint()).toBeUndefined();
      
      // Test connection command with missing endpoint
      const connectionCommand = handler.getConnectionCommand();
      expect(connectionCommand).toContain("echo 'PostgreSQL endpoint not found.'");
      
      // Reset mock to original state for subsequent tests
      jest.resetModules();
      jest.doMock("../../../../../UserContext", () => ({
        userContext: {
          databaseAccount: {
            properties: {
              postgresqlEndpoint: 'test-postgres.postgres.database.azure.com'
            }
          }
        }
      }));
    });

    it('should handle null userContext', () => {
      // Re-mock UserContext as null
      jest.resetModules();
      jest.doMock("../../../../../UserContext", () => ({
        userContext: null
      }));
      
      // Import fresh instance with updated mock
      const { PostgresShellHandler } = require('../PostgresShellHandler');
      const handler = new PostgresShellHandler();
      
      expect(handler.getEndpoint()).toBeUndefined();
      
      // Reset mock to original state for subsequent tests
      jest.resetModules();
      jest.doMock("../../../../../UserContext", () => ({
        userContext: {
          databaseAccount: {
            properties: {
              postgresqlEndpoint: 'test-postgres.postgres.database.azure.com'
            }
          }
        }
      }));
    });

    it('should handle null databaseAccount', () => {
      // Re-mock UserContext with null databaseAccount
      jest.resetModules();
      jest.doMock("../../../../../UserContext", () => ({
        userContext: {
          databaseAccount: null
        }
      }));
      
      // Clear cache and import fresh instance with updated mock
      const { PostgresShellHandler } = require('../PostgresShellHandler');
      const handler = new PostgresShellHandler();
      
      expect(handler.getEndpoint()).toBeUndefined();
      
      // Reset mock to original state for subsequent tests
      jest.resetModules();
      jest.doMock("../../../../../UserContext", () => ({
        userContext: {
          databaseAccount: {
            properties: {
              postgresqlEndpoint: 'test-postgres.postgres.database.azure.com'
            }
          }
        }
      }));
    });
  });
});
