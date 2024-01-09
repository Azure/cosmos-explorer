/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
require("dotenv/config");
const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CreateFileWebpack = require("create-file-webpack");
const childProcess = require("child_process");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const isCI = require("is-ci");

const gitSha = childProcess.execSync("git rev-parse HEAD").toString("utf8");

console.info("Packing library...");

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
        transpileOnly: false,
        configFile: "tsconfig.library.json",
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
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    new MonacoWebpackPlugin(),
    new EnvironmentPlugin(envVars),
  ];

  if (argv.analyze) {
    plugins.push(new BundleAnalyzerPlugin());
  }

  return {
    mode: mode,
    entry: {
      cosmosexplorer: "./src/libraryIndex.ts",
    },
    output: {
      chunkFilename: "[name].js",
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "",
      hashFunction: "xxhash64",
      libraryTarget: "umd",
      umdNamedDefine: true,
    },
    devtool: mode === "development" ? "eval-source-map" : "source-map",
    plugins,
    module: {
      rules,
    },
    resolve: {
      extensions: [".ts", ".tsx"],
      modules: [path.resolve(__dirname, "src"), "node_modules"],
      alias: {
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
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
    externals: {
      // Don't bundle react or react-dom
      react: {
        commonjs: "react",
        commonjs2: "react",
        amd: "React",
        root: "React",
      },
      "react-dom": {
        commonjs: "react-dom",
        commonjs2: "react-dom",
        amd: "ReactDOM",
        root: "ReactDOM",
      },
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
    stats: "minimal",
  };
};
