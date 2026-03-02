/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
require("dotenv/config");
const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const { EnvironmentPlugin } = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const CreateFileWebpack = require("create-file-webpack");
const childProcess = require("child_process");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const isCI = require("is-ci");

const gitSha = childProcess.execSync("git rev-parse HEAD").toString("utf8");

const AZURE_TENANT_ID = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const RESOURCE_GROUP = "de-e2e-tests";
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || process.env.NOTEBOOKS_TEST_RUNNER_CLIENT_SECRET; // TODO Remove. Exists for backwards compat with old .env files. Prefer AZURE_CLIENT_SECRET

if (!AZURE_CLIENT_SECRET) {
  console.warn("AZURE_CLIENT_SECRET is not set. testExplorer.html will not work.");
}

const cssRule = {
  test: /\.css$/,
  use: [MiniCssExtractPlugin.loader, "css-loader"],
};

const lessRule = {
  test: /\.less$/,
  use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"],
  exclude: [path.resolve(__dirname, "less/Common/Constants.less")],
};

const imagesRule = {
  test: /\.(jpg|jpeg|png|gif|svg|pdf|ico)$/,
  type: "asset/resource",
  generator: {
    // Add hash, because there are multiple versions of "delete.svg"
    filename: "images/[name].[hash][ext]",
  },
};

const fontRule = {
  test: /\.(woff|woff2|ttf|eot)$/,
  generator: {
    filename: "[name][ext]",
  },
};

const htmlRule = {
  test: /\.html$/,
  use: [
    {
      loader: "html-loader",
    },
  ],
};

// We compile our own code with ts-loader
const typescriptRule = {
  test: /\.tsx?$/,
  use: [
    {
      loader: "ts-loader",
      options: {
        transpileOnly: true,
      },
    },
  ],
  exclude: /node_modules/,
};

