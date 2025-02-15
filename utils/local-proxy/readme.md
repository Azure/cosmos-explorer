# local-proxy

Lightweight host for Cosmos Explorer

## Quickstart

1. Pre-req - install packages for root project (`cd ../.. && npm ci && cd utils/local-proxy`)
2. Install - install packages for local-proxy (`npm ci`)
3. Pack - `npm run pack` - builds and packs Cosmos Explorer and copies files into project
4. Start - `npm start` - starts the proxy

```bash
cd ../..
npm ci
cd utils/local-proxy
npm ci
npm run pack
npm start
```

## Config

All config is current set via environment variables

| Name                         | Options (Default)                         | Description                                                  |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `PORT`                       | number (`1234`)                           | The port on which the proxy runs.                            |
| `LOG_LEVEL`                  | `debug`, `info`, `warn`, `error` (`info`) | The logging level for the proxy.                             |
| `EMULATOR_ENDPOINT`          | string (`http://localhost:8081`)          | The endpoint for the emulator which will be proxied.         |
| `ENDPOINT_DISCOVERY_ENABLED` | boolean (`false`)                         | Determine whether the proxy will rewrite the endpoint or not |

## Dependenies

Node.js v20+
npm (optional)

## Deployment

Copy the entire local-proxy directory to wherever you'd like. If you have npm, you can use `npm start`, else `node main.js`
