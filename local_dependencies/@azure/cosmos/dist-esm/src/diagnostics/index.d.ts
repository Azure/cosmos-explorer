import { CosmosDbDiagnosticLevel } from "./CosmosDbDiagnosticLevel";
export * from "./DiagnosticWriter";
export * from "./DiagnosticFormatter";
export declare const DefaultDiagnosticLevelValue = CosmosDbDiagnosticLevel.info;
export declare function setDiagnosticLevel(level?: CosmosDbDiagnosticLevel): void;
export declare function getDiagnosticLevelFromEnvironment(): CosmosDbDiagnosticLevel | undefined;
export declare function determineDiagnosticLevel(diagnosticLevelFromClientConfig: CosmosDbDiagnosticLevel, diagnosticLevelFromEnvironment: CosmosDbDiagnosticLevel): CosmosDbDiagnosticLevel;
//# sourceMappingURL=index.d.ts.map