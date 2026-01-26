/* eslint-disable no-console */
/// <reference types="node" />
import { writeFileSync } from "fs";
import mkdirp from "mkdirp";
import fetch from "node-fetch";
import * as path from "path";

/* 
Open API TypeScript Client Generator 

This is a bespoke Open API client generator not intended for general public use. 
It is not designed to handle the full OpenAPI spec.
Many other more general purpose generators exist, but their output is very verbose and overly complex for our use case.
But it does work well enough to generate a fully typed tree-shakeable client for the Cosmos resource provider.
Results of this file should be checked into the repo.
*/

// CHANGE THESE VALUES TO GENERATE NEW CLIENTS
const version = "2025-05-01-preview";
/* The following are legal options for resourceName but you generally will only use cosmos:
"cosmos" | "managedCassandra" | "mongorbac" | "notebook" | "privateEndpointConnection" | "privateLinkResources" |
"rbac" | "restorable" | "services" | "dataTransferService"
*/
const githubResourceName = "cosmos-db";
const deResourceName = "cosmos";
const schemaURL = `https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/${version}/${githubResourceName}.json`;
const outputDir = path.join(__dirname, `../../src/Utils/arm/generatedClients/${deResourceName}`);

// Array of strings to use for eventual output
const outputTypes: string[] = [""];
mkdirp.sync(outputDir);

// Buckets for grouping operations based on their name
interface Client {
  paths: string[];
  functions: string[];
  constructorParams: string[];
}
const clients: { [key: string]: Client } = {};

// Mapping for OpenAPI types to TypeScript types
const propertyMap: { [key: string]: string } = {
  integer: "number",
};

// Converts a Open API reference: "#/definitions/Foo" to a type name: Foo
function refToType(path: string | undefined, namespace?: string) {
  // References must be in the same file. Bail to `unknown` types for remote references
  if (path && path.startsWith("#")) {
    const type = path.split("/").pop();
    return namespace ? `${namespace}.${type}` : type;
  }
  return "unknown";
}

// Converts "Something_Foo" ->  "somethingFoo"
function camelize(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word: string, index: number) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

