/// <reference types="node" />
import { writeFileSync } from "fs";
import * as path from "path";
import fetch from "node-fetch";
import mkdirp from "mkdirp";

/* 
Open API TypeScript Client Generator 

This is a bespoke Open API client generator not intended for general public use. 
It is not designed to handle the full OpenAPI spec.
Many other more general purpose generators exist, but their output is very verbose and overly complex for our use case.
But it does work well enough to generate a fully typed tree-shakeable client for the Cosmos resource provider.
Results of this file should be checked into the repo.
*/

// Array of strings to use for eventual output
const outputTypes: string[] = [""];

const schemaURL =
  "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/master/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/2020-06-01-preview/cosmos-db.json";

const outputDir = path.join(__dirname, "../../src/Utils/arm/");
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
  integer: "number"
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
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word: string, index: number) {
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
      .join(" | ");
  }
  return "unknown";
}

async function main() {
  const response = await fetch(schemaURL);
  const schema = await response.json();

  // STEP 1: Convert all definitions to TypeScript types and interfaces
  for (const definition in schema.definitions) {
    const properties = schema.definitions[definition].properties;
    if (properties) {
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
        if (property) {
          if (property.$ref) {
            const type = refToType(property.$ref);
            outputTypes.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}
            `);
          } else if (property.type === "array") {
            const type = refToType(property.items.$ref);
            outputTypes.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}[]
            `);
          } else if (property.type === "object") {
            const type = refToType(property.$ref);
            outputTypes.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}
            `);
          } else {
            outputTypes.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${
              propertyMap[property.type] ? propertyMap[property.type] : property.type
            }`);
          }
        }
      }
      outputTypes.push(`}`);
      outputTypes.push("\n\n");
    } else {
      const def = schema.definitions[definition];
      if (def.enum) {
        outputTypes.push(`
        /* ${def.description} */
        export type ${definition} = ${def.enum.map((v: string) => `"${v}"`).join(" | ")}`);
        outputTypes.push("\n");
      } else if (def.type === "string") {
        outputTypes.push(`
        /* ${def.description} */
        export type ${definition} = string
          `);
      } else if (def.type === "array") {
        const type = refToType(def.items.$ref);
        outputTypes.push(`
        /* ${def.description} */
        export type ${definition} = ${type}[]
        `);
      } else if (def.type === "object" && def.additionalProperties) {
        outputTypes.push(`
        /* ${def.description} */
        export type ${definition} = { [key: string]: ${def.additionalProperties.type}}
        `);
      } else if (def.type === "object" && def.allOf) {
        const type = refToType(def.allOf[0].$ref);
        outputTypes.push(`
        /* ${def.description} */
        export type ${definition} = ${type}
        `);
      } else {
        console.log("UNHANDLED MODEL:", def, schema.definitions[def]);
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
    outputClient.push(`import * as Types from "./types"\n\n`);
    for (const path of clients[clientName].paths) {
      for (const method in schema.paths[path]) {
        const operation = schema.paths[path][method];
        const [, methodName] = operation.operationId.split("_");
        const bodyParameter = operation.parameters.find(
          (parameter: { in: string; required: boolean }) => parameter.in === "body" && parameter.required === true
        );
        outputClient.push(`
          /* ${operation.description} */
          export async function ${sanitize(camelize(methodName))} (
            ${parametersFromPath(path)
              .map(p => `${p}: string`)
              .join(",\n")}
            ${bodyParam(bodyParameter, "Types")}
          ) : Promise<${responseType(operation, "Types")}> {
            const path = \`${path.replace(/{/g, "${")}\`
            return window.fetch(this.baseUrl + this.basePath + path, { method: "${method}", ${
          bodyParameter ? "body: JSON.stringify(body)" : ""
        } }).then((response) => response.json())
          }
          `);
      }
    }
    writeOutputFile(`./${clientName}.ts`, outputClient);
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
  Do not manually edit
  Run "npm run generateARMClients" to regenerate
*/\n\n`);
  writeFileSync(path.join(outputDir, outputPath), components.join(""));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
