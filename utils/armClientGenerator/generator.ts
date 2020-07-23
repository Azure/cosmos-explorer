/// <reference types="node" />
const { writeFileSync } = require("fs");
const schema = require("./schema.json");

const file: string[] = [""];

const propertyMap: { [key: string]: string } = {
  integer: "number"
};

function refToType(path: string | undefined) {
  // Handles refs pointing to other files. We don't support that yet.
  if (path && path.startsWith("#")) {
    return path.split("/").pop();
  }
  return "unknown";
}

function bodyParam(parameter: any) {
  if (!parameter) {
    return "";
  }
  return `,body: ${refToType(parameter.schema.$ref)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parametersFromPath(path: any) {
  // TODO: Remove any. String.matchAll is a real thing.
  const matches = path.matchAll(/{(\w+)}/g);
  return Array.from(matches)
    .map((match: string[]) => `${match[1]}: string`)
    .join(",\n");
}

function responseType(operation: any) {
  if (operation.responses) {
    return Object.keys(operation.responses)
      .map((responseCode: any) => {
        if (!operation.responses[responseCode].schema) {
          return "void";
        }
        return refToType(operation.responses[responseCode].schema.$ref);
      })
      .join(" | ");
  }
  return "unknown";
}

async function main() {
  for (const interface in schema.definitions) {
    const properties = schema.definitions[interface].properties;
    if (properties) {
      if (schema.definitions[interface].allOf) {
        const baseTypes = schema.definitions[interface].allOf
          .map((allof: { $ref: string }) => refToType(allof.$ref))
          .join(" & ");
        file.push(`export type ${interface} = ${baseTypes} & {`);
      } else {
        file.push(`export interface ${interface} {`);
      }
      for (const prop in schema.definitions[interface].properties) {
        const property = schema.definitions[interface].properties[prop];
        if (property) {
          if (property.$ref) {
            const type = refToType(property.$ref);
            file.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}
            `);
          } else if (property.type === "array") {
            const type = refToType(property.items.$ref);
            file.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}[]
            `);
          } else if (property.type === "object") {
            const type = refToType(property.$ref);
            file.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}
            `);
          } else {
            file.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${
              propertyMap[property.type] ? propertyMap[property.type] : property.type
            }`);
          }
        }
      }
      file.push(`}`);
      file.push("\n\n");
    } else {
      const definition = schema.definitions[interface];
      if (definition.enum) {
        file.push(`
        /* ${definition.description} */
        type ${interface} = ${definition.enum.map((v: string) => `"${v}"`).join(" | ")}`);
        file.push("\n");
      } else if (definition.type === "string") {
        file.push(`
        /* ${definition.description} */
        type ${interface} = string
          `);
      } else if (definition.type === "array") {
        const type = refToType(definition.items.$ref);
        file.push(`
        /* ${definition.description} */
        type ${interface} = ${type}[]
        `);
      } else if (definition.type === "object" && definition.additionalProperties) {
        file.push(`
        /* ${definition.description} */
        type ${interface} = { [key: string]: ${definition.additionalProperties.type}}
        `);
      } else if (definition.type === "object" && definition.allOf) {
        const type = refToType(definition.allOf[0].$ref);
        file.push(`
        /* ${definition.description} */
        type ${interface} = ${type}
        `);
      } else {
        console.log("UNHANDLED MODEL:", interface, schema.definitions[interface]);
      }
    }
  }

  for (const path in schema.paths) {
    for (const method in schema.paths[path]) {
      const operation = schema.paths[path][method];
      const bodyParameter = operation.parameters.find(
        (parameter: any) => parameter.in === "body" && parameter.required === true
      );
      console.log(bodyParameter);
      file.push(`
        /* ${operation.description} */
        export async function ${operation.operationId} (
          ${parametersFromPath(path)}
          ${bodyParam(bodyParameter)}
        ) : Promise<${responseType(operation)}> {
          return window.fetch(\`https://management.azure.com${path.replace(/{/g, "${")}\`, { method: "${method}", ${
        bodyParameter ? "body: JSON.stringify(body)" : ""
      } }).then((response) => response.json())
        }
      `);
    }
  }

  writeFileSync("./models.ts", file.join(""));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
