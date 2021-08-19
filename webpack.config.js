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

const AZURE_CLIENT_ID = "fd8753b0-0707-4e32-84e9-2532af865fb4";
const AZURE_TENANT_ID = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const SUBSCRIPTION_ID = "69e02f2d-f059-4409-9eac-97e8a276ae2c";
const RESOURCE_GROUP = "runners";
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
  loader: "file-loader",
  options: {
    name: "images/[name].[ext]",
  },
};

const fontRule = {
  test: /\.(woff|woff2|ttf|eot)$/,
  loader: "file-loader",
  options: {
    name: "[name].[ext]",
  },
};

const htmlRule = {
  test: /\.html$/,
  use: [
    {
      loader: "html-loader",
      options: {
        minify: false,
        removeComments: false,
        collapseWhitespace: false,
        root: path.resolve(__dirname, "images"),
      },
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = function (_env = {}, argv = {}) {
  const mode = argv.mode || "development";
  const rules = [fontRule, lessRule, imagesRule, cssRule, htmlRule, typescriptRule];
  const envVars = {
    GIT_SHA: gitSha,
    PORT: process.env.PORT || "1234",
  };

  if (mode === "production") {
    envVars.NODE_ENV = "production";
  }

  if (mode === "development") {
    envVars.NODE_ENV = "development";
    envVars.AZURE_CLIENT_ID = AZURE_CLIENT_ID;
    envVars.AZURE_TENANT_ID = AZURE_TENANT_ID;
    envVars.AZURE_CLIENT_SECRET = AZURE_CLIENT_SECRET;
    envVars.SUBSCRIPTION_ID = SUBSCRIPTION_ID;
    envVars.RESOURCE_GROUP = RESOURCE_GROUP;
    typescriptRule.use[0].options.compilerOptions = { target: "ES2018" };
  }

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
    new CaseSensitivePathsPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    new HtmlWebpackPlugin({
      filename: "explorer.html",
      template: "src/explorer.html",
      chunks: ["main"],
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
      filename: "testExplorer.html",
      template: "test/testExplorer/testExplorer.html",
      chunks: ["testExplorer"],
    }),
    new HtmlWebpackPlugin({
      filename: "Heatmap.html",
      template: "src/Controls/Heatmap/Heatmap.html",
      chunks: ["heatmap"],
    }),
    new HtmlWebpackPlugin({
      filename: "cellOutputViewer.html",
      template: "src/CellOutputViewer/cellOutputViewer.html",
      chunks: ["cellOutputViewer"],
    }),
    new HtmlWebpackPlugin({
      filename: "notebookViewer.html",
      template: "src/NotebookViewer/notebookViewer.html",
      chunks: ["notebookViewer"],
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
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/cellOutputViewer/]),
    new HTMLInlineCSSWebpackPlugin({
      filter: (fileName) => fileName.includes("cellOutputViewer"),
    }),
    new MonacoWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: "DataExplorer.nuspec" }, { from: "web.config" }, { from: "quickstart/*.zip" }],
    }),
    new EnvironmentPlugin(envVars),
  ];

  if (argv.analyze) {
    plugins.push(new BundleAnalyzerPlugin());
  }

  return {
    mode: mode,
    entry: {
      main: "./src/Main.tsx",
      index: "./src/Index.tsx",
      quickstart: "./src/quickstart.ts",
      hostedExplorer: "./src/HostedExplorer.tsx",
      testExplorer: "./test/testExplorer/TestExplorer.ts",
      heatmap: "./src/Controls/Heatmap/Heatmap.ts",
      terminal: "./src/Terminal/index.ts",
      cellOutputViewer: "./src/CellOutputViewer/CellOutputViewer.tsx",
      notebookViewer: "./src/NotebookViewer/NotebookViewer.tsx",
      galleryViewer: "./src/GalleryViewer/GalleryViewer.tsx",
      selfServe: "./src/SelfServe/SelfServe.tsx",
      connectToGitHub: "./src/GitHub/GitHubConnector.ts",
    },
    output: {
      chunkFilename: "[name].[chunkhash:6].js",
      filename: "[name].[chunkhash:6].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "",
    },
    devtool: mode === "development" ? "eval-source-map" : "source-map",
    plugins,
    module: {
      rules,
    },
    resolve: {
      alias: {
        process: "process/browser",
      },

      fallback: {
        crypto: false,
        fs: false,
      },
      extensions: [".tsx", ".ts", ".js"],
    },
    optimization: {
      minimize: mode === "production" ? true : false,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            // These options increase our initial bundle size by ~5% but the builds are significantly faster and won't run out of memory
            compress: false,
            mangle: {
              keep_fnames: true,
              keep_classnames: true,
            },
          },
        }),
      ],
    },
    watch: false,
    // Hack since it is hard to disable watch entirely with webpack dev server https://github.com/webpack/webpack-dev-server/issues/1251#issuecomment-654240734
    watchOptions: isCI ? { poll: 24 * 60 * 60 * 1000 } : {},
    devServer: {
      hot: false,
      disableHostCheck: true,
      inline: !isCI,
      liveReload: !isCI,
      https: true,
      host: "0.0.0.0",
      port: envVars.PORT,
      stats: "minimal",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "3600",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      proxy: {
        "/api": {
          target: "https://main.documentdb.ext.azure.com",
          changeOrigin: true,
          logLevel: "debug",
          bypass: (req, res) => {
            if (req.method === "OPTIONS") {
              res.statusCode = 200;
              res.send();
            }
          },
        },
        "/proxy": {
          target: "https://main.documentdb.ext.azure.com",
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
          pathRewrite: { "^/proxy": "" },
          router: (req) => {
            let newTarget = req.headers["x-ms-proxy-target"];
            return newTarget;
          },
        },
        "/_explorer": {
          target: process.env.EMULATOR_ENDPOINT || "https://localhost:8081/",
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
        },
        "/explorerProxy": {
          target: process.env.EMULATOR_ENDPOINT || "https://localhost:8081/",
          pathRewrite: { "^/explorerProxy": "" },
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
        },
        [`/${AZURE_TENANT_ID}`]: {
          target: "https://login.microsoftonline.com/",
          changeOrigin: true,
          secure: false,
          logLevel: "debug",
        },
      },
    },
    stats: "minimal",
  };
};