// Converts a body paramter to the equivalent typescript function parameter type
function bodyParam(parameter: { schema: { $ref: string } }, namespace: string) {
  if (!parameter) {
    return "";
  }
  return `,body: ${refToType(parameter.schema.$ref, namespace)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parametersFromPath(path: string) {
  // TODO: Remove any. String.matchAll is a real thing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches = (path as any).matchAll(/{(\w+)}/g);
  return Array.from(matches).map((match: string[]) => match[1]);
}

type Operation = { responses: { [key: string]: { schema: { $ref: string } } } };

// Converts OpenAPI response definition to TypeScript return type. Uses unions if possible. Bails to unknown
function responseType(operation: Operation, namespace: string) {
  if (operation.responses) {
    return Object.keys(operation.responses)
      .map((responseCode: string) => {
        if (!operation.responses[responseCode].schema) {
          return "void";
        }
        return refToType(operation.responses[responseCode].schema.$ref, namespace);
      })
      .filter((value, index, array) => array.indexOf(value) === index)
      .filter((value) => value !== "unknown")
      .join(" | ");
  }
  return "unknown";
}

interface Property {
  $ref?: string;
  description?: string;
  readOnly?: boolean;
  type: "array" | "object" | "unknown";
  properties: Property[];
  items?: {
    $ref: string;
  };
  enum?: string[];
  allOf?: {
    $ref: string;
  }[];
}

const propertyToType = (property: Property, prop: string, required: boolean) => {
  if (property) {
    if (property.allOf) {
      outputTypes.push(`
      /* ${property.description || "undocumented"} */
      ${property.readOnly ? "readonly " : ""}${prop}${required ? "" : "?"}: ${property.allOf
        .map((allof: { $ref: string }) => refToType(allof.$ref))
        .join(" & ")}`);
    } else if (property.$ref) {
      const type = refToType(property.$ref);
      outputTypes.push(`
          /* ${property.description || "undocumented"} */
          ${property.readOnly ? "readonly " : ""}${prop}${required ? "" : "?"}: ${type}
          `);
    } else if (property.type === "array") {
      const type = refToType(property.items.$ref);
      outputTypes.push(`
          /* ${property.description || "undocumented"} */
          ${property.readOnly ? "readonly " : ""}${prop}${required ? "" : "?"}: ${type}[]
          `);
    } else if (property.type === "object") {
      const type = refToType(property.$ref);
      outputTypes.push(`
          /* ${property.description || "undocumented"} */
          ${property.readOnly ? "readonly " : ""}${prop}${required ? "" : "?"}: ${type}
          `);
    } else if (property.enum) {
      outputTypes.push(`
          /* ${property.description || "undocumented"} */
          ${property.readOnly ? "readonly " : ""}${prop}${required ? "" : "?"}: ${property.enum
            .map((v: string) => `"${v}"`)
            .join(" | ")}
          `);
    } else {
      if (property.type === undefined) {
        console.log(`generator.ts - UNHANDLED TYPE: ${prop}. Falling back to unknown`);
        property.type = "unknown";
      }
      outputTypes.push(`
          /* ${property.description || "undocumented"} */
          ${property.readOnly ? "readonly " : ""}${prop}${required ? "" : "?"}: ${
            propertyMap[property.type] ? propertyMap[property.type] : property.type
          }`);
    }
  }
};

async function main() {
  const response = await fetch(schemaURL);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: any = await response.json();

  // STEP 1: Convert all definitions to TypeScript types and interfaces
  for (const definition in schema.definitions) {
    const properties = schema.definitions[definition].properties;
    if (properties) {
      outputTypes.push(`
      /* ${schema.definitions[definition].description || "undocumented"} */
      `);
      if (schema.definitions[definition].allOf) {
        const baseTypes = schema.definitions[definition].allOf
          .map((allof: { $ref: string }) => refToType(allof.$ref))
          .join(" & ");
        outputTypes.push(`export type ${definition} = ${baseTypes} & {`);
      } else {
        outputTypes.push(`export interface ${definition} {`);
      }
      for (const prop in schema.definitions[definition].properties) {
        const property = schema.definitions[definition].properties[prop];
        propertyToType(property, prop, schema.definitions[definition].required?.includes(prop));
      }
      outputTypes.push(`}`);
      outputTypes.push("\n\n");
    } else {
      const def = schema.definitions[definition];
      if (def.enum) {
        outputTypes.push(`
        /* ${def.description || "undocumented"} */
        export type ${definition} = ${def.enum.map((v: string) => `"${v}"`).join(" | ")}`);
        outputTypes.push("\n");
      } else if (def.type === "string") {
        outputTypes.push(`
        /* ${def.description || "undocumented"} */
        export type ${definition} = string
          `);
      } else if (def.type === "array") {
        const type = refToType(def.items.$ref);
        outputTypes.push(`
        /* ${def.description || "undocumented"} */
        export type ${definition} = ${type}[]
        `);
      } else if (def.type === "object" && def.additionalProperties) {
        outputTypes.push(`
        /* ${def.description || "undocumented"} */
        export type ${definition} = { [key: string]: ${def.additionalProperties.type}}
        `);
      } else if (def.type === "object" && def.allOf) {
        const type = refToType(def.allOf[0].$ref);
        outputTypes.push(`
        /* ${def.description} */
        export type ${definition} = ${type}
        `);
      } else {
        console.log("generator.ts - UNHANDLED MODEL:", def, schema.definitions[def]);
      }
    }
  }

  // STEP 2: Group all paths by output client and extract common constructor parameters
  // Functions are grouped into clients based on operation name
  for (const path in schema.paths) {
    for (const method in schema.paths[path]) {
      const operation = schema.paths[path][method];
      const [namespace] = operation.operationId.split("_");
      if (clients[namespace] === undefined) {
        clients[namespace] = { paths: [], functions: [], constructorParams: [] };
        clients[namespace];
      }
      if (!clients[namespace].paths.includes(path)) {
        clients[namespace].paths.push(path);
      }
    }
  }

  // Write all grouped fetch functions to objects
  for (const clientName in clients) {
    const outputClient: string[] = [""];
    outputClient.push(`import { armRequest } from "../../request"\n`);
    outputClient.push(`import * as Types from "./types"\n`);
    outputClient.push(`import { configContext } from "../../../../ConfigContext";\n`);
    outputClient.push(`const apiVersion = "${version}"\n\n`);
    for (const path of clients[clientName].paths) {
      for (const method in schema.paths[path]) {
        const operation = schema.paths[path][method];
        const [, methodName] = operation.operationId.split("_");
        const bodyParameter = operation.parameters.find(
          (parameter: { in: string; required: boolean }) => parameter.in === "body" && parameter.required === true,
        );
        outputClient.push(`
          /* ${operation.description || "undocumented"} */
          export async function ${sanitize(camelize(methodName))} (
            ${parametersFromPath(path)
              .map((p) => `${p}: string`)
              .join(",\n")}
            ${bodyParam(bodyParameter, "Types")}
          ) : Promise<${responseType(operation, "Types")}> {
            const path = \`${path.replace(/{/g, "${")}\`
            return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "${method.toLocaleUpperCase()}", apiVersion, ${
              bodyParameter ? "body" : ""
            } })
          }
          `);
      }
    }
    writeOutputFile(`./${camelize(clientName)}.ts`, outputClient);
  }

  writeOutputFile("./types.ts", outputTypes);
}

function sanitize(name: string) {
  if (name === "delete") {
    return "destroy";
  }
  return name;
}

function writeOutputFile(outputPath: string, components: string[]) {
  components.unshift(`/* 
  AUTOGENERATED FILE
  Run "npm run generateARMClients" to regenerate
  Edting this file directly should be done with extreme caution as not to diverge from ARM REST specs

  Generated from: ${schemaURL}
*/\n\n`);
  writeFileSync(path.join(outputDir, outputPath), components.join(""));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