const javascriptRule = {
  test: /\.m?js$/,
  resolve: {
    fullySpecified: false,
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
/** @type {(_env: Record<string, string>, argv: Record<string, unknown>) => import("webpack").Configuration} */
module.exports = function (_env = {}, argv = {}) {
  const mode = argv.mode || "development";
  const rules = [fontRule, lessRule, imagesRule, cssRule, htmlRule, typescriptRule, javascriptRule];
  const envVars = {
    GIT_SHA: gitSha,
    PORT: process.env.PORT || "1234",
  };

  if (mode === "production") {
    envVars.NODE_ENV = "production";
  }

  if (mode === "development") {
    envVars.NODE_ENV = "development";
    envVars.AZURE_CLIENT_SECRET = AZURE_CLIENT_SECRET || null;
    envVars.RESOURCE_GROUP = RESOURCE_GROUP;
    typescriptRule.use[0].options.compilerOptions = { target: "ES2018" };
  }

  const entry = {
    main: "./src/Main.tsx",
    index: "./src/Index.tsx",
    quickstart: "./src/quickstart.ts",
    hostedExplorer: "./src/HostedExplorer.tsx",
    terminal: "./src/Terminal/index.ts",
    cellOutputViewer: "./src/CellOutputViewer/CellOutputViewer.tsx",
    galleryViewer: "./src/GalleryViewer/GalleryViewer.tsx",
    selfServe: "./src/SelfServe/SelfServe.tsx",
    connectToGitHub: "./src/GitHub/GitHubConnector.ts",
    ...(mode !== "production" && { testExplorer: "./test/testExplorer/TestExplorer.ts" }),
  };

  const htmlWebpackPlugins = [
    new HtmlWebpackPlugin({
      filename: "explorer.html",
      template: "src/explorer.html",
      chunks: ["main", "vendor", "vendor-fluentui", "vendor-nteract"],
    }),
    new HtmlWebpackPlugin({
      filename: "terminal.html",
      template: "src/Terminal/index.html",
      chunks: ["terminal"],
    }),
    new HtmlWebpackPlugin({
      filename: "quickstart.html",
      template: "src/quickstart.html",
      chunks: ["quickstart"],
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "src/index.html",
      chunks: ["index"],
    }),
    new HtmlWebpackPlugin({
      filename: "hostedExplorer.html",
      template: "src/hostedExplorer.html",
      chunks: ["hostedExplorer"],
    }),
    new HtmlWebpackPlugin({
      filename: "cellOutputViewer.html",
      template: "src/CellOutputViewer/cellOutputViewer.html",
      chunks: ["cellOutputViewer"],
    }),
    new HtmlWebpackPlugin({
      filename: "gallery.html",
      template: "src/GalleryViewer/galleryViewer.html",
      chunks: ["galleryViewer"],
    }),
    new HtmlWebpackPlugin({
      filename: "connectToGitHub.html",
      template: "src/connectToGitHub.html",
      chunks: ["connectToGitHub"],
    }),
    new HtmlWebpackPlugin({
      filename: "selfServe.html",
      template: "src/SelfServe/selfServe.html",
      chunks: ["selfServe"],
    }),
    ...(mode !== "production"
      ? [
          new HtmlWebpackPlugin({
            filename: "testExplorer.html",
            template: "test/testExplorer/testExplorer.html",
            chunks: ["testExplorer"],
          }),
        ]
      : []),
  ];

  const plugins = [
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new CreateFileWebpack({
      path: "./dist",
      fileName: "version.txt",
      content: `${gitSha.trim()} ${new Date().toUTCString()}`,
    }),
    // TODO Enable when @nteract once removed
    // ./node_modules/@nteract/markdown/node_modules/@nteract/presentational-components/lib/index.js line 63 breaks this with physical file Icon.js referred to as icon.js
    // new CaseSensitivePathsPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    ...htmlWebpackPlugins,
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/cellOutputViewer/]),
    new HTMLInlineCSSWebpackPlugin({
      filter: (fileName) => fileName.includes("cellOutputViewer"),
    }),
    new MonacoWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: "DataExplorer.nuspec" },
        { from: "DataExplorer.proj" },
        { from: "web.config" },
        { from: "quickstart/*.zip" },
      ],
    }),
    new EnvironmentPlugin(envVars),
  ];

  if (argv.analyze) {
    plugins.push(new BundleAnalyzerPlugin());
  }

  return {
    mode: mode,
    entry: entry,
    output: {
      chunkFilename: "[name].[chunkhash:6].js",
      filename: "[name].[chunkhash:6].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "",
      hashFunction: "xxhash64",
    },
    devtool: mode === "development" ? "eval-source-map" : "source-map",
    plugins,
    module: {
      rules,
    },
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
      alias: {
        process: "process/browser",
        "/sort_both.png": path.resolve(__dirname, "images/jquery.dataTables-images/sort_both.png"),
        "/sort_asc.png": path.resolve(__dirname, "images/jquery.dataTables-images/sort_asc.png"),
        "/sort_desc.png": path.resolve(__dirname, "images/jquery.dataTables-images/sort_desc.png"),
        "/sort_asc_disabled.png": path.resolve(__dirname, "images/jquery.dataTables-images/sort_asc_disabled.png"),
        "/sort_desc_disabled.png": path.resolve(__dirname, "images/jquery.dataTables-images/sort_desc_disabled.png"),
      },

      fallback: {
        crypto: false,
        fs: false,
        querystring: require.resolve("querystring-es3"),
      },
      extensions: [".tsx", ".ts", ".js"],
    },
    optimization: {
      minimize: mode === "production" ? true : false,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            // These options increase our initial bundle size by ~5% but the builds are significantly faster and won't run out of memory
            // Update 2/11/2025: we are removing this flag as our bundles sizes grew so that it can remove dead and unreachable code with compromise of build time
            // compress: false,
            mangle: {
              keep_fnames: true,
              keep_classnames: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 10,
        cacheGroups: {
          fluentui: {
            test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
            name: "vendor-fluentui",
            chunks: "all",
            priority: 30,
          },
          nteract: {
            test: /[\\/]node_modules[\\/]@nteract[\\/]/,
            name: "vendor-nteract",
            chunks: "all",
            priority: 30,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
            priority: 10,
          },
        },
      },
    },
    watch: false,
    // Hack since it is hard to disable watch entirely with webpack dev server https://github.com/webpack/webpack-dev-server/issues/1251#issuecomment-654240734
    watchOptions: isCI ? { poll: 24 * 60 * 60 * 1000 } : {},

    /** @type {import("webpack-dev-server").Configuration}*/
    devServer: {
      hot: false,
      // disableHostCheck is removed in webpack 5, use: allowedHosts: "all",
      // disableHostCheck: true,
      liveReload: !isCI,
      server: {
        type: "https",
      },
      host: "0.0.0.0",
      port: envVars.PORT,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "3600",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      setupMiddlewares: (middlewares, server) => {
        // Provide an HTTP API that will wait for compilation of all bundles to be completed.
        // This is used by Playwright to know when the server is ready to be tested.
        let compilationComplete = false;
        server.compiler.hooks.done.tap("done", () => {
          setImmediate(() => {
            compilationComplete = true;
          });
        });

        server.app.get("/_ready", (_, res) => {
          if (compilationComplete) {
            res.status(200).send("Compilation complete.");
          } else {
            res.status(503).send("Compilation not complete.");
          }
        });

        // Only handle OPTIONS for /api (preflight)
        if (server?.app) {
          server.app.options("/api", (_req, res) => res.sendStatus(200));
          server.app.options("/api/*", (_req, res) => res.sendStatus(200));
        }

        return middlewares;
      },
      proxy: [
        {
          context: ["/api"],
          target: "https://cdb-ms-mpac-pbe.cosmos.azure.com",
          changeOrigin: true,
          logLevel: "debug",
        },
        {
          context: ["/proxy"],
          target: "https://cdb-ms-mpac-pbe.cosmos.azure.com",
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
          pathRewrite: { "^/proxy": "" },
          router: (req) => req.headers["x-ms-proxy-target"],
        },
        {
          context: ["/_explorer"],
          target: process.env.EMULATOR_ENDPOINT || "https://localhost:8081/",
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
        },
        {
          context: ["/explorerProxy"],
          target: process.env.EMULATOR_ENDPOINT || "https://localhost:8081/",
          pathRewrite: { "^/explorerProxy": "" },
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
        },
        {
          context: [`/${AZURE_TENANT_ID}`],
          target: "https://login.microsoftonline.com/",
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
        },
      ],
    },
    stats: "minimal",
  };
};
